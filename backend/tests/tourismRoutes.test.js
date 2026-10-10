const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");
const test = require("node:test");
const express = require("express");

const Applicant = require("../models/Applicant");
const GuideApplication = require("../models/GuideApplication");
const authenticateApplicant = require("../middleware/authenticateApplicant");
const originalFindOne = Applicant.findOne;
const originalFindById = Applicant.findById;
const originalCreate = Applicant.create;
const originalGuideApplicationFindOne = GuideApplication.findOne;
const secret = "tourism-feature-test-secret";
process.env.JWT_SECRET = secret;

Applicant.findOne = () => ({
  select: async () => null,
});
Applicant.create = async (applicant) => ({
  ...applicant,
  accountType: applicant.accountType,
});
Applicant.findById = (id) => ({
  select() {
    return {
      lean: async () => ({
        _id: id,
        email: `${id}@example.test`,
        accountType: id === "tourist-account" ? "Tourist" : "Guide",
      }),
    };
  },
});

const tourismRouter = require("../features/tourism/tourismRoutes");
const app = express();
app.use(express.json());
app.use("/api/tourism", tourismRouter);
app.get("/guide-only", authenticateApplicant, (req, res) =>
  res.status(200).json({ accountType: req.applicant.accountType })
);

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  Applicant.findOne = originalFindOne;
  Applicant.findById = originalFindById;
  Applicant.create = originalCreate;
  GuideApplication.findOne = originalGuideApplicationFindOne;
});

function accountToken(accountType, applicantId) {
  return jwt.sign(
    { applicantId, email: `${applicantId}@example.test`, accountType },
    secret,
    { expiresIn: "1h" }
  );
}

test("tourist registration creates a tourist account", async () => {
  const response = await fetch(`${baseUrl}/api/tourism/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Tourist Person",
      email: "tourist@example.test",
      mobile: "9876543210",
      password: "TouristPass123",
    }),
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.accountType, "Tourist");
});

test("tourism routes reject tourist accounts from starting guide tours", async () => {
  const response = await fetch(`${baseUrl}/api/tourism/tours`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accountToken("Tourist", "tourist-account")}`,
    },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 403);
  assert.match((await response.json()).message, /guide account/i);
});

test("guides without an approved, current license cannot start tours", async () => {
  let capturedGuideFilter;
  GuideApplication.findOne = (filter) => {
    capturedGuideFilter = filter;
    return {
      select() {
        return {
          lean: async () => null,
        };
      },
    };
  };

  const response = await fetch(`${baseUrl}/api/tourism/tours`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: [
        "Bearer",
        accountToken("Guide", "guide-account"),
      ].join(" "),
    },
    body: JSON.stringify({
      attractionId: "507f1f77bcf86cd799439011",
      latitude: 11.1271,
      longitude: 78.6569,
    }),
  });

  const responseData = await response.json();
  assert.equal(response.status, 403, responseData.message);
  assert.match(responseData.message, /approved license/i);
  assert.equal(capturedGuideFilter.applicationStatus, "Approved");
  assert.ok(capturedGuideFilter.licenseExpiryDate.$gt instanceof Date);
  assert.deepEqual(capturedGuideFilter.licenseNumber, {
    $exists: true,
    $nin: ["", null],
  });
});

test("tourism routes reject guide accounts from tourist tour check-in", async () => {
  const response = await fetch(`${baseUrl}/api/tourism/tours/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accountToken("Guide", "guide-account")}`,
    },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 403);
  assert.match((await response.json()).message, /tourist account/i);
});

test("tourist accounts cannot enter existing guide applicant routes", async () => {
  const response = await fetch(`${baseUrl}/guide-only`, {
    headers: {
      Authorization: `Bearer ${accountToken("Tourist", "tourist-account")}`,
    },
  });

  assert.equal(response.status, 403);
  assert.match((await response.json()).message, /guide account/i);
});

test("existing guide tokens remain valid for guide applicant routes", async () => {
  const response = await fetch(`${baseUrl}/guide-only`, {
    headers: {
      Authorization: `Bearer ${accountToken("Guide", "guide-account")}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).accountType, "Guide");
});
