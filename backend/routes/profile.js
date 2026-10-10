
const express = require("express");
const jwt = require("jsonwebtoken");
const Applicant = require("../models/Applicant");
const GuideApplication = require("../models/GuideApplication");

const router = express.Router();

// Middleware: Verify applicant login token
const authenticateApplicant = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in to access your profile",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.applicantId) {
      return res.status(401).json({
        message: "Invalid applicant token",
      });
    }

    req.applicantId = decoded.applicantId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// GET: Fetch the logged-in applicant's profile
// URL: GET /api/profile/me
router.get("/me", authenticateApplicant, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.applicantId).select(
      "-password"
    );

    if (!applicant) {
      return res.status(404).json({
        message: "Applicant not found",
      });
    }

    res.status(200).json({ applicant });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
});

// PUT: Update the logged-in applicant's profile
// URL: PUT /api/profile/me
router.put("/me", authenticateApplicant, async (req, res) => {
  try {
    const { fullName, mobile } = req.body;

    if (!fullName || !mobile) {
      return res.status(400).json({
        message: "Full name and mobile number are required",
      });
    }

    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      return res.status(400).json({
        message: "Full name must contain 2 to 100 characters",
      });
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      return res.status(400).json({
        message: "Enter a valid 10-digit mobile number",
      });
    }

    const existingApplicant = await Applicant.findOne({
      mobile: mobile.trim(),
      _id: { $ne: req.applicantId },
    });

    if (existingApplicant) {
      return res.status(409).json({
        message: "This mobile number is already registered",
      });
    }

    const applicant = await Applicant.findByIdAndUpdate(
      req.applicantId,
      {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!applicant) {
      return res.status(404).json({
        message: "Applicant not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      applicant,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
});

// GET: Fetch applications belonging to the logged-in applicant
// URL: GET /api/profile/applications
router.get("/applications", authenticateApplicant, async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.applicantId).select(
      "email"
    );

    if (!applicant) {
      return res.status(404).json({
        message: "Applicant profile not found",
      });
    }

    const applications = await GuideApplication.find({
      $or: [
        { applicantId: req.applicantId },
        {
          applicantId: { $exists: false },
          email: applicant.email.toLowerCase(),
        },
      ],
    })
      .select(
        "_id fullName applicationStatus officerRemarks createdAt updatedAt licenseNumber licenseIssueDate licenseExpiryDate"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ applications });
  } catch (error) {
    console.error("Fetch applicant applications error:", error);

    res.status(500).json({
      message: "Failed to fetch applications",
    });
  }
});

module.exports = router;