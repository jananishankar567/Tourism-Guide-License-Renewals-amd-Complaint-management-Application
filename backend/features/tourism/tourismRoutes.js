const crypto = require("node:crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Applicant = require("../../models/Applicant");
const GuideApplication = require("../../models/GuideApplication");
const { authenticateOfficer, requireAdmin } = require("../../middleware/authMiddleware");
const Attraction = require("./models/Attraction");
const Tour = require("./models/Tour");
const TourFeedback = require("./models/TourFeedback");
const {
  GEOFENCE_RADIUS_METERS,
  distanceInMeters,
  isValidCoordinates,
} = require("./geo");

const router = express.Router();

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

function isValidId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

async function authenticateTourismAccount(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return sendError(res, 401, "Please sign in to continue.");
  }

  try {
    const decoded = jwt.verify(
      authorization.slice("Bearer ".length),
      process.env.JWT_SECRET
    );
    const applicant = await Applicant.findById(decoded.applicantId)
      .select("_id email accountType")
      .lean();
    if (!applicant || applicant.email !== decoded.email) {
      return sendError(res, 401, "This account session is no longer valid.");
    }
    req.applicant = {
      applicantId: applicant._id,
      email: applicant.email,
      accountType: applicant.accountType || "Guide",
    };
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return sendError(res, 401, "Your session is invalid or has expired.");
    }
    console.error("Tourism account authentication error:", error);
    return sendError(res, 500, "Unable to verify your account.");
  }
}

function requireAccountType(accountType) {
  return (req, res, next) => {
    if (req.applicant?.accountType !== accountType) {
      return sendError(
        res,
        403,
        accountType === "Tourist"
          ? "A tourist account is required."
          : "A guide account is required."
      );
    }
    return next();
  };
}

const authenticateTourist = [
  authenticateTourismAccount,
  requireAccountType("Tourist"),
];

const authenticateGuide = [
  authenticateTourismAccount,
  requireAccountType("Guide"),
];

function validateAttractionInput(body) {
  const { name, district, description = "", latitude, longitude } = body;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof district !== "string" ||
    !district.trim() ||
    typeof description !== "string" ||
    !isValidCoordinates(latitude, longitude)
  ) {
    return null;
  }

  return {
    name: name.trim(),
    district: district.trim(),
    description: description.trim(),
    latitude,
    longitude,
  };
}

async function getCurrentGuide(guideId) {
  return GuideApplication.findOne({
    applicantId: guideId,
    applicationStatus: "Approved",
    licenseExpiryDate: { $gt: new Date() },
    licenseNumber: { $exists: true, $nin: ["", null] },
  })
    .select(
      "_id fullName email district languagesKnown licenseNumber licenseExpiryDate applicationStatus"
    )
    .lean();
}

// Tourist accounts share the existing sign-in route but use a separate signup form.
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;
    if (
      typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof mobile !== "string" ||
      !/^\d{10}$/.test(mobile) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return sendError(
        res,
        400,
        "Enter a valid name, email, 10-digit mobile number, and password of at least 8 characters."
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingAccount = await Applicant.findOne({
      $or: [{ email: normalizedEmail }, { mobile }],
    }).select("_id");

    if (existingAccount) {
      return sendError(
        res,
        409,
        "An account with this email or mobile number already exists."
      );
    }

    const tourist = await Applicant.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile,
      password: await bcrypt.hash(password, 10),
      accountType: "Tourist",
    });

    return res.status(201).json({
      message: "Tourist account created successfully. Please sign in.",
      accountType: tourist.accountType,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "An account with this email or mobile number already exists."
      );
    }
    console.error("Tourist registration error:", error);
    return sendError(res, 500, "Unable to create your tourist account.");
  }
});

// Public attraction list; coordinates are shown as map-friendly location details.
router.get("/locations", async (req, res) => {
  try {
    const locations = await Attraction.find({ active: true })
      .select("name district description latitude longitude")
      .sort({ district: 1, name: 1 })
      .lean();
    return res.status(200).json({ locations });
  } catch (error) {
    console.error("Tourist attraction list error:", error);
    return sendError(res, 500, "Unable to load tourist locations.");
  }
});

router.get("/guides", async (req, res) => {
  try {
    const { locationId } = req.query;
    if (typeof locationId !== "string" || !/^[a-f\d]{24}$/i.test(locationId)) {
      return sendError(res, 400, "Choose a valid tourist location.");
    }

    const attraction = await Attraction.findOne({
      _id: locationId,
      active: true,
    }).lean();
    if (!attraction) {
      return sendError(res, 404, "Tourist location not found.");
    }

    const guides = await GuideApplication.find({
      applicationStatus: "Approved",
      licenseExpiryDate: { $gt: new Date() },
      licenseNumber: { $exists: true, $nin: ["", null] },
      district: {
        $regex: `^\\s*${attraction.district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
        $options: "i",
      },
    })
      .select(
        "_id applicantId fullName district languagesKnown licenseNumber licenseExpiryDate"
      )
      .sort({ fullName: 1 })
      .lean();

    const ratings = await TourFeedback.aggregate([
      {
        $match: {
          guideId: { $in: guides.map((guide) => guide.applicantId) },
          type: "Feedback",
          moderationStatus: { $ne: "Hidden" },
        },
      },
      {
        $group: {
          _id: "$guideId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    const ratingsByGuide = new Map(
      ratings.map((rating) => [String(rating._id), rating])
    );

    return res.status(200).json({
      location: {
        id: attraction._id,
        name: attraction.name,
        district: attraction.district,
      },
      guides: guides.map((guide) => {
        const rating = ratingsByGuide.get(String(guide.applicantId));
        return {
          id: guide.applicantId,
          name: guide.fullName,
          district: guide.district,
          languages: guide.languagesKnown,
          licenseNumber: guide.licenseNumber,
          licenseExpiryDate: guide.licenseExpiryDate,
          verified: true,
          averageRating: rating
            ? Math.round(rating.averageRating * 10) / 10
            : null,
          reviewCount: rating?.reviewCount || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Verified guide discovery error:", error);
    return sendError(res, 500, "Unable to load verified guides.");
  }
});

router.post("/tours", authenticateGuide, async (req, res) => {
  try {
    const { attractionId, latitude, longitude } = req.body;
    if (
      !isValidId(attractionId) ||
      !isValidCoordinates(latitude, longitude)
    ) {
      return sendError(res, 400, "Choose a location and share a valid GPS position.");
    }

    const guide = await getCurrentGuide(req.applicant.applicantId);
    if (!guide) {
      return sendError(
        res,
        403,
        "Only guides with a currently valid approved license can start tours."
      );
    }

    const attraction = await Attraction.findOne({
      _id: attractionId,
      active: true,
    }).lean();
    if (!attraction) {
      return sendError(res, 404, "Tourist location not found.");
    }

    const distance = distanceInMeters(
      { latitude, longitude },
      { latitude: attraction.latitude, longitude: attraction.longitude }
    );
    if (distance > GEOFENCE_RADIUS_METERS) {
      return sendError(
        res,
        400,
        `You are ${Math.round(distance)} meters from this attraction. Start within ${GEOFENCE_RADIUS_METERS} meters.`
      );
    }

    const runningTour = await Tour.findOne({
      guideId: req.applicant.applicantId,
      status: "Started",
    }).select("_id");
    if (runningTour) {
      return sendError(res, 409, "Complete or cancel your current tour first.");
    }

    const tour = await Tour.create({
      guideId: req.applicant.applicantId,
      guideApplicationId: guide._id,
      attractionId,
      tourCode: crypto.randomBytes(5).toString("hex").toUpperCase(),
      guideStartDistanceMeters: Math.round(distance),
    });
    const populatedTour = await Tour.findById(tour._id)
      .populate("attractionId", "name district latitude longitude")
      .lean();

    return res.status(201).json({ tour: populatedTour });
  } catch (error) {
    console.error("Guide tour start error:", error);
    return sendError(res, 500, "Unable to start this tour.");
  }
});

router.get("/guide/tours", authenticateGuide, async (req, res) => {
  try {
    const tours = await Tour.find({ guideId: req.applicant.applicantId })
      .populate("attractionId", "name district")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({ tours });
  } catch (error) {
    console.error("Guide tour history error:", error);
    return sendError(res, 500, "Unable to load your tour history.");
  }
});

router.post("/tours/join", authenticateTourist, async (req, res) => {
  try {
    const { code, latitude, longitude } = req.body;
    if (
      typeof code !== "string" ||
      !/^[a-f\d]{10}$/i.test(code.trim()) ||
      !isValidCoordinates(latitude, longitude)
    ) {
      return sendError(res, 400, "Scan a valid tour QR code and share your GPS position.");
    }

    const tour = await Tour.findOne({
      tourCode: code.trim().toUpperCase(),
      status: "Started",
    });
    if (!tour) {
      return sendError(res, 404, "This tour is no longer accepting participants.");
    }
    if (Date.now() - tour.startedAt.getTime() > 12 * 60 * 60 * 1000) {
      tour.status = "Cancelled";
      tour.completedAt = new Date();
      tour.verificationMessage = "Tour QR expired after 12 hours.";
      await tour.save();
      return sendError(res, 410, "This tour QR code has expired.");
    }

    const alreadyJoined = tour.participants.some(
      (participant) =>
        String(participant.touristId) === String(req.applicant.applicantId)
    );
    if (alreadyJoined) {
      return res.status(200).json({
        message: "You are already checked in to this tour.",
        tourId: tour._id,
        locationVerified: true,
      });
    }

    const attraction = await Attraction.findById(tour.attractionId).lean();
    if (!attraction) {
      return sendError(res, 404, "Tour location could not be verified.");
    }

    const distance = distanceInMeters(
      { latitude, longitude },
      { latitude: attraction.latitude, longitude: attraction.longitude }
    );
    if (distance > GEOFENCE_RADIUS_METERS) {
      return sendError(
        res,
        400,
        `You are ${Math.round(distance)} meters from this attraction. Check in within ${GEOFENCE_RADIUS_METERS} meters.`
      );
    }
    if (tour.participants.length >= 200) {
      return sendError(res, 409, "This tour has reached its participant limit.");
    }

    tour.participants.push({
      touristId: req.applicant.applicantId,
      distanceMeters: Math.round(distance),
      locationVerified: true,
    });
    await tour.save();

    return res.status(201).json({
      message: "Your presence at this tour has been GPS verified.",
      tourId: tour._id,
      locationVerified: true,
    });
  } catch (error) {
    console.error("Tourist tour check-in error:", error);
    return sendError(res, 500, "Unable to verify your tour participation.");
  }
});

router.post("/tours/:id/complete", authenticateGuide, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "Invalid tour.");
    }
    const { latitude, longitude } = req.body;
    if (!isValidCoordinates(latitude, longitude)) {
      return sendError(res, 400, "A valid GPS position is required to complete the tour.");
    }

    const tour = await Tour.findOne({
      _id: req.params.id,
      guideId: req.applicant.applicantId,
      status: "Started",
    });
    if (!tour) {
      return sendError(res, 404, "Active tour not found.");
    }

    const attraction = await Attraction.findById(tour.attractionId).lean();
    if (!attraction) {
      return sendError(res, 404, "Tour location could not be verified.");
    }

    const distance = distanceInMeters(
      { latitude, longitude },
      { latitude: attraction.latitude, longitude: attraction.longitude }
    );
    if (distance > GEOFENCE_RADIUS_METERS) {
      return sendError(
        res,
        400,
        `You are ${Math.round(distance)} meters from this attraction. Complete the tour within ${GEOFENCE_RADIUS_METERS} meters.`
      );
    }

    tour.status = "Completed";
    tour.completedAt = new Date();
    tour.guideEndDistanceMeters = Math.round(distance);
    tour.verified = tour.participants.some(
      (participant) => participant.locationVerified
    );
    tour.verificationMessage = tour.verified
      ? "Guide GPS and tourist check-in were verified at the attraction."
      : "Guide location was verified, but no tourist has completed QR check-in.";
    await tour.save();

    return res.status(200).json({
      message: tour.verificationMessage,
      tour,
    });
  } catch (error) {
    console.error("Guide tour completion error:", error);
    return sendError(res, 500, "Unable to complete this tour.");
  }
});

router.post("/tours/:id/cancel", authenticateGuide, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "Invalid tour.");
    }
    const tour = await Tour.findOneAndUpdate(
      {
        _id: req.params.id,
        guideId: req.applicant.applicantId,
        status: "Started",
      },
      { status: "Cancelled", completedAt: new Date() },
      { new: true }
    );
    if (!tour) {
      return sendError(res, 404, "Active tour not found.");
    }
    return res.status(200).json({ message: "Tour cancelled.", tour });
  } catch (error) {
    console.error("Guide tour cancellation error:", error);
    return sendError(res, 500, "Unable to cancel this tour.");
  }
});

router.get("/tours/mine", authenticateTourist, async (req, res) => {
  try {
    const tours = await Tour.find({
      "participants.touristId": req.applicant.applicantId,
    })
      .populate("attractionId", "name district")
      .populate("guideApplicationId", "fullName licenseNumber")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const feedback = await TourFeedback.find({
      touristId: req.applicant.applicantId,
    })
      .select("tourId type")
      .lean();
    const submitted = new Set(
      feedback.map((entry) => `${entry.tourId}:${entry.type}`)
    );

    return res.status(200).json({
      tours: tours.map((tour) => ({
        ...tour,
        hasFeedback: submitted.has(`${tour._id}:Feedback`),
        hasComplaint: submitted.has(`${tour._id}:Complaint`),
      })),
    });
  } catch (error) {
    console.error("Tourist tour history error:", error);
    return sendError(res, 500, "Unable to load your tour history.");
  }
});

router.get("/feedback/mine", authenticateTourist, async (req, res) => {
  try {
    const entries = await TourFeedback.find({
      touristId: req.applicant.applicantId,
    })
      .populate("tourId", "completedAt verified")
      .populate("guideId", "fullName")
      .populate("attractionId", "name district")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Tourist feedback history error:", error);
    return sendError(res, 500, "Unable to load your feedback and complaints.");
  }
});

router.post("/tours/:id/feedback", authenticateTourist, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "Invalid tour.");
    }
    const { rating, message } = req.body;
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof message !== "string" ||
      message.trim().length < 5 ||
      message.trim().length > 3000
    ) {
      return sendError(res, 400, "Provide a 1–5 star rating and feedback of at least 5 characters.");
    }

    const tour = await Tour.findOne({
      _id: req.params.id,
      status: "Completed",
      verified: true,
      participants: {
        $elemMatch: {
          touristId: req.applicant.applicantId,
          locationVerified: true,
        },
      },
    });
    if (!tour) {
      return sendError(
        res,
        403,
        "Feedback is available only after a GPS-verified tour you joined."
      );
    }

    const feedback = await TourFeedback.create({
      tourId: tour._id,
      touristId: req.applicant.applicantId,
      guideId: tour.guideId,
      attractionId: tour.attractionId,
      type: "Feedback",
      rating,
      message: message.trim(),
    });
    return res.status(201).json({
      message: "Your verified feedback has been submitted.",
      feedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "You have already submitted feedback for this tour.");
    }
    console.error("Tour feedback submission error:", error);
    return sendError(res, 500, "Unable to submit tour feedback.");
  }
});

router.post("/tours/:id/complaints", authenticateTourist, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "Invalid tour.");
    }
    const { message } = req.body;
    if (
      typeof message !== "string" ||
      message.trim().length < 10 ||
      message.trim().length > 3000
    ) {
      return sendError(res, 400, "Describe the complaint in at least 10 characters.");
    }

    const tour = await Tour.findOne({
      _id: req.params.id,
      verified: true,
      participants: {
        $elemMatch: {
          touristId: req.applicant.applicantId,
          locationVerified: true,
        },
      },
    });
    if (!tour) {
      return sendError(
        res,
        403,
        "A complaint can be linked only to a tour where your presence was GPS verified."
      );
    }

    const complaint = await TourFeedback.create({
      tourId: tour._id,
      touristId: req.applicant.applicantId,
      guideId: tour.guideId,
      attractionId: tour.attractionId,
      type: "Complaint",
      message: message.trim(),
    });
    return res.status(201).json({
      message: "Your tour complaint has been sent for admin review.",
      complaint,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "You have already submitted a complaint for this tour.");
    }
    console.error("Tour complaint submission error:", error);
    return sendError(res, 500, "Unable to submit tour complaint.");
  }
});

// Admin-controlled attraction setup.
router.get("/admin/locations", authenticateOfficer, requireAdmin, async (req, res) => {
  try {
    const locations = await Attraction.find().sort({ district: 1, name: 1 }).lean();
    return res.status(200).json({ locations });
  } catch (error) {
    console.error("Admin attraction list error:", error);
    return sendError(res, 500, "Unable to load tourist locations.");
  }
});

router.post("/admin/locations", authenticateOfficer, requireAdmin, async (req, res) => {
  try {
    const location = validateAttractionInput(req.body);
    if (!location) {
      return sendError(res, 400, "Provide a name, district, description, and valid GPS coordinates.");
    }
    const attraction = await Attraction.create(location);
    return res.status(201).json({ attraction });
  } catch (error) {
    console.error("Admin attraction creation error:", error);
    return sendError(res, 500, "Unable to create tourist location.");
  }
});

router.put("/admin/locations/:id", authenticateOfficer, requireAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 400, "Invalid tourist location.");
    }
    const location = validateAttractionInput(req.body);
    if (!location || typeof req.body.active !== "boolean") {
      return sendError(res, 400, "Provide valid location details and an active status.");
    }
    const attraction = await Attraction.findByIdAndUpdate(
      req.params.id,
      { ...location, active: req.body.active },
      { new: true, runValidators: true }
    );
    if (!attraction) {
      return sendError(res, 404, "Tourist location not found.");
    }
    return res.status(200).json({ attraction });
  } catch (error) {
    console.error("Admin attraction update error:", error);
    return sendError(res, 500, "Unable to update tourist location.");
  }
});

router.get("/admin/tours", authenticateOfficer, requireAdmin, async (req, res) => {
  try {
    const tours = await Tour.find()
      .populate("attractionId", "name district")
      .populate("guideApplicationId", "fullName licenseNumber")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.status(200).json({ tours });
  } catch (error) {
    console.error("Admin tour list error:", error);
    return sendError(res, 500, "Unable to load tour activity.");
  }
});

router.get("/admin/feedback", authenticateOfficer, requireAdmin, async (req, res) => {
  try {
    const entries = await TourFeedback.find()
      .populate("touristId", "fullName email")
      .populate("guideId", "fullName email")
      .populate("attractionId", "name district")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Admin tour feedback list error:", error);
    return sendError(res, 500, "Unable to load tour feedback.");
  }
});

router.patch(
  "/admin/feedback/:id",
  authenticateOfficer,
  requireAdmin,
  async (req, res) => {
    try {
      const { moderationStatus, adminResponse = "" } = req.body;
      if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        return sendError(res, 400, "Invalid tourist feedback entry.");
      }
      if (
        !["Pending", "Reviewed", "Hidden"].includes(moderationStatus) ||
        typeof adminResponse !== "string" ||
        adminResponse.length > 2000
      ) {
        return sendError(res, 400, "Provide a valid moderation status and response.");
      }
      const entry = await TourFeedback.findByIdAndUpdate(
        req.params.id,
        { moderationStatus, adminResponse: adminResponse.trim() },
        { new: true, runValidators: true }
      );
      if (!entry) {
        return sendError(res, 404, "Tour feedback not found.");
      }
      return res.status(200).json({ entry });
    } catch (error) {
      console.error("Admin tour feedback moderation error:", error);
      return sendError(res, 500, "Unable to update tour feedback.");
    }
  }
);

module.exports = router;
