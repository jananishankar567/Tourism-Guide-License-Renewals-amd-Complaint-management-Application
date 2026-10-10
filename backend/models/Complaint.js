
const mongoose = require("mongoose");
const crypto = require("crypto");

const complaintHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "Submitted",
        "Under Review",
        "In Progress",
        "Action Taken",
        "Resolved",
        "Returned",
        "Rejected",
        "Closed"
      ]
    },
    remarks: {
      type: String,
      default: "",
      trim: true
    },
    updatedBy: {
      type: String,
      enum: ["Applicant", "Officer", "Admin", "System"],
      default: "System"
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
   referenceNumber: {
  type: String,
  unique: true,
  sparse: true
},

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideApplication",
      required: true
    },

    complainantName: {
      type: String,
      required: true,
      trim: true
    },

    complainantEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },

    complainantPhone: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Tourist Misconduct",
        "Harassment or Safety",
        "Overcharging",
        "False Information",
        "Tourist Site Facilities",
        "Damage to Tourist Property",
        "Service Issue",
        "Threat or Intimidation",
        "Other"
      ]
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    incidentDate: {
      type: Date,
      required: true
    },

    incidentLocation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
    },

    evidence: {
      type: [String],
      default: []
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium"
    },

    complaintStatus: {
      type: String,
      enum: [
        "Submitted",
        "Under Review",
        "In Progress",
        "Action Taken",
        "Resolved",
        "Returned",
        "Rejected",
        "Closed"
      ],
      default: "Submitted"
    },

    officerRemarks: {
      type: String,
      default: "",
      trim: true
    },

    resolution: {
      type: String,
      default: "",
      trim: true
    },

    history: {
      type: [complaintHistorySchema],
      default: []
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Generate a unique tracking reference for each new complaint.
complaintSchema.pre("validate", function () {
  if (!this.referenceNumber) {
    this.referenceNumber =
      "CMP-" +
      Date.now().toString().slice(-8) +
      "-" +
      crypto.randomBytes(2).toString("hex").toUpperCase();
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);