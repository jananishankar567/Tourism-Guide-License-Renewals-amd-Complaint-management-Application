const express = require("express");

const GuideApplication = require("../models/GuideApplication");
const LicenseRenewal = require("../models/LicenseRenewal");
const Complaint = require("../models/Complaint");
const {
  authenticateOfficer,
  requireOfficer
} = require("../middleware/authMiddleware");

const router = express.Router();
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function parseDateRange(query) {
  const { startDate, endDate } = query;

  if (
    (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) ||
    (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
  ) {
    return { error: "Dates must use the YYYY-MM-DD format." };
  }

  const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
  const end = endDate ? new Date(`${endDate}T00:00:00.000Z`) : null;

  if (
    (start && Number.isNaN(start.getTime())) ||
    (end && Number.isNaN(end.getTime()))
  ) {
    return { error: "Please enter valid report dates." };
  }

  if (start && end && start > end) {
    return { error: "Start date must be on or before the end date." };
  }

  return {
    start,
    end: end ? new Date(end.getTime() + DAY_IN_MILLISECONDS) : null
  };
}

function createDateFilter(start, end) {
  if (!start && !end) return {};
  const filter = {};
  if (start) filter.$gte = start;
  if (end) filter.$lt = end;
  return filter;
}

function countBy(items, field, values) {
  const counts = Object.fromEntries(values.map((value) => [value, 0]));
  for (const item of items) {
    const key = item[field] || "Other";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function createMonthlyApplicationTotals(applications, start, end) {
  const now = new Date();
  const lastIncludedDate = end
    ? new Date(end.getTime() - DAY_IN_MILLISECONDS)
    : now;
  const firstMonth = start
    ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
    : new Date(
        Date.UTC(
          lastIncludedDate.getUTCFullYear(),
          lastIncludedDate.getUTCMonth() - 11,
          1
        )
      );
  const lastMonth = new Date(
    Date.UTC(
      lastIncludedDate.getUTCFullYear(),
      lastIncludedDate.getUTCMonth(),
      1
    )
  );
  const buckets = new Map();

  for (
    let month = new Date(firstMonth);
    month <= lastMonth;
    month.setUTCMonth(month.getUTCMonth() + 1)
  ) {
    const key = `${month.getUTCFullYear()}-${String(
      month.getUTCMonth() + 1
    ).padStart(2, "0")}`;
    buckets.set(key, { month: key, total: 0 });
  }

  for (const application of applications) {
    const created = new Date(application.createdAt);
    const key = `${created.getUTCFullYear()}-${String(
      created.getUTCMonth() + 1
    ).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.total += 1;
  }

  return Array.from(buckets.values());
}

router.get(
  "/overview",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const licensedApplicationFilter = {
        applicationStatus: "Approved",
        licenseNumber: { $exists: true, $nin: ["", null] }
      };

      const [
        applications,
        licensesIssued,
        activeLicenses,
        expiredLicenses,
        pendingRenewals,
        totalRenewals,
        openComplaints,
        resolvedComplaints,
        totalComplaints
      ] = await Promise.all([
        GuideApplication.aggregate([
          { $group: { _id: "$applicationStatus", count: { $sum: 1 } } }
        ]),
        GuideApplication.countDocuments(licensedApplicationFilter),
        GuideApplication.countDocuments({
          ...licensedApplicationFilter,
          licenseExpiryDate: { $gte: today }
        }),
        GuideApplication.countDocuments({
          ...licensedApplicationFilter,
          licenseExpiryDate: { $lt: today }
        }),
        LicenseRenewal.countDocuments({
          renewalStatus: { $in: ["Submitted", "Under Verification"] }
        }),
        LicenseRenewal.countDocuments(),
        Complaint.countDocuments({
          complaintStatus: {
            $in: [
              "Submitted",
              "Under Review",
              "In Progress",
              "Action Taken",
              "Returned"
            ]
          }
        }),
        Complaint.countDocuments({
          complaintStatus: { $in: ["Resolved", "Closed"] }
        }),
        Complaint.countDocuments()
      ]);

      const applicationCounts = Object.fromEntries(
        [
          "Submitted",
          "Under Verification",
          "Approved",
          "Returned",
          "Rejected"
        ].map((status) => [
          status,
          applications.find((item) => item._id === status)?.count || 0
        ])
      );

      return res.status(200).json({
        applications: applicationCounts,
        licenses: { issued: licensesIssued, active: activeLicenses, expired: expiredLicenses },
        renewals: { total: totalRenewals, pending: pendingRenewals },
        complaints: {
          total: totalComplaints,
          open: openComplaints,
          resolved: resolvedComplaints
        }
      });
    } catch (error) {
      console.error("Admin overview fetch error:", error);
      return res.status(500).json({
        message: "Unable to load dashboard overview."
      });
    }
  }
);

router.get(
  "/",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {
    const dateRange = parseDateRange(req.query);
    if (dateRange.error) {
      return res.status(400).json({ message: dateRange.error });
    }

    const { start, end } = dateRange;

    try {
      const [applications, licenses, renewals, complaints] =
        await Promise.all([
          GuideApplication.find({
            ...(start || end
              ? { createdAt: createDateFilter(start, end) }
              : {})
          })
            .select("applicationStatus createdAt")
            .lean(),
          GuideApplication.find({
            applicationStatus: "Approved",
            licenseNumber: { $exists: true, $nin: ["", null] },
            ...(start || end
              ? { licenseIssueDate: createDateFilter(start, end) }
              : {})
          })
            .select("licenseNumber licenseIssueDate licenseExpiryDate")
            .lean(),
          LicenseRenewal.find({
            ...(start || end
              ? { createdAt: createDateFilter(start, end) }
              : {})
          })
            .select("renewalStatus createdAt")
            .lean(),
          Complaint.find({
            ...(start || end
              ? { createdAt: createDateFilter(start, end) }
              : {})
          })
            .select("category complaintStatus createdAt resolvedAt")
            .lean()
        ]);

      const today = new Date();
      const activeLicenses = licenses.filter(
        (license) =>
          license.licenseExpiryDate &&
          new Date(license.licenseExpiryDate) >=
            new Date(today.getFullYear(), today.getMonth(), today.getDate())
      );
      const expiredLicenses = licenses.filter(
        (license) =>
          license.licenseExpiryDate &&
          new Date(license.licenseExpiryDate) <
            new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ).length;
      const pendingRenewals = renewals.filter((renewal) =>
        ["Submitted", "Under Verification"].includes(renewal.renewalStatus)
      ).length;
      const pendingComplaints = complaints.filter((complaint) =>
        ["Submitted", "Under Review", "In Progress", "Action Taken", "Returned"]
          .includes(complaint.complaintStatus)
      ).length;
      const resolvedComplaints = complaints.filter((complaint) =>
        ["Resolved", "Closed"].includes(complaint.complaintStatus)
      );
      const resolutionDurations = resolvedComplaints
        .filter((complaint) => complaint.resolvedAt && complaint.createdAt)
        .map(
          (complaint) =>
            (new Date(complaint.resolvedAt) -
              new Date(complaint.createdAt)) /
            DAY_IN_MILLISECONDS
        )
        .filter((duration) => duration >= 0);
      const averageResolutionDays = resolutionDurations.length
        ? Number(
            (
              resolutionDurations.reduce(
                (total, duration) => total + duration,
                0
              ) / resolutionDurations.length
            ).toFixed(1)
          )
        : null;
      const moduleActivity = {
        applicationsReceived: applications.length,
        renewalsSubmitted: renewals.length,
        complaintsSubmitted: complaints.length,
        licensesIssued: licenses.length
      };
      moduleActivity.totalTrackedActions =
        moduleActivity.applicationsReceived +
        moduleActivity.renewalsSubmitted +
        moduleActivity.complaintsSubmitted +
        moduleActivity.licensesIssued;

      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        dateRange: {
          startDate: start ? start.toISOString().slice(0, 10) : null,
          endDate: req.query.endDate || null
        },
        overview: {
          totalApplications: applications.length,
          approvedApplications: applications.filter(
            (application) => application.applicationStatus === "Approved"
          ).length,
          rejectedApplications: applications.filter(
            (application) => application.applicationStatus === "Rejected"
          ).length,
          pendingApplications: applications.filter((application) =>
            ["Submitted", "Under Verification"].includes(
              application.applicationStatus
            )
          ).length,
          applicationsAwaitingVerification: applications.filter(
            (application) =>
              application.applicationStatus === "Under Verification"
          ).length,
          returnedApplications: applications.filter(
            (application) => application.applicationStatus === "Returned"
          ).length,
          licensesIssued: licenses.length,
          activeLicenses: activeLicenses.length,
          expiredLicenses,
          renewalsPending: pendingRenewals,
          renewalsApproved: renewals.filter(
            (renewal) => renewal.renewalStatus === "Approved"
          ).length,
          renewalsRejected: renewals.filter(
            (renewal) => renewal.renewalStatus === "Rejected"
          ).length,
          totalComplaints: complaints.length,
          pendingComplaints,
          inProgressComplaints: complaints.filter((complaint) =>
            ["Under Review", "In Progress", "Action Taken"].includes(
              complaint.complaintStatus
            )
          ).length,
          resolvedComplaints: resolvedComplaints.length,
          averageResolutionDays
        },
        moduleActivity,
        applications: {
          statusCounts: countBy(applications, "applicationStatus", [
            "Approved",
            "Rejected",
            "Submitted",
            "Under Verification",
            "Returned"
          ]),
          awaitingVerification: applications.filter(
            (application) =>
              application.applicationStatus === "Under Verification"
          ).length,
          returned: applications.filter(
            (application) => application.applicationStatus === "Returned"
          ).length,
          monthlyTotals: createMonthlyApplicationTotals(
            applications,
            start,
            end
          )
        },
        licenses: {
          total: licenses.length,
          active: activeLicenses.length,
          expired: expiredLicenses,
          expiryDateMissing: licenses.length - activeLicenses.length - expiredLicenses
        },
        renewals: {
          statusCounts: countBy(renewals, "renewalStatus", [
            "Submitted",
            "Under Verification",
            "Approved",
            "Rejected",
            "Returned"
          ])
        },
        complaints: {
          statusCounts: countBy(complaints, "complaintStatus", [
            "Submitted",
            "Under Review",
            "In Progress",
            "Action Taken",
            "Resolved",
            "Returned",
            "Rejected",
            "Closed"
          ]),
          categoryCounts: countBy(complaints, "category", [
            "Tourist Misconduct",
            "Harassment or Safety",
            "Overcharging",
            "False Information",
            "Tourist Site Facilities",
            "Damage to Tourist Property",
            "Service Issue",
            "Threat or Intimidation",
            "Other"
          ]),
          averageResolutionDays
        }
      });
    } catch (error) {
      console.error("Admin reports fetch error:", error);
      return res.status(500).json({
        message: "Unable to generate reports from the current records."
      });
    }
  }
);

module.exports = router;
