// const mongoose = require("mongoose");

// const guideApplicationSchema = new mongoose.Schema(
//   {
//     fullName: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     dateOfBirth: {
//       type: Date,
//       required: true
//     },

//     gender: {
//       type: String,
//       required: true,
//       enum: ["Male", "Female", "Other"]
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true
//     },

//     phone: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     address: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     educationalQualification: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     tourismTraining: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     languagesKnown: {
//       type: [String],
//       required: true
//     },

//     identityProof: {
//       type: String,
//       required: true
//     },

//     educationalCertificate: {
//       type: String,
//       required: true
//     },

//     trainingCertificate: {
//       type: String,
//       required: true
//     },

//     applicationStatus: {
//       type: String,
//       enum: [
//         "Submitted",
//         "Under Verification",
//         "Approved",
//         "Rejected",
//         "Returned"
//       ],
//       default: "Submitted"
//     },

//     ageVerified: {
//       type: Boolean,
//       default: false
//     },

//     educationVerified: {
//       type: Boolean,
//       default: false
//     },

//     tourismTrainingVerified: {
//       type: Boolean,
//       default: false
//     },

//     languageVerified: {
//       type: Boolean,
//       default: false
//     },

//     identityVerified: {
//       type: Boolean,
//       default: false
//     },

//     policeVerification: {
//       type: String,
//       enum: ["Pending", "Verified", "Failed"],
//       default: "Pending"
//     },

//     medicalFitness: {
//       type: String,
//       enum: ["Pending", "Fit", "Unfit"],
//       default: "Pending"
//     },

//     officerRemarks: {
//       type: String,
//       default: "",
//       trim: true
//     }
//   },
//   {
//     timestamps: true
//   }
// );

// module.exports = mongoose.model(
//   "GuideApplication",
//   guideApplicationSchema
// );

const mongoose = require("mongoose");

function normalizeLanguages(value) {
  return Array.isArray(value)
    ? value.map((language) => String(language).trim()).filter(Boolean).join(", ")
    : value;
}

const applicationHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ["Submitted", "Resubmitted", "Verification Updated", "Decision"]
    },
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
    updatedBy: {
      type: String,
      enum: ["Applicant", "Officer", "Admin", "System"],
      default: "System"
    },
    verification: {
      ageVerified: Boolean,
      educationVerified: Boolean,
      tourismTrainingVerified: Boolean,
      languageVerified: Boolean,
      identityVerified: Boolean,
      policeVerification: {
        type: String,
        enum: ["Pending", "Verified", "Failed"]
      },
      medicalFitness: {
        type: String,
        enum: ["Pending", "Fit", "Unfit"]
      }
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const guideApplicationSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      index: true
    },

    // ==========================================
    // PERSONAL INFORMATION
    // ==========================================

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    dateOfBirth: {
      type: Date,
      required: true
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    district: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },


    // ==========================================
    // ELIGIBILITY INFORMATION
    // ==========================================

    educationalQualification: {
      type: String,
      required: true
    },

    tourismTraining: {
      type: String,
      required: true
    },

    languagesKnown: {
      type: String,
      required: true,
      set: normalizeLanguages
    },

    identityProof: {
      type: String,
      required: true
    },


    // ==========================================
    // UPLOADED DOCUMENTS
    // ==========================================

    governmentIdDocument: {
      type: String,
      required: true
    },

    educationalCertificate: {
      type: String,
      required: true
    },

    trainingCertificate: {
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

    passportPhoto: {
      type: String,
      required: true
    },


    // ==========================================
    // APPLICATION STATUS
    // ==========================================

    applicationStatus: {
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
    // ==========================================
// LICENSE INFORMATION
// ==========================================

licenseNumber: {
  type: String,
  unique: true,
  sparse: true,
  trim: true
},

licenseIssueDate: {
  type: Date
},

licenseExpiryDate: {
  type: Date
},

    // ==========================================
    // OFFICER VERIFICATION
    // ==========================================

    ageVerified: {
      type: Boolean,
      default: false
    },

    educationVerified: {
      type: Boolean,
      default: false
    },

    tourismTrainingVerified: {
      type: Boolean,
      default: false
    },

    languageVerified: {
      type: Boolean,
      default: false
    },

    identityVerified: {
      type: Boolean,
      default: false
    },

    policeVerification: {
      type: String,
      enum: [
        "Pending",
        "Verified",
        "Failed"
      ],
      default: "Pending"
    },

    medicalFitness: {
      type: String,
      enum: [
        "Pending",
        "Fit",
        "Unfit"
      ],
      default: "Pending"
    },

    officerRemarks: {
      type: String,
      default: ""
    },

    history: {
      type: [applicationHistorySchema],
      default: []
    }
  },

  {
    timestamps: true
  }
);

guideApplicationSchema.pre("init", function (document) {
  if (Array.isArray(document.languagesKnown)) {
    document.languagesKnown = normalizeLanguages(document.languagesKnown);
  }
});

module.exports = mongoose.model(
  "GuideApplication",
  guideApplicationSchema
);