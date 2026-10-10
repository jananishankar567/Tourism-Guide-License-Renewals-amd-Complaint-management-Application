const mongoose = require("mongoose");

const tourFeedbackSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourismTour",
      required: true,
      index: true,
    },
    touristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true,
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true,
    },
    attractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourismAttraction",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Feedback", "Complaint"],
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: function () {
        return this.type === "Feedback";
      },
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    moderationStatus: {
      type: String,
      enum: ["Pending", "Reviewed", "Hidden"],
      default: "Pending",
      index: true,
    },
    adminResponse: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

tourFeedbackSchema.index(
  { tourId: 1, touristId: 1, type: 1 },
  { unique: true }
);
tourFeedbackSchema.index({ guideId: 1, type: 1, moderationStatus: 1 });

module.exports = mongoose.model("TourismTourFeedback", tourFeedbackSchema);
