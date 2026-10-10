const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const jwt = require("jsonwebtoken");

const LicenseRenewal = require("../models/LicenseRenewal");
const GuideApplication = require("../models/GuideApplication");
const { sendEmail } = require("../utils/emailService");
const {
  authenticateOfficer,
  requireOfficer
} = require("../middleware/authMiddleware");

const router = express.Router();

function authenticateApplicant(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to continue."
      });
    }

    const decoded = jwt.verify(
      authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    if (!decoded.applicantId || !decoded.email) {
      return res.status(403).json({
        message: "Applicant access is required."
      });
    }

    req.applicant = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired applicant session."
    });
  }
}

function authenticateRenewalOfficer(req, res, next) {
  authenticateOfficer(req, res, () => {
    requireOfficer(req, res, next);
  });
}

function normalizeLanguages(value) {
  const languages = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : value.split(",");
          } catch {
            return value.split(",");
          }
        })()
      : [];

  return languages
    .map((language) => String(language).trim())
    .filter(Boolean)
    .join(", ");
}

function getRenewalNotification(renewal, application, status, remarks, expiryDate) {
  const details = [
    {
      label: "License number",
      value: renewal.previousLicenseNumber
    },
    {
      label: "Submitted",
      value: new Date(renewal.createdAt).toLocaleDateString("en-IN")
    }
  ];

  if (status === "Approved" && expiryDate) {
    details.push({
      label: "Renewed license valid until",
      value: new Date(expiryDate).toLocaleDateString("en-IN")
    });
  }

  return {
    to: application.email,
    subject: `Tourism Guide License Renewal – ${status}`,
    title: `Renewal Request ${status}`,
    greeting: `Dear ${application.fullName},`,
    message:
      status === "Approved"
        ? "Your tourism guide license renewal request has been reviewed and approved. Your license validity has been updated."
        : status === "Rejected"
          ? "Your tourism guide license renewal request has been reviewed and could not be approved. Please review the officer remarks below."
          : status === "Returned"
            ? "Your tourism guide license renewal request has been returned for correction. Please review the officer remarks below and take the required action."
            : "Your tourism guide license renewal request is now under verification. We will notify you when a decision is recorded.",
    details,
    status,
    remarks: remarks || ""
  };
}

/* =========================================
   MULTER CONFIGURATION
========================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, JPG and PNG files are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


/* =========================================
   SUBMIT LICENSE RENEWAL
========================================= */

router.post(
  "/",
  authenticateApplicant,
  upload.fields([
    {
      name: "governmentId",
      maxCount: 1
    },
    {
      name: "policeCertificate",
      maxCount: 1
    },
    {
      name: "medicalCertificate",
      maxCount: 1
    },
    {
      name: "trainingCertificate",
      maxCount: 1
    },
    {
      name: "passportPhoto",
      maxCount: 1
    }
  ]),

  async (req, res) => {
    try {
      const {
        applicationId,
        previousLicenseNumber,
        currentLicenseExpiryDate,
        renewalReason,
        updatedPhone,
        updatedAddress,
        updatedLanguagesKnown,
        additionalRemarks
      } = req.body;


      /* -----------------------------------------
         REQUIRED INFORMATION
      ----------------------------------------- */

      if (
        !applicationId ||
        !previousLicenseNumber ||
        !currentLicenseExpiryDate ||
        !renewalReason
      ) {
        return res.status(400).json({
          message:
            "Required renewal information is missing"
        });
      }


      /* -----------------------------------------
         CHECK APPLICATION ID
      ----------------------------------------- */

      const application =
        await GuideApplication.findOne({
          _id: applicationId,
          $or: [
            { applicantId: req.applicant.applicantId },
            {
              applicantId: { $exists: false },
              email: req.applicant.email
            }
          ]
        });

      if (!application) {
        return res.status(404).json({
          message:
            "Guide application not found"
        });
      }


      /* -----------------------------------------
         ONLY APPROVED LICENSES
      ----------------------------------------- */

      if (
        application.applicationStatus !==
        "Approved"
      ) {
        return res.status(400).json({
          message:
            "License renewal is allowed only for approved guides"
        });
      }

      if (
        !application.licenseNumber ||
        !application.licenseExpiryDate
      ) {
        return res.status(400).json({
          message:
            "Your approved application is missing license details required for renewal. Please contact the licensing officer."
        });
      }


      /* -----------------------------------------
         VERIFY LICENSE NUMBER
      ----------------------------------------- */

      if (
        application.licenseNumber !==
        previousLicenseNumber
      ) {
        return res.status(400).json({
          message:
            "The previous license number does not match the approved license"
        });
      }


      /* -----------------------------------------
         VERIFY EXPIRY DATE
      ----------------------------------------- */

      if (
        application.licenseExpiryDate &&
        currentLicenseExpiryDate
      ) {
        const applicationExpiry =
          new Date(
            application.licenseExpiryDate
          ).getTime();

        const submittedExpiry =
          new Date(
            currentLicenseExpiryDate
          ).getTime();

        if (
          applicationExpiry !==
          submittedExpiry
        ) {
          return res.status(400).json({
            message:
              "The submitted license expiry date does not match the existing license"
          });
        }
      }


      /* -----------------------------------------
         PREVENT DUPLICATE ACTIVE RENEWAL
      ----------------------------------------- */

      const existingRenewal =
        await LicenseRenewal.findOne({
          applicationId,

          renewalStatus: {
            $in: [
              "Submitted",
              "Under Verification"
            ]
          }
        });

      if (existingRenewal) {
        return res.status(400).json({
          message:
            "A renewal request is already in progress for this license",
          renewal: existingRenewal
        });
      }


      /* -----------------------------------------
         REQUIRED DOCUMENTS
      ----------------------------------------- */

      if (
        !req.files ||
        !req.files.governmentId ||
        !req.files.policeCertificate ||
        !req.files.medicalCertificate ||
        !req.files.passportPhoto
      ) {
        return res.status(400).json({
          message:
            "Government ID, police certificate, medical certificate and passport photo are required"
        });
      }


      /* -----------------------------------------
         FILE PATHS
      ----------------------------------------- */

      const governmentIdDocument =
        `/uploads/${req.files.governmentId[0].filename}`;

      const policeCertificate =
        `/uploads/${req.files.policeCertificate[0].filename}`;

      const medicalCertificate =
        `/uploads/${req.files.medicalCertificate[0].filename}`;

      const trainingCertificate =
        req.files.trainingCertificate &&
        req.files.trainingCertificate.length > 0
          ? `/uploads/${req.files.trainingCertificate[0].filename}`
          : undefined;

      const passportPhoto =
        `/uploads/${req.files.passportPhoto[0].filename}`;


      /* -----------------------------------------
         CONVERT LANGUAGES
      ----------------------------------------- */

      let languages = [];

      if (updatedLanguagesKnown) {
        try {
          languages =
            JSON.parse(updatedLanguagesKnown);

          if (!Array.isArray(languages)) {
            languages = [
              updatedLanguagesKnown
            ];
          }
        } catch {
          languages =
            updatedLanguagesKnown
              .split(",")
              .map((language) =>
                language.trim()
              )
              .filter(Boolean);
        }
      }


      /* -----------------------------------------
         CREATE RENEWAL
      ----------------------------------------- */

      const renewal =
        new LicenseRenewal({
          applicationId,

          previousLicenseNumber,

          currentLicenseExpiryDate,

          renewalReason,

          updatedPhone,

          updatedAddress,

          updatedLanguagesKnown:
            languages,

          governmentIdDocument,

          policeCertificate,

          medicalCertificate,

          trainingCertificate,

          passportPhoto,

          /*
             Applicant remarks are stored separately
             if the schema supports this field.
          */
          applicantRemarks:
            additionalRemarks || "",

          renewalStatus: "Submitted",
          history: [
            {
              status: "Submitted",
              remarks: "Renewal application submitted.",
              updatedBy: "Applicant"
            }
          ]
        });


      /* -----------------------------------------
         SAVE RENEWAL
      ----------------------------------------- */

      const savedRenewal =
        await renewal.save();


      console.log(
        "Renewal saved successfully:",
        savedRenewal._id
      );


      /* -----------------------------------------
         SUCCESS RESPONSE
      ----------------------------------------- */

      return res.status(201).json({
        message:
          "License renewal request submitted successfully",

        renewal: savedRenewal
      });

    } catch (error) {

      console.error(
        "Renewal submission error:",
        error
      );

      const statusCode =
        error.name === "ValidationError"
          ? 400
          : 500;

      return res.status(statusCode).json({
        message:
          "Failed to submit renewal request",

        error:
          error.message
      });
    }
  }
);

/* =========================================
   APPLICANT: GET MY RENEWALS
========================================= */

router.get(
  "/mine",
  authenticateApplicant,
  async (req, res) => {
    try {
      const application = await GuideApplication.findOne({
        email: req.applicant.email
      }).select("_id");

      if (!application) {
        return res.status(200).json([]);
      }

      const renewals = await LicenseRenewal.find({
        applicationId: application._id
      }).sort({ createdAt: -1 });

      return res.status(200).json(renewals);
    } catch (error) {
      console.error("Fetch applicant renewals error:", error);

      return res.status(500).json({
        message: "Failed to fetch your renewal history."
      });
    }
  }
);


/* =========================================
   GET ALL RENEWALS
   Used by Officer/Admin
========================================= */

router.get(
  "/",
  authenticateRenewalOfficer,
  async (req, res) => {
    try {
      const page = Number(req.query.page || 1);
      const pageSize = Number(req.query.pageSize || 25);
      const search = String(req.query.search || "").trim();
      const status = String(req.query.status || "All");
      const statuses = [
        "Submitted",
        "Under Verification",
        "Approved",
        "Returned",
        "Rejected"
      ];

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(pageSize) ||
        ![10, 25, 50, 100].includes(pageSize) ||
        search.length > 100 ||
        (status !== "All" && !statuses.includes(status))
      ) {
        return res.status(400).json({
          message: "Invalid renewal list filters."
        });
      }

      const filter = {};
      if (status !== "All") {
        filter.renewalStatus = status;
      }
      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matchingApplications = await GuideApplication.find({
          $or: ["fullName", "email", "licenseNumber"].map((field) => ({
            [field]: { $regex: escapedSearch, $options: "i" }
          }))
        }).distinct("_id");
        filter.$or = [
          { applicationId: { $in: matchingApplications } },
          { previousLicenseNumber: { $regex: escapedSearch, $options: "i" } },
          { renewalReason: { $regex: escapedSearch, $options: "i" } }
        ];
      }

      const [renewals, count, statusCounts] = await Promise.all([
        LicenseRenewal.find(filter)
          .populate("applicationId")
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        LicenseRenewal.countDocuments(filter),
        LicenseRenewal.aggregate([
          { $group: { _id: "$renewalStatus", count: { $sum: 1 } } }
        ])
      ]);

      const summary = Object.fromEntries(
        statuses.map((renewalStatus) => [
          renewalStatus,
          statusCounts.find((item) => item._id === renewalStatus)?.count || 0
        ])
      );

      return res.status(200).json({
        renewals,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        summary
      });

    } catch (error) {

      console.error(
        "Fetch renewals error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch renewal requests",

        error:
          error.message
      });
    }
  }
);


/* =========================================
   GET RENEWALS BY APPLICATION
========================================= */

router.get(
  "/application/:applicationId",
  authenticateApplicant,
  async (req, res) => {
    try {
      const application = await GuideApplication.findOne({
        _id: req.params.applicationId,
        email: req.applicant.email
      }).select("_id");

      if (!application) {
        return res.status(404).json({
          message: "Guide application not found."
        });
      }

      const renewals =
        await LicenseRenewal.find({
          applicationId: application._id
        })
        .sort({
          createdAt: -1
        });

      return res.status(200).json(
        renewals
      );

    } catch (error) {

      console.error(
        "Fetch renewal history error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch renewal history",

        error:
          error.message
      });
    }
  }
);

/* =========================================
   GET ONE RENEWAL
========================================= */

router.get(
  "/:id",
  authenticateRenewalOfficer,
  async (req, res) => {
    try {

      const renewal =
        await LicenseRenewal.findById(
          req.params.id
        )
        .populate("applicationId");

      if (!renewal) {
        return res.status(404).json({
          message:
            "Renewal request not found"
        });
      }

      return res.status(200).json(
        renewal
      );

    } catch (error) {

      console.error(
        "Fetch renewal error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch renewal request",

        error:
          error.message
      });
    }
  }
);


/* =========================================
   OFFICER REVIEW
========================================= */

router.put(
  "/:id/review",
  authenticateRenewalOfficer,
  async (req, res) => {
    const session = await mongoose.startSession();
    let renewal;
    let applicationToUpdate;
    let notificationData;
    let notificationStatus = "NotRequired";
    let notificationTrackingPending = false;
    let historyEntryTimestamp;
    try {
      const {
        renewalStatus,
        officerRemarks,
        renewedLicenseExpiryDate
      } = req.body;

      const allowedStatuses = [
        "Under Verification",
        "Approved",
        "Rejected",
        "Returned"
      ];

      if (
        !allowedStatuses.includes(
          renewalStatus
        )
      ) {
        return res.status(400).json({
          message: "Invalid renewal status"
        });
      }

      if (
        ["Returned", "Rejected"].includes(renewalStatus) &&
        !officerRemarks?.trim()
      ) {
        return res.status(400).json({
          message: "Officer remarks are required when returning or rejecting a renewal."
        });
      }

      await session.withTransaction(async () => {
        renewal = await LicenseRenewal.findById(req.params.id).session(session);
        if (!renewal) {
          const error = new Error("Renewal request not found.");
          error.statusCode = 404;
          throw error;
        }

        applicationToUpdate = await GuideApplication.findById(
          renewal.applicationId
        ).session(session);
        if (!applicationToUpdate) {
          const error = new Error("The guide application linked to this renewal was not found.");
          error.statusCode = 404;
          throw error;
        }

        if (renewalStatus === "Approved") {
          if (!renewedLicenseExpiryDate) {
            const error = new Error("New license expiry date is required for approval.");
            error.statusCode = 400;
            throw error;
          }

          const expiryDate = new Date(renewedLicenseExpiryDate);
          const currentExpiryDate = new Date(renewal.currentLicenseExpiryDate);
          if (
            Number.isNaN(expiryDate.getTime()) ||
            expiryDate <= new Date() ||
            expiryDate <= currentExpiryDate
          ) {
            const error = new Error(
              "The renewed license expiry date must be a valid date after the current expiry date."
            );
            error.statusCode = 400;
            throw error;
          }
        }

        const previousStatus = renewal.renewalStatus;
        const previousRemarks = renewal.officerRemarks || "";
        const nextRemarks =
          officerRemarks === undefined
            ? previousRemarks
            : String(officerRemarks).trim();
        const nextExpiry =
          renewalStatus === "Approved"
            ? new Date(renewedLicenseExpiryDate)
            : renewal.renewedLicenseExpiryDate;
        const notificationRequired =
          previousStatus !== renewalStatus ||
          previousRemarks !== nextRemarks ||
          (renewalStatus === "Approved" &&
            new Date(renewal.renewedLicenseExpiryDate).getTime() !== nextExpiry?.getTime());

        renewal.renewalStatus = renewalStatus;
        renewal.officerRemarks = nextRemarks;
        if (renewalStatus === "Approved") {
          renewal.renewedLicenseExpiryDate = nextExpiry;
        }

        historyEntryTimestamp = new Date();
        renewal.history.push({
          status: renewalStatus,
          remarks: nextRemarks,
          updatedBy: req.officer.email || req.officer.role || "Officer",
          updatedAt: historyEntryTimestamp,
          renewedLicenseExpiryDate:
            renewalStatus === "Approved" ? nextExpiry : undefined,
          notificationStatus: notificationRequired ? "Pending" : "NotRequired"
        });

        if (renewalStatus === "Approved") {
          applicationToUpdate.licenseExpiryDate = nextExpiry;
          applicationToUpdate.licenseIssueDate = new Date();

          if (renewal.updatedPhone) {
            applicationToUpdate.phone = renewal.updatedPhone;
          }
          if (renewal.updatedAddress) {
            applicationToUpdate.address = renewal.updatedAddress;
          }

          const updatedLanguages = normalizeLanguages(
            renewal.updatedLanguagesKnown
          );
          if (updatedLanguages) {
            applicationToUpdate.languagesKnown = updatedLanguages;
          }

          applicationToUpdate.applicationStatus = "Approved";
          await applicationToUpdate.save({
            session,
            validateModifiedOnly: true
          });
        }

        await renewal.save({ session });

        if (notificationRequired) {
          notificationData = getRenewalNotification(
            renewal,
            applicationToUpdate,
            renewalStatus,
            nextRemarks,
            nextExpiry
          );
        }
      });

      if (notificationData) {
        const emailResult = await sendEmail(notificationData);
        notificationStatus = emailResult.success ? "Sent" : "Failed";
        try {
          const result = await LicenseRenewal.updateOne(
            {
              _id: renewal._id,
              history: {
                $elemMatch: {
                  status: renewalStatus,
                  updatedAt: historyEntryTimestamp,
                  notificationStatus: "Pending"
                }
              }
            },
            {
              $set: {
                "history.$.notificationStatus": notificationStatus
              }
            }
          );

          const entry = renewal.history.find(
            (item) =>
              item.status === renewalStatus &&
              new Date(item.updatedAt).getTime() === historyEntryTimestamp.getTime()
          );
          if (entry && result.matchedCount === 1) {
            entry.notificationStatus = notificationStatus;
          } else {
            notificationTrackingPending = true;
            console.error(
              "Renewal email result could not be recorded:",
              renewal._id.toString()
            );
          }
        } catch (trackingError) {
          notificationTrackingPending = true;
          console.error(
            "Renewal email result could not be recorded:",
            trackingError
          );
        }

        if (!emailResult.success) {
          console.error(
            "Renewal decision email delivery failed:",
            renewal._id.toString()
          );
        }
      }

      return res.status(200).json({
        message: notificationTrackingPending
          ? "Renewal decision was saved, but the email delivery status could not be recorded. Refresh before retrying."
          : notificationStatus === "Failed"
            ? "Renewal request updated successfully, but the applicant email could not be delivered. You can retry it from the request history."
            : "Renewal request updated successfully",
        notificationStatus: notificationTrackingPending
          ? "Pending"
          : notificationStatus,
        renewal
      });
    } catch (error) {
      console.error(
        "Renewal review error:",
        error
      );
      const statusCode =
        error.statusCode ||
        (error.name === "ValidationError" ? 400 : 500);
      return res.status(statusCode).json({
        message:
          error.statusCode === 400 || error.statusCode === 404
            ? error.message
            : "Failed to update renewal request. Please check the review details and try again."
      });
    } finally {
      await session.endSession();
    }
  }
);

router.post(
  "/:id/notifications/retry",
  authenticateRenewalOfficer,
  async (req, res) => {
    try {
      const renewal = await LicenseRenewal.findById(req.params.id);
      if (!renewal) {
        return res.status(404).json({
          message: "Renewal request not found."
        });
      }

      const historyEntry = [...renewal.history]
        .reverse()
        .find((entry) =>
          ["Pending", "Failed"].includes(entry.notificationStatus)
        );

      if (!historyEntry) {
        return res.status(409).json({
          message: "There is no failed renewal notification to retry."
        });
      }

      const application = await GuideApplication.findById(
        renewal.applicationId
      ).select("email fullName");
      if (!application) {
        return res.status(404).json({
          message: "The guide application linked to this renewal was not found."
        });
      }

      const eventFilter = {
        status: historyEntry.status,
        updatedAt: historyEntry.updatedAt,
        notificationStatus: historyEntry.notificationStatus
      };
      const claim = await LicenseRenewal.updateOne(
        {
          _id: renewal._id,
          history: { $elemMatch: eventFilter }
        },
        { $set: { "history.$.notificationStatus": "Retrying" } }
      );
      if (claim.matchedCount !== 1) {
        return res.status(409).json({
          message: "This notification is already being retried."
        });
      }
      historyEntry.notificationStatus = "Retrying";

      const emailResult = await sendEmail(
        getRenewalNotification(
          renewal,
          application,
          historyEntry.status,
          historyEntry.remarks,
          historyEntry.renewedLicenseExpiryDate ||
            renewal.renewedLicenseExpiryDate
        )
      );
      const notificationStatus = emailResult.success ? "Sent" : "Failed";
      let trackingPending = false;
      try {
        const savedStatus = await LicenseRenewal.updateOne(
          {
            _id: renewal._id,
            history: {
              $elemMatch: {
                ...eventFilter,
                notificationStatus: "Retrying"
              }
            }
          },
          { $set: { "history.$.notificationStatus": notificationStatus } }
        );

        if (savedStatus.matchedCount === 1) {
          historyEntry.notificationStatus = notificationStatus;
        } else {
          trackingPending = true;
          console.error(
            "Renewal notification retry result could not be recorded:",
            renewal._id.toString()
          );
        }
      } catch (trackingError) {
        trackingPending = true;
        console.error(
          "Renewal notification retry result could not be recorded:",
          trackingError
        );
      }

      if (trackingPending) {
        return res.status(202).json({
          message: emailResult.success
            ? "Email was sent, but the delivery status could not be recorded. Refresh before retrying."
            : "Email delivery failed and its status could not be recorded. Refresh before retrying.",
          notificationStatus: "Retrying"
        });
      }

      if (!emailResult.success) {
        return res.status(502).json({
          message: "The notification could not be delivered. You can retry it again.",
          notificationStatus
        });
      }

      return res.status(200).json({
        message: "Renewal notification sent successfully.",
        notificationStatus
      });
    } catch (error) {
      console.error("Renewal notification retry error:", error);
      return res.status(500).json({
        message: "Unable to retry the renewal notification."
      });
    }
  }
);


/* =========================================
   MULTER / FILE ERROR HANDLER
========================================= */

router.use(
  (error, req, res, next) => {

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          message:
            "File size must not exceed 5 MB",
          error:
            "Each uploaded file must be 5 MB or smaller."
        });
      }

      return res.status(400).json({
        message:
          "File upload failed",
        error:
          error.message
      });
    }


    if (error) {

      return res.status(400).json({
        message:
          "File upload failed",
        error:
          error.message
      });
    }

    next();
  }
);


module.exports = router;