const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    touristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    distanceMeters: {
      type: Number,
      required: true,
    },
    locationVerified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const tourSchema = new mongoose.Schema(
  {
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true,
    },
    guideApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GuideApplication",
      required: true,
      index: true,
    },
    attractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourismAttraction",
      required: true,
      index: true,
    },
    tourCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Started", "Completed", "Cancelled"],
      default: "Started",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    guideStartDistanceMeters: {
      type: Number,
      required: true,
    },
    guideEndDistanceMeters: {
      type: Number,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationMessage: {
      type: String,
      default: "Awaiting tour completion and tourist confirmation.",
    },
  },
  { timestamps: true }
);

tourSchema.index({ guideId: 1, status: 1, createdAt: -1 });
tourSchema.index({ attractionId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("TourismTour", tourSchema);
