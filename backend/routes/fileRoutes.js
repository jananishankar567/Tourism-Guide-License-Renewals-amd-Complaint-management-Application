const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const GuideApplication = require("../models/GuideApplication");
const LicenseRenewal = require("../models/LicenseRenewal");
const Complaint = require("../models/Complaint");

const router = express.Router();
const uploadDirectory = path.resolve(__dirname, "../uploads");
const applicationDocumentFields = [
  "governmentIdDocument",
  "educationalCertificate",
  "trainingCertificate",
  "policeCertificate",
  "medicalCertificate",
  "passportPhoto"
];

function endsWithFilename(filename) {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: `${escaped}$`, $options: "i" };
}

function getOwnerFilter(applicant) {
  return {
    $or: [
      { applicantId: applicant.applicantId },
      {
        applicantId: { $exists: false },
        email: applicant.email
      }
    ]
  };
}

async function applicantOwnsFile(filename, applicant) {
  const ownerFilter = getOwnerFilter(applicant);
  const fileMatch = endsWithFilename(filename);
  const application = await GuideApplication.findOne({
    $and: [
      ownerFilter,
      {
        $or: applicationDocumentFields.map((field) => ({ [field]: fileMatch }))
      }
    ]
  }).select("_id");

  if (application) {
    return true;
  }

  const ownedApplications = await GuideApplication.find(ownerFilter)
    .select("_id")
    .lean();
  const applicationIds = ownedApplications.map((record) => record._id);

  if (!applicationIds.length) {
    return false;
  }

  const [renewal, complaint] = await Promise.all([
    LicenseRenewal.findOne({
      applicationId: { $in: applicationIds },
      $or: [
        { governmentIdDocument: fileMatch },
        { policeCertificate: fileMatch },
        { medicalCertificate: fileMatch },
        { trainingCertificate: fileMatch },
        { passportPhoto: fileMatch }
      ]
    }).select("_id"),
    Complaint.findOne({
      applicationId: { $in: applicationIds },
      evidence: fileMatch
    }).select("_id")
  ]);

  return Boolean(renewal || complaint);
}

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication is required to access this document."
    });
  }

  try {
    req.user = jwt.verify(
      authorization.slice("Bearer ".length),
      process.env.JWT_SECRET
    );
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token."
    });
  }
}

router.get("/:filename", authenticate, async (req, res) => {
  const filename = path.basename(req.params.filename);
  if (
    !filename ||
    filename !== req.params.filename ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename)
  ) {
    return res.status(400).json({ message: "Invalid document path." });
  }

  try {
    let authorized = req.user.role === "Officer" || req.user.role === "Admin";

    if (!authorized && req.user.applicantId && req.user.email) {
      authorized = await applicantOwnsFile(filename, {
        applicantId: req.user.applicantId,
        email: req.user.email.toLowerCase()
      });
    }

    if (!authorized) {
      return res.status(404).json({ message: "Document not found." });
    }

    const absolutePath = path.resolve(uploadDirectory, filename);
    if (!absolutePath.startsWith(`${uploadDirectory}${path.sep}`)) {
      return res.status(400).json({ message: "Invalid document path." });
    }

    await fs.promises.access(absolutePath, fs.constants.R_OK);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(absolutePath, (error) => {
      if (!error || res.headersSent) {
        return;
      }
      if (error.code === "ENOENT" || error.code === "EACCES") {
        res.status(404).json({ message: "Document not found." });
        return;
      }
      console.error("Private document response error:", error);
      res.status(500).json({ message: "Unable to access document." });
    });
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EACCES") {
      return res.status(404).json({ message: "Document not found." });
    }
    console.error("Private document access error:", error);
    return res.status(500).json({ message: "Unable to access document." });
  }
});

module.exports = router;
