const express = require("express");

const GuideApplication = require("../models/GuideApplication");

const {
  authenticateOfficer,
  requireOfficer
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET ALL APPLICATIONS
// OFFICER + ADMIN
// =====================================================

router.get(
  "/",
  authenticateOfficer,
  requireOfficer,
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
          message: "Invalid application list filters."
        });
      }

      const filter = {};
      if (status !== "All") {
        filter.applicationStatus = status;
      }
      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = ["fullName", "email", "phone", "licenseNumber"].map(
          (field) => ({ [field]: { $regex: escapedSearch, $options: "i" } })
        );
      }

      const [applications, count, statusCounts] = await Promise.all([
        GuideApplication.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        GuideApplication.countDocuments(filter),
        GuideApplication.aggregate([
          { $group: { _id: "$applicationStatus", count: { $sum: 1 } } }
        ])
      ]);

      const summary = Object.fromEntries(
        statuses.map((applicationStatus) => [
          applicationStatus,
          statusCounts.find((item) => item._id === applicationStatus)?.count || 0
        ])
      );

      return res.status(200).json({
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
        summary,
        applications
      });

    } catch (error) {
      console.error(
        "Admin application fetch error:",
        error
      );

      res.status(500).json({
        message: "Unable to fetch applications"
      });
    }
  }
);


// =====================================================
// GET SINGLE APPLICATION
// OFFICER + ADMIN
// =====================================================

router.get(
  "/:id",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {
    try {
      const application =
        await GuideApplication.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          message: "Application not found"
        });
      }

      res.status(200).json({
        application
      });

    } catch (error) {
      console.error(
        "Application details error:",
        error
      );

      res.status(500).json({
        message: "Unable to fetch application"
      });
    }
  }
);


module.exports = router;