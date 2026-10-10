const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");

const Complaint = require("../models/Complaint");
const GuideApplication = require("../models/GuideApplication");

const {
  authenticateOfficer,
  requireOfficer,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// EVIDENCE UPLOAD CONFIGURATION
// ========================================

const uploadDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const safeName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, safeName);
  },
});

const allowedMimeTypes = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = allowedMimeTypes[file.mimetype] || [];

  if (validExtensions.includes(extension)) {
    return cb(null, true);
  }

  cb(new Error("Evidence must be a PDF, JPG, JPEG, or PNG file."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

// ========================================
// AUTHENTICATION HELPERS
// ========================================

// Applicant tokens must contain applicantId and email.
function authenticateApplicant(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.applicantId || !decoded.email) {
      return res.status(403).json({
        message: "Applicant access is required.",
      });
    }

    req.applicant = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired applicant session.",
    });
  }
}

function authenticateComplaintOfficer(req, res, next) {
  authenticateOfficer(req, res, () => {
    requireOfficer(req, res, next);
  });
}

// ========================================
// COMPLAINT PRIORITY SUGGESTION
// ========================================

// Rule-based initial priority. Officers should verify and can override it.
function suggestPriority(category, description) {
  const text = `${category || ""} ${description || ""}`.toLowerCase();

  const criticalKeywords = [
    "immediate danger",
    "life threatening",
    "life-threatening",
    "serious injury",
    "weapon",
    "physical assault",
    "being attacked",
    "emergency",
    "threat to life",
  ];

  if (criticalKeywords.some((keyword) => text.includes(keyword))) {
    return "Critical";
  }

  const highPriorityCategories = [
    "Harassment or Safety",
    "Threat or Intimidation",
  ];

  if (highPriorityCategories.includes(category)) {
    return "High";
  }

  const lowPriorityKeywords = [
    "minor inconvenience",
    "signboard",
    "direction board",
    "minor cleanliness issue",
  ];

  if (
    ["Service Issue", "Tourist Site Facilities"].includes(category) &&
    lowPriorityKeywords.some((keyword) => text.includes(keyword))
  ) {
    return "Low";
  }

  return "Medium";
}

// ========================================
// SUBMIT COMPLAINT
// ========================================

router.post(
  "/",
  authenticateApplicant,
  upload.array("evidence", 5),
  async (req, res) => {
    try {
      const {
        category,
        subject,
        description,
        incidentDate,
        incidentLocation,
        complainantPhone,
      } = req.body;

      if (
        !category ||
        !subject?.trim() ||
        !description?.trim() ||
        !incidentDate ||
        !incidentLocation?.trim() ||
        !complainantPhone?.trim()
      ) {
        return res.status(400).json({
          message: "Please complete all required complaint fields.",
        });
      }

      const validCategories = [
        "Tourist Misconduct",
        "Harassment or Safety",
        "Overcharging",
        "False Information",
        "Tourist Site Facilities",
        "Damage to Tourist Property",
        "Service Issue",
        "Threat or Intimidation",
        "Other",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: "Please select a valid complaint category.",
        });
      }

      const parsedIncidentDate = new Date(incidentDate);

      if (
        Number.isNaN(parsedIncidentDate.getTime()) ||
        parsedIncidentDate > new Date()
      ) {
        return res.status(400).json({
          message:
            "Please provide a valid incident date that is not in the future.",
        });
      }

      // Only approved guides may submit complaints.
      const application = await GuideApplication.findOne({
        applicationStatus: "Approved",
        $or: [
          { applicantId: req.applicant.applicantId },
          {
            applicantId: { $exists: false },
            email: req.applicant.email
          }
        ]
      });

      if (!application) {
        return res.status(403).json({
          message:
            "An approved guide license is required to submit a complaint.",
        });
      }

      const evidencePaths = (req.files || []).map(
        (file) => `/uploads/${file.filename}`
      );

      // Suggest an initial priority from the category and description.
      const suggestedPriority = suggestPriority(category, description);

      const complaint = new Complaint({
        applicationId: application._id,
        complainantName: application.fullName,
        complainantEmail: req.applicant.email,
        complainantPhone: complainantPhone.trim(),
        category,
        subject: subject.trim(),
        description: description.trim(),
        incidentDate: parsedIncidentDate,
        incidentLocation: incidentLocation.trim(),
        evidence: evidencePaths,
        complaintStatus: "Submitted",
        priority: suggestedPriority,
        history: [
          {
            status: "Submitted",
            remarks: `Complaint submitted. Initial priority suggestion: ${suggestedPriority}.`,
            updatedBy: "System",
          },
        ],
      });

      await complaint.save();

      return res.status(201).json({
        message: "Complaint submitted successfully.",
        complaint,
      });
    } catch (error) {
      console.error("Submit complaint error:", error);

      const statusCode =
        error.name === "ValidationError"
          ? 400
          : error.code === 11000
            ? 409
            : 500;

      return res.status(statusCode).json({
        message: "Failed to submit complaint.",
        error: error.message,
      });
    }
  }
);

// ========================================
// APPLICANT: GET MY COMPLAINTS
// ========================================

router.get("/mine", authenticateApplicant, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      complainantEmail: req.applicant.email,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Fetch applicant complaints error:", error);

    return res.status(500).json({
      message: "Unable to fetch your complaints.",
    });
  }
});

// ========================================
// APPLICANT: GET ONE OF MY COMPLAINTS
// ========================================

router.get("/mine/:id", authenticateApplicant, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      complainantEmail: req.applicant.email,
    });

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    return res.status(200).json(complaint);
  } catch (error) {
    return res.status(400).json({
      message: "Unable to fetch complaint details.",
    });
  }
});

// ========================================
// OFFICER: GET ALL COMPLAINTS
// ========================================

router.get("/", authenticateComplaintOfficer, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 25);
    const search = String(req.query.search || "").trim();
    const priority = String(req.query.priority || "All");
    const status = String(req.query.status || "All");
    const priorities = ["Critical", "High", "Medium", "Low"];
    const statuses = [
      "Submitted",
      "Under Review",
      "In Progress",
      "Action Taken",
      "Resolved",
      "Returned",
      "Rejected",
      "Closed"
    ];

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      ![10, 25, 50, 100].includes(pageSize) ||
      search.length > 100 ||
      (priority !== "All" && !priorities.includes(priority)) ||
      (status !== "All" && !statuses.includes(status))
    ) {
      return res.status(400).json({
        message: "Invalid complaint list filters."
      });
    }

    const filter = {};
    if (priority !== "All") {
      filter.priority = priority;
    }
    if (status !== "All") {
      filter.complaintStatus = status;
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingApplications = await GuideApplication.find({
        $or: ["fullName", "email", "licenseNumber"].map((field) => ({
          [field]: { $regex: escapedSearch, $options: "i" }
        }))
      }).distinct("_id");
      filter.$or = [
        ...[
          "referenceNumber",
          "subject",
          "category",
          "complainantName",
          "complainantEmail",
          "incidentLocation"
        ].map((field) => ({
          [field]: { $regex: escapedSearch, $options: "i" }
        })),
        { applicationId: { $in: matchingApplications } }
      ];
    }

    const [complaints, count, statusCounts, priorityCounts] = await Promise.all([
      Complaint.aggregate([
        { $match: filter },
        {
          $addFields: {
            priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "Critical"] }, then: 4 },
                  { case: { $eq: ["$priority", "High"] }, then: 3 },
                  { case: { $eq: ["$priority", "Medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "Low"] }, then: 1 }
                ],
                default: 0
              }
            }
          }
        },
        { $sort: { priorityRank: -1, createdAt: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        {
          $lookup: {
            from: GuideApplication.collection.name,
            localField: "applicationId",
            foreignField: "_id",
            as: "applicationId"
          }
        },
        {
          $unwind: {
            path: "$applicationId",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            referenceNumber: 1,
            applicationId: {
              fullName: "$applicationId.fullName",
              email: "$applicationId.email",
              phone: "$applicationId.phone",
              licenseNumber: "$applicationId.licenseNumber"
            },
            complainantName: 1,
            complainantEmail: 1,
            complainantPhone: 1,
            category: 1,
            subject: 1,
            description: 1,
            incidentDate: 1,
            incidentLocation: 1,
            evidence: 1,
            priority: 1,
            complaintStatus: 1,
            officerRemarks: 1,
            resolution: 1,
            history: 1,
            resolvedAt: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]),
      Complaint.countDocuments(filter),
      Complaint.aggregate([
        { $group: { _id: "$complaintStatus", count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);

    const summary = {
      total: statusCounts.reduce((total, item) => total + item.count, 0),
      pending: statusCounts
        .filter((item) =>
          ["Submitted", "Under Review", "In Progress"].includes(item._id)
        )
        .reduce((total, item) => total + item.count, 0),
      resolved: statusCounts
        .filter((item) => ["Resolved", "Closed"].includes(item._id))
        .reduce((total, item) => total + item.count, 0),
      critical: priorityCounts.find((item) => item._id === "Critical")?.count || 0
    };

    return res.status(200).json({
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
      summary,
      complaints,
    });
  } catch (error) {
    console.error("Fetch all complaints error:", error);

    return res.status(500).json({
      message: "Failed to fetch complaints.",
    });
  }
});

// ========================================
// OFFICER: UPDATE COMPLAINT
// ========================================

router.put(
  "/:id/review",
  authenticateComplaintOfficer,
  async (req, res) => {
    try {
      const {
        priority,
        complaintStatus,
        officerRemarks,
        resolution,
      } = req.body;

      const allowedPriorities = [
        "Low",
        "Medium",
        "High",
        "Critical",
      ];

      const allowedStatuses = [
        "Under Review",
        "In Progress",
        "Action Taken",
        "Resolved",
        "Returned",
        "Rejected",
        "Closed",
      ];

      if (
        priority !== undefined &&
        !allowedPriorities.includes(priority)
      ) {
        return res.status(400).json({
          message: "Invalid complaint priority.",
        });
      }

      if (
        complaintStatus !== undefined &&
        !allowedStatuses.includes(complaintStatus)
      ) {
        return res.status(400).json({
          message: "Invalid complaint status.",
        });
      }

      if (
        officerRemarks !== undefined &&
        typeof officerRemarks !== "string"
      ) {
        return res.status(400).json({
          message: "Officer remarks must be text.",
        });
      }

      if (
        resolution !== undefined &&
        typeof resolution !== "string"
      ) {
        return res.status(400).json({
          message: "Resolution must be text.",
        });
      }

      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        return res.status(404).json({
          message: "Complaint not found.",
        });
      }

      const previousStatus = complaint.complaintStatus;
      const previousOfficerRemarks = complaint.officerRemarks || "";
      const previousResolution = complaint.resolution || "";
      const nextOfficerRemarks =
        officerRemarks === undefined
          ? previousOfficerRemarks
          : officerRemarks.trim();
      const nextResolution =
        resolution === undefined ? previousResolution : resolution.trim();
      const nextStatus = complaintStatus || previousStatus;
      const statusChanged = nextStatus !== previousStatus;
      const remarksChanged = nextOfficerRemarks !== previousOfficerRemarks;
      const resolutionChanged = nextResolution !== previousResolution;

      if (priority !== undefined) {
        complaint.priority = priority;
      }

      if (officerRemarks !== undefined) {
        complaint.officerRemarks = officerRemarks.trim();
      }

      if (resolution !== undefined) {
        complaint.resolution = resolution.trim();
      }

      if (complaintStatus !== undefined) {
        complaint.complaintStatus = nextStatus;
      }

      if (statusChanged || remarksChanged || resolutionChanged) {
        complaint.history.push({
          status: nextStatus,
          remarks: [nextOfficerRemarks, nextResolution]
            .filter(Boolean)
            .join("\n\n"),
          updatedBy:
            req.officer.role === "Admin" ? "Admin" : "Officer",
          updatedAt: new Date(),
        });
      }

      if (statusChanged) {
        if (nextStatus === "Resolved") {
          complaint.resolvedAt = new Date();
        } else {
          complaint.resolvedAt = null;
        }
      }

      await complaint.save();

      if (statusChanged || remarksChanged || resolutionChanged) {
        const emailMessage = statusChanged
          ? nextStatus === "Resolved"
            ? "Your complaint has been reviewed and marked as resolved. Please sign in to the portal to view the recorded resolution."
            : nextStatus === "Rejected"
              ? "Your complaint has been reviewed and could not be accepted. Please review the officer remarks below."
              : nextStatus === "Returned"
                ? "Your complaint has been returned for additional information or correction. Please review the officer remarks below."
                : `The status of your complaint has been updated to ${nextStatus}. Sign in to the portal to review the latest information.`
          : "The reviewing officer has added an update to your complaint. Please sign in to the portal to review the remarks below.";

        await sendEmail({
          to: complaint.complainantEmail,
          subject: `Tourism Guide Portal – Complaint Update (${nextStatus})`,
          title: statusChanged
            ? `Complaint Status: ${nextStatus}`
            : "Complaint Review Update",
          greeting: `Dear ${complaint.complainantName},`,
          message: emailMessage,
          details: [
            {
              label: "Reference number",
              value: complaint.referenceNumber || "Not available"
            },
            {
              label: "Complaint subject",
              value: complaint.subject
            }
          ],
          status: nextStatus,
          remarks: [complaint.officerRemarks, complaint.resolution]
            .filter(Boolean)
            .join("\n\n")
        });
      }

      return res.status(200).json({
        message: "Complaint updated successfully.",
        complaint,
      });
    } catch (error) {
      console.error("Review complaint error:", error);

      return res.status(400).json({
        message: "Failed to update complaint.",
        error: error.message,
      });
    }
  }
);

// ========================================
// OFFICER: GET ONE COMPLAINT
// ========================================

router.get("/:id", authenticateComplaintOfficer, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate(
      "applicationId",
      "fullName email phone licenseNumber"
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    return res.status(200).json(complaint);
  } catch (error) {
    return res.status(400).json({
      message: "Unable to fetch complaint.",
    });
  }
});

// ========================================
// UPLOAD ERROR HANDLER
// ========================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each evidence file must be 5 MB or smaller."
        : error.code === "LIMIT_FILE_COUNT"
          ? "You can upload up to 5 evidence files."
          : "Evidence upload failed.";

    return res.status(400).json({ message });
  }

  if (error) {
    return res.status(400).json({
      message: error.message || "Request failed.",
    });
  }

  next();
});

module.exports = router;