const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const GuideApplication = require("../models/GuideApplication");
const authMiddleware = require("../middleware/authMiddleware");

const originalFind = GuideApplication.find;
const originalCountDocuments = GuideApplication.countDocuments;
const originalAggregate = GuideApplication.aggregate;
const originalAuthenticateOfficer = authMiddleware.authenticateOfficer;
const originalRequireOfficer = authMiddleware.requireOfficer;

let findCalls = 0;
let capturedFilter;

authMiddleware.authenticateOfficer = (req, res, next) => {
  req.officer = { role: "Admin" };
  next();
};
authMiddleware.requireOfficer = (req, res, next) => next();

GuideApplication.find = (filter) => {
  findCalls += 1;
  capturedFilter = filter;
  return {
    sort() {
      return this;
    },
    skip(value) {
      this.skipValue = value;
      return this;
    },
    limit(value) {
      this.limitValue = value;
      return this;
    },
    async lean() {
      return [{
        _id: "application-26",
        fullName: "Guide Applicant",
        applicationStatus: "Approved"
      }];
    }
  };
};
GuideApplication.countDocuments = async () => 26;
GuideApplication.aggregate = async () => [
  { _id: "Submitted", count: 2 },
  { _id: "Approved", count: 24 }
];

const applicationRouter = require("../routes/adminApplicationRoutes");
const app = express();
app.use("/api/admin/applications", applicationRouter);

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
  GuideApplication.find = originalFind;
  GuideApplication.countDocuments = originalCountDocuments;
  GuideApplication.aggregate = originalAggregate;
  authMiddleware.authenticateOfficer = originalAuthenticateOfficer;
  authMiddleware.requireOfficer = originalRequireOfficer;
});

test("application list returns page metadata and global status summary", async () => {
  const response = await fetch(
    `${baseUrl}/api/admin/applications?page=2&pageSize=25&search=Guide&status=Approved`
  );
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.count, 26);
  assert.equal(data.page, 2);
  assert.equal(data.pageSize, 25);
  assert.equal(data.totalPages, 2);
  assert.equal(data.summary.Submitted, 2);
  assert.equal(data.summary.Approved, 24);
  assert.equal(data.applications.length, 1);
  assert.equal(findCalls, 1);
  assert.equal(capturedFilter.applicationStatus, "Approved");
  assert.equal(capturedFilter.$or[0].fullName.$regex, "Guide");
});

test("application list rejects unsupported pagination sizes", async () => {
  const callsBeforeRequest = findCalls;
  const response = await fetch(
    `${baseUrl}/api/admin/applications?page=1&pageSize=999`
  );

  assert.equal(response.status, 400);
  assert.equal(findCalls, callsBeforeRequest);
});
