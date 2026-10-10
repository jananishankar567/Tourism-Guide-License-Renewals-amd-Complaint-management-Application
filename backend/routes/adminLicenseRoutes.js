const express = require("express");

const GuideApplication = require("../models/GuideApplication");
const LicenseRenewal = require("../models/LicenseRenewal");
const {
  authenticateOfficer,
  requireOfficer
} = require("../middleware/authMiddleware");

const router = express.Router();
const EXPIRING_SOON_DAYS = 30;

function getLicenseStatus(expiryDate) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(
    expiry.getFullYear(),
    expiry.getMonth(),
    expiry.getDate()
  );

  if (expiryDay < today) {
    return "Expired";
  }

  const daysUntilExpiry = Math.ceil(
    (expiryDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  return daysUntilExpiry <= EXPIRING_SOON_DAYS
    ? "Expiring Soon"
    : "Active";
}

router.get(
  "/",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {
    try {
      const applications = await GuideApplication.find({
        applicationStatus: "Approved",
        licenseNumber: { $exists: true, $nin: ["", null] }
      })
        .select(
          "fullName email phone address applicationStatus licenseNumber licenseIssueDate licenseExpiryDate createdAt"
        )
        .sort({ licenseIssueDate: -1, createdAt: -1 })
        .lean();

      const licenses = applications.map((application) => ({
        ...application,
        licenseStatus: application.licenseExpiryDate
          ? getLicenseStatus(application.licenseExpiryDate)
          : "Expiry Date Missing"
      }));

      return res.status(200).json({
        count: licenses.length,
        licenses
      });
    } catch (error) {
      console.error("Admin license register fetch error:", error);
      return res.status(500).json({
        message: "Unable to fetch the issued license register."
      });
    }
  }
);

router.get(
  "/:id",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {
    try {
      const application = await GuideApplication.findOne({
        _id: req.params.id,
        applicationStatus: "Approved",
        licenseNumber: { $exists: true, $nin: ["", null] }
      }).lean();

      if (!application) {
        return res.status(404).json({
          message: "Issued license not found."
        });
      }

      const renewalHistory = await LicenseRenewal.find({
        applicationId: application._id
      })
        .select(
          "previousLicenseNumber currentLicenseExpiryDate renewedLicenseExpiryDate renewalStatus officerRemarks history createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        license: {
          ...application,
          licenseStatus: application.licenseExpiryDate
            ? getLicenseStatus(application.licenseExpiryDate)
            : "Expiry Date Missing"
        },
        renewalHistory
      });
    } catch (error) {
      console.error("Admin license details fetch error:", error);
      return res.status(500).json({
        message: "Unable to fetch license details."
      });
    }
  }
);

module.exports = router;
