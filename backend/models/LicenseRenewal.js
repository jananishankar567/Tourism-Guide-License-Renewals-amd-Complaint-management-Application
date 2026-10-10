const mongoose = require("mongoose");

const renewalHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "Submitted",
        "Under Verification",
        "Approved",
        "Rejected",
        "Returned"
      ]
    },
    remarks: {
      type: String,
      default: "",
      trim: true
    },
    renewedLicenseExpiryDate: {
      type: Date
    },
    updatedBy: {
      type: String,
      default: "System",
      trim: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notificationStatus: {
      type: String,
      enum: ["NotRequired", "Pending", "Retrying", "Sent", "Failed"],
      default: "NotRequired"
    }
  },
  { _id: false }
);

const licenseRenewalSchema = new mongoose.Schema(
  {
    /* =========================================
       LINK TO ORIGINAL GUIDE APPLICATION
    ========================================= */

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideApplication",
      required: true
    },

    /* =========================================
       PREVIOUS LICENSE DETAILS
    ========================================= */

    previousLicenseNumber: {
      type: String,
      required: true,
      trim: true
    },

    currentLicenseExpiryDate: {
      type: Date,
      required: true
    },

    /* =========================================
       RENEWAL INFORMATION
    ========================================= */

    renewalReason: {
      type: String,
      required: true,
      trim: true
    },

    /* =========================================
       UPDATED APPLICANT DETAILS
    ========================================= */

    updatedPhone: {
      type: String,
      trim: true
    },

    updatedAddress: {
      type: String,
      trim: true
    },

    updatedLanguagesKnown: {
      type: [String],
      default: []
    },

    /* =========================================
       APPLICANT REMARKS
    ========================================= */

    applicantRemarks: {
      type: String,
      default: "",
      trim: true
    },

    /* =========================================
       RENEWAL DOCUMENTS
    ========================================= */

    governmentIdDocument: {
      type: String,
      required: true
    },

    policeCertificate: {
      type: String,
      required: true
    },

    medicalCertificate: {
      type: String,
      required: true
    },

    trainingCertificate: {
      type: String,
      default: ""
    },

    passportPhoto: {
      type: String,
      required: true
    },

    /* =========================================
       RENEWAL STATUS
    ========================================= */

    renewalStatus: {
      type: String,
      enum: [
        "Submitted",
        "Under Verification",
        "Approved",
        "Rejected",
        "Returned"
      ],
      default: "Submitted"
    },

    history: {
      type: [renewalHistorySchema],
      default: []
    },

    /* =========================================
       OFFICER REVIEW
    ========================================= */

    officerRemarks: {
      type: String,
      default: "",
      trim: true
    },

    /* =========================================
       NEW LICENSE EXPIRY DATE
    ========================================= */

    renewedLicenseExpiryDate: {
      type: Date
    }
  },

  {
    timestamps: true
  }
);


/* =========================================
   EXPORT MODEL
========================================= */

module.exports = mongoose.model(
  "LicenseRenewal",
  licenseRenewalSchema
);