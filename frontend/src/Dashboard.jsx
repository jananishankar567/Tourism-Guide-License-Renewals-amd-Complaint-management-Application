import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./api";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [applicant] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("applicant") || "null");
    } catch (error) {
      console.error("Unable to read saved applicant details:", error);
      return null;
    }
  });
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [sidebarMessage, setSidebarMessage] = useState("");
  const [activeComplaintCount, setActiveComplaintCount] = useState(0);
  const [rejectedRenewalCount, setRejectedRenewalCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRefreshing, setNotificationsRefreshing] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationToday] = useState(() => new Date());
  const notificationsRef = useRef(null);
  const notificationStorageKey = `dashboardReadNotifications:${
    applicant?.id || applicant?._id || applicant?.email || "applicant"
  }`;
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const savedIds = JSON.parse(
        localStorage.getItem(notificationStorageKey) || "[]"
      );
      return Array.isArray(savedIds) ? savedIds : [];
    } catch (error) {
      console.error("Unable to read notification state:", error);
      return [];
    }
  });

  // ======================================================
  // FETCH APPLICANT APPLICATION
  // ======================================================

  const fetchApplication = async () => {
    try {
      setLoadingApplication(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setApplication(null);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/applications/mine`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 404) {
        setApplication(null);
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to fetch application."
        );
      }

      const data = await response.json();

      setApplication(data);
    } catch (error) {
      console.error(
        "Dashboard application fetch error:",
        error
      );

      setApplication(null);
    } finally {
      setLoadingApplication(false);
    }
  };

  // ======================================================
  // LOAD APPLICATION WHEN DASHBOARD OPENS
  // ======================================================

  useEffect(() => {
    fetchApplication();
  }, []);

  useEffect(() => {
    const fetchComplaintCount = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setActiveComplaintCount(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/complaints/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch complaints.");
        }

        const complaints = Array.isArray(data)
          ? data
          : data.complaints || [];
        setComplaints(complaints);
        const activeStatuses = [
          "Submitted",
          "Under Review",
          "In Progress",
          "Action Taken",
          "Returned",
        ];

        setActiveComplaintCount(
          complaints.filter((complaint) =>
            activeStatuses.includes(complaint.complaintStatus)
          ).length
        );
      } catch (error) {
        console.error("Dashboard complaint count fetch error:", error);
      }
    };

    fetchComplaintCount();
  }, []);

  useEffect(() => {
    const fetchRejectedRenewalCount = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setRejectedRenewalCount(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/renewals/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch renewals.");
        }

        const renewals = Array.isArray(data) ? data : data.renewals || [];
        setRenewals(renewals);
        setRejectedRenewalCount(
          renewals.filter((renewal) => renewal.renewalStatus === "Rejected")
            .length
        );
      } catch (error) {
        console.error("Dashboard rejected renewal count fetch error:", error);
      }
    };

    fetchRejectedRenewalCount();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        notificationStorageKey,
        JSON.stringify(readNotificationIds)
      );
    } catch (error) {
      console.error("Unable to save notification state:", error);
    }
  }, [notificationStorageKey, readNotificationIds]);

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsOpen]);

  // ======================================================
  // APPLICANT NAME
  // ======================================================

  const applicantName =
    application?.fullName?.trim() ||
    applicant?.fullName?.trim() ||
    "Applicant";

  const applicantInitial =
    applicantName.charAt(0).toUpperCase();

  const notifications = [];

  if (application?.applicationStatus) {
    const applicationMessages = {
      Submitted: "Your application has been submitted and is awaiting review.",
      "Under Verification": "Your application is currently under review.",
      Approved: "Your tourism guide license application was approved.",
      Rejected: "Your application was rejected. Review the officer remarks for details.",
      Returned: "Your application needs corrections before it can proceed.",
    };

    notifications.push({
      id: `application:${application._id}:${application.updatedAt || application.applicationStatus}`,
      title: `Application ${application.applicationStatus}`,
      message:
        applicationMessages[application.applicationStatus] ||
        `Your application status is ${application.applicationStatus}.`,
      date: application.updatedAt || application.createdAt,
      path: "/application-status",
    });

    if (application.officerRemarks?.trim()) {
      notifications.push({
        id: `application-remarks:${application._id}:${application.updatedAt || application.officerRemarks}`,
        title: "Officer remarks received",
        message: application.officerRemarks.trim(),
        date: application.updatedAt || application.createdAt,
        path: "/application-status",
      });
    }
  }

  complaints.forEach((complaint) => {
    const officerUpdates = (complaint.history || [])
      .filter((entry) => ["Officer", "Admin"].includes(entry.updatedBy))
      .sort(
        (first, second) =>
          new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0)
      );
    const latestUpdate = officerUpdates[0];
    const remarks =
      latestUpdate?.remarks?.trim() ||
      [complaint.officerRemarks, complaint.resolution]
        .filter((remark) => typeof remark === "string" && remark.trim())
        .join("\n\n");

    if (
      !latestUpdate &&
      !remarks &&
      complaint.complaintStatus === "Submitted"
    ) {
      return;
    }

    const updatedAt =
      latestUpdate?.updatedAt || complaint.updatedAt || complaint.createdAt;

    notifications.push({
      id: `complaint:${complaint._id}:${updatedAt || complaint.complaintStatus}`,
      title: remarks
        ? "Complaint remarks received"
        : "Complaint status updated",
      message: remarks
        ? `${complaint.complaintStatus}: ${remarks}`
        : `Your complaint is now ${complaint.complaintStatus}.`,
      date: updatedAt,
      path: `/complaints/${complaint._id}`,
    });
  });

  renewals.forEach((renewal) => {
    const renewalMessages = {
      Submitted: "Your renewal request has been submitted.",
      "Under Verification": "Your renewal request is currently under review.",
      Approved: "Your license renewal was approved.",
      Rejected: "Your renewal request was rejected. Review the officer remarks for details.",
      Returned: "Your renewal request needs corrections before it can proceed.",
    };
    const statusMessage =
      renewalMessages[renewal.renewalStatus] ||
      `Your renewal status is ${renewal.renewalStatus}.`;

    notifications.push({
      id: `renewal:${renewal._id}:${renewal.updatedAt || renewal.renewalStatus}`,
      title: `Renewal ${renewal.renewalStatus}`,
      message: renewal.officerRemarks?.trim()
        ? `${statusMessage} ${renewal.officerRemarks.trim()}`
        : statusMessage,
      date: renewal.updatedAt || renewal.createdAt,
      path: "/renewal-status",
    });
  });

  if (application?.licenseExpiryDate) {
    const expiryDate = new Date(application.licenseExpiryDate);

    if (!Number.isNaN(expiryDate.getTime())) {
      const expiryDay = new Date(
        expiryDate.getFullYear(),
        expiryDate.getMonth(),
        expiryDate.getDate()
      ).getTime();
      const today = new Date(
        notificationToday.getFullYear(),
        notificationToday.getMonth(),
        notificationToday.getDate()
      ).getTime();
      const daysUntilExpiry = Math.ceil(
        (expiryDay - today) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiry <= 30) {
        notifications.push({
          id: `license-expiry:${application._id}:${expiryDate.toISOString()}`,
          title: daysUntilExpiry < 0 ? "License expired" : "Renewal reminder",
          message:
            daysUntilExpiry < 0
              ? "Your tourism guide license has expired. Start your renewal as soon as possible."
              : daysUntilExpiry === 0
                ? "Your tourism guide license expires today. Start your renewal now."
                : `Your tourism guide license expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}.`,
          date: notificationToday,
          path: "/renewal",
        });
      }
    }
  }

  const sortedNotifications = notifications.sort(
    (first, second) =>
      new Date(second.date || 0) - new Date(first.date || 0)
  );
  const unreadNotificationCount = sortedNotifications.filter(
    (notification) => !readNotificationIds.includes(notification.id)
  ).length;

  const refreshNotificationData = async () => {
    setNotificationsRefreshing(true);
    setNotificationError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotificationError("Please sign in again to check for updates.");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [applicationResponse, complaintsResponse, renewalsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/applications/mine`, { headers }),
          fetch(`${API_BASE_URL}/api/complaints/mine`, { headers }),
          fetch(`${API_BASE_URL}/api/renewals/mine`, { headers }),
        ]);

      if (applicationResponse.status === 404) {
        setApplication(null);
      } else {
        const applicationData = await applicationResponse.json();
        if (!applicationResponse.ok) {
          throw new Error(
            applicationData.message || "Failed to refresh application status."
          );
        }
        setApplication(applicationData);
      }

      const complaintsData = await complaintsResponse.json();
      if (!complaintsResponse.ok) {
        throw new Error(
          complaintsData.message || "Failed to refresh complaint updates."
        );
      }
      const latestComplaints = Array.isArray(complaintsData)
        ? complaintsData
        : complaintsData.complaints || [];
      const activeStatuses = [
        "Submitted",
        "Under Review",
        "In Progress",
        "Action Taken",
        "Returned",
      ];
      setComplaints(latestComplaints);
      setActiveComplaintCount(
        latestComplaints.filter((complaint) =>
          activeStatuses.includes(complaint.complaintStatus)
        ).length
      );

      const renewalsData = await renewalsResponse.json();
      if (!renewalsResponse.ok) {
        throw new Error(
          renewalsData.message || "Failed to refresh renewal updates."
        );
      }
      const latestRenewals = Array.isArray(renewalsData)
        ? renewalsData
        : renewalsData.renewals || [];
      setRenewals(latestRenewals);
      setRejectedRenewalCount(
        latestRenewals.filter(
          (renewal) => renewal.renewalStatus === "Rejected"
        ).length
      );
    } catch (error) {
      console.error("Dashboard notification refresh error:", error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to refresh notifications. Please try again."
      );
    } finally {
      setNotificationsRefreshing(false);
    }
  };

  const markNotificationRead = (notificationId) => {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId]
    );
  };

  const markAllNotificationsRead = () => {
    setReadNotificationIds((currentIds) => [
      ...new Set([
        ...currentIds,
        ...sortedNotifications.map((notification) => notification.id),
      ]),
    ]);
  };

  const formatNotificationDate = (date) => {
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return "Recently";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("applicantEmail");

    navigate("/login");
  };

  // ======================================================
  // APPLY FOR LICENSE FROM SIDEBAR
  // ======================================================

  const handleApplyForLicense = () => {
    setSidebarMessage("");

    // No application exists
    if (!application) {
      navigate("/application");
      return;
    }

    const status =
      application.applicationStatus;

    // Application is active
    if (
      status === "Submitted" ||
      status === "Under Verification"
    ) {
      setSidebarMessage(
        "You already have an active application. You cannot submit another application while your current application is being processed."
      );

      return;
    }

    // Application was returned
    if (status === "Returned") {
      setSidebarMessage(
        "Your application was returned for correction. Please check My Application for the officer remarks and required corrections."
      );

      return;
    }

    // Application approved
    if (status === "Approved") {
      setSidebarMessage(
        "Your tourism guide license application has already been approved. You cannot submit another application."
      );

      return;
    }

    // Application rejected
    if (status === "Rejected") {
      setSidebarMessage(
        "Your previous application was rejected. Please contact the licensing authority regarding reapplication."
      );

      return;
    }

    setSidebarMessage(
      "You already have an application in the system. Please check My Application."
    );
  };

  // ======================================================
  // MY APPLICATION
  // ======================================================

  const handleMyApplication = () => {
    setSidebarMessage("");

    if (application) {
      navigate("/application-status");
    } else {
      setSidebarMessage(
        "You have not submitted a tourism guide license application yet. Please use Apply for License to start your application."
      );
    }
  };

  // ======================================================
  // APPLICATION CARD NAVIGATION
  // ======================================================

  const handleApplicationNavigation = () => {
    setSidebarMessage("");

    if (application) {
      navigate("/application-status");
    } else {
      navigate("/application");
    }
  };

  // ======================================================
  // GET APPLICATION STATUS
  // ======================================================

  const getApplicationStatus = () => {
    if (!application) {
      return "Not Submitted";
    }

    return (
      application.applicationStatus ||
      "Submitted"
    );
  };

  // ======================================================
  // STATUS DESCRIPTION
  // ======================================================

  const getApplicationDescription = () => {
    if (!application) {
      return "Your tourism guide license application has not been submitted yet.";
    }

    switch (application.applicationStatus) {
      case "Submitted":
        return "Your application has been submitted successfully and is waiting for officer verification.";

      case "Under Verification":
        return "Your application is currently being reviewed by the licensing officer.";

      case "Approved":
        return "Your tourism guide license application has been approved.";

      case "Returned":
        return "Your application has been returned by the officer. Please check the remarks and required corrections.";

      case "Rejected":
        return "Your application has been rejected. Please check the officer remarks for more information.";

      default:
        return "Your application has been submitted successfully.";
    }
  };

  // ======================================================
  // GET PROGRESS STATUS TEXT
  // ======================================================

  const getProgressStatus = () => {
    if (!application) {
      return "Not Started";
    }

    switch (application.applicationStatus) {
      case "Submitted":
        return "Submitted";

      case "Under Verification":
        return "Under Verification";

      case "Approved":
        return "Approved";

      case "Returned":
        return "Returned";

      case "Rejected":
        return "Rejected";

      default:
        return "Submitted";
    }
  };

  // ======================================================
  // GET PROGRESS STEP
  // ======================================================

  const getProgressStep = () => {
    if (!application) {
      return 0;
    }

    switch (application.applicationStatus) {
      case "Submitted":
        return 1;

      case "Under Verification":
        return 2;

      case "Approved":
        return 4;

      case "Returned":
      case "Rejected":
        return 2;

      default:
        return 1;
    }
  };

  const currentProgressStep =
    getProgressStep();

  // ======================================================
  // CHECK WHETHER STEP IS COMPLETED
  // ======================================================

  const isStepCompleted = (step) => {
    if (!application) {
      return false;
    }

    if (
      application.applicationStatus ===
        "Returned" ||
      application.applicationStatus ===
        "Rejected"
    ) {
      return step <= 1;
    }

    return step <= currentProgressStep;
  };

  // ======================================================
  // CHECK WHETHER STEP IS ACTIVE
  // ======================================================

  const isStepActive = (step) => {
    if (!application) {
      return step === 1;
    }

    if (
      application.applicationStatus ===
        "Returned" ||
      application.applicationStatus ===
        "Rejected"
    ) {
      return step === 2;
    }

    return step === currentProgressStep;
  };

  // ======================================================
  // LOADING STATE
  // ======================================================

  if (loadingApplication) {
    return (
      <div className="dashboard-page">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <div className="dashboard-brand-mark">
              TG
            </div>

            <div>
              <h2>Tourism Guide</h2>
              <span>Portal</span>
            </div>
          </div>
        </aside>

        <main className="dashboard-main">
          <div
            style={{
              padding: "40px",
              textAlign: "center"
            }}
          >
            Loading your application...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="dashboard-sidebar">

        {/* Brand */}

        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">
            TG
          </div>

          <div>
            <h2>Tourism Guide</h2>
            <span>Portal</span>
          </div>
        </div>

        {/* Navigation */}

        <nav className="dashboard-nav">

          {/* Dashboard */}

          <button
            className="dashboard-nav-item active"
          >
            <span>⌂</span>
            Dashboard
          </button>

          {/* APPLY FOR LICENSE */}

          <button
            className="dashboard-nav-item"
            onClick={handleApplyForLicense}
          >
            <span>＋</span>
            Apply for License
          </button>

          {/* SIDEBAR MESSAGE */}

          {sidebarMessage && (
            <div className="sidebar-application-message">

              <div className="sidebar-message-header">
                <span>⚠</span>

                <strong>
                  Application Notice
                </strong>

                <button
                  onClick={() =>
                    setSidebarMessage("")
                  }
                >
                  ×
                </button>
              </div>

              <p>
                {sidebarMessage}
              </p>

              {application && (
                <button
                  className="sidebar-message-link"
                  onClick={handleMyApplication}
                >
                  View Application →
                </button>
              )}
            </div>
          )}

          {/* MY APPLICATION */}

          <button
            className="dashboard-nav-item"
            onClick={handleMyApplication}
          >
            <span>▣</span>
            My Application
          </button>

          {/* MY LICENSE */}

          <button
            className="dashboard-nav-item"
            onClick={() =>
              navigate("/license")
            }
          >
            <span>▤</span>
            My License
          </button>

          {/* GPS-VERIFIED TOURS */}

          <button
            className="dashboard-nav-item"
            onClick={() => navigate("/tourism/guide")}
          >
            <span>⌖</span>
            Guide Tours
          </button>

          {/* LICENSE RENEWAL */}

          <button
            className="dashboard-nav-item"
            onClick={() =>
              navigate("/renewal")
            }
          >
            <span>↻</span>
            License Renewal
          </button>

          {/* COMPLAINTS */}

          <button
            className="dashboard-nav-item"
            onClick={() =>
              navigate("/complaints")
            }
          >
            <span>⚑</span>
            Complaints
          </button>

          {/* PROFILE */}

          <button
            className="dashboard-nav-item"
            onClick={() =>
              navigate("/profile")
            }
          >
            <span>◯</span>
            My Profile
          </button>
        </nav>

        {/* Sidebar Bottom */}

        <div className="sidebar-bottom">
          <button
            className="dashboard-nav-item logout-item"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="dashboard-main">

        {/* ==================================================
            TOPBAR
        ================================================== */}

        <header className="dashboard-topbar">

          <div>
            <p className="dashboard-page-label">
              APPLICANT DASHBOARD
            </p>

            {/* DYNAMIC NAME */}

            <h1>
              Welcome back, {applicantName}!
            </h1>
          </div>

          <div className="dashboard-header-actions">
            <div className="dashboard-notifications" ref={notificationsRef}>
              <button
                type="button"
                className="notification-toggle"
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  const shouldOpen = !notificationsOpen;
                  setNotificationsOpen(shouldOpen);
                  if (shouldOpen) {
                    refreshNotificationData();
                  }
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
                {unreadNotificationCount > 0 && (
                  <span className="notification-count">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <section
                  className="notification-panel"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="notification-panel-header">
                    <div>
                      <h2>Notifications</h2>
                      <p>
                        {unreadNotificationCount > 0
                          ? `${unreadNotificationCount} unread update${unreadNotificationCount === 1 ? "" : "s"}`
                          : "You are all caught up"}
                      </p>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        className="notification-mark-read"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notificationsRefreshing && (
                    <p className="notification-refreshing">
                      Checking for updates...
                    </p>
                  )}

                  {notificationError && (
                    <p className="notification-error" role="alert">
                      {notificationError}
                    </p>
                  )}

                  {sortedNotifications.length === 0 ? (
                    <div className="notification-empty">
                      <span aria-hidden="true">✓</span>
                      <strong>No notifications yet</strong>
                      <p>
                        Application, complaint, and renewal updates will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="notification-list">
                      {sortedNotifications.map((notification) => {
                        const isRead = readNotificationIds.includes(
                          notification.id
                        );

                        return (
                          <button
                            type="button"
                            className={`notification-item${isRead ? "" : " unread"}`}
                            key={notification.id}
                            onClick={() => {
                              markNotificationRead(notification.id);
                              setNotificationsOpen(false);
                              navigate(notification.path);
                            }}
                          >
                            <span className="notification-indicator" />
                            <span className="notification-copy">
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                              <time>
                                {formatNotificationDate(notification.date)}
                              </time>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="dashboard-user">
              <div className="user-avatar">
                {applicantInitial}
              </div>
              <div>
                <strong>{applicantName}</strong>
                <span>Applicant</span>
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================
            STATUS CARDS
        ================================================== */}

        <section className="dashboard-cards">

          {/* APPLICATION CARD */}

          <div className="dashboard-card">

            <div className="dashboard-card-header">
              <span>
                Application
              </span>

              <div className="status-icon application-icon">
                ▣
              </div>
            </div>

            <h2>
              {getApplicationStatus()}
            </h2>

            <p>
              {getApplicationDescription()}
            </p>

            <button
              className="dashboard-card-link"
              onClick={
                handleApplicationNavigation
              }
            >
              {application
                ? "Check Application Status →"
                : "Start Application →"}
            </button>
          </div>

          {/* LICENSE CARD */}

          <div className="dashboard-card">

            <div className="dashboard-card-header">
              <span>
                License
              </span>

              <div className="status-icon license-icon">
                ✓
              </div>
            </div>

            <h2>
              {application &&
              application.applicationStatus ===
                "Approved"
                ? "Issued"
                : "Not Issued"}
            </h2>

            <p>
              {application &&
              application.applicationStatus ===
                "Approved"
                ? "Your tourism guide license has been approved and is available here."
                : "Your tourism guide license will appear here after approval."}
            </p>

            <button
              className="dashboard-card-link"
              onClick={() =>
                navigate("/license")
              }
            >
              View License →
            </button>
          </div>

          {/* COMPLAINTS CARD */}

          <div className="dashboard-card">

            <div className="dashboard-card-header">
              <span>
                Complaints
              </span>

              <div className="status-icon complaint-icon">
                ⚑
              </div>
            </div>

            <h2>
              {activeComplaintCount} Active
            </h2>

            <p>
              {activeComplaintCount === 0
                ? "No active complaints are currently associated with your account."
                : `${activeComplaintCount} active complaint${activeComplaintCount === 1 ? "" : "s"} associated with your account.`}
            </p>

            <button
              className="dashboard-card-link"
              onClick={() =>
                navigate("/complaints")
              }
            >
              Manage Complaints →
            </button>
          </div>

          {/* REJECTED REQUESTS CARD */}

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <span>Rejected Requests</span>

              <div className="status-icon rejected-icon">
                !
              </div>
            </div>

            <h2>
              {(application?.applicationStatus === "Rejected" ? 1 : 0) +
                rejectedRenewalCount}
            </h2>

            <p>
              {rejectedRenewalCount > 0 ||
              application?.applicationStatus === "Rejected"
                ? `${application?.applicationStatus === "Rejected" ? "A guide application" : ""}${
                    application?.applicationStatus === "Rejected" &&
                    rejectedRenewalCount > 0
                      ? " and "
                      : ""
                  }${
                    rejectedRenewalCount > 0
                      ? `${rejectedRenewalCount} renewal request${
                          rejectedRenewalCount === 1 ? "" : "s"
                        }`
                      : ""
                  } rejected. Review the status and officer remarks.`
                : "You have no rejected applications or renewal requests."}
            </p>

            <button
              className="dashboard-card-link"
              onClick={() =>
                navigate(
                  rejectedRenewalCount > 0
                    ? "/renewal-status"
                    : "/application-status"
                )
              }
              disabled={
                !application && rejectedRenewalCount === 0
              }
            >
              {rejectedRenewalCount > 0
                ? "View Renewal Status →"
                : "View Application Status →"}
            </button>
          </div>
        </section>

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <section className="dashboard-content-grid">

          {/* APPLICATION PROGRESS */}

          <div className="dashboard-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-label">
                  LICENSE APPLICATION
                </span>

                <h3>
                  Application Progress
                </h3>
              </div>

              <span className="progress-status">
                {getProgressStatus()}
              </span>
            </div>

            <div className="progress-container">

              {/* STEP 1 */}

              <div
                className={`progress-step ${
                  isStepCompleted(1)
                    ? "completed"
                    : ""
                } ${
                  isStepActive(1)
                    ? "active"
                    : ""
                }`}
              >
                <div className="progress-circle">
                  1
                </div>

                <div>
                  <strong>
                    Application
                  </strong>

                  <p>
                    Submit your application
                  </p>
                </div>
              </div>

              <div
                className={`progress-line ${
                  isStepCompleted(2)
                    ? "completed"
                    : ""
                }`}
              ></div>

              {/* STEP 2 */}

              <div
                className={`progress-step ${
                  isStepCompleted(2)
                    ? "completed"
                    : ""
                } ${
                  isStepActive(2)
                    ? "active"
                    : ""
                }`}
              >
                <div className="progress-circle">
                  2
                </div>

                <div>
                  <strong>
                    Verification
                  </strong>

                  <p>
                    Officer verification
                  </p>
                </div>
              </div>

              <div
                className={`progress-line ${
                  isStepCompleted(3)
                    ? "completed"
                    : ""
                }`}
              ></div>

              {/* STEP 3 */}

              <div
                className={`progress-step ${
                  isStepCompleted(3)
                    ? "completed"
                    : ""
                } ${
                  isStepActive(3)
                    ? "active"
                    : ""
                }`}
              >
                <div className="progress-circle">
                  3
                </div>

                <div>
                  <strong>
                    Approval
                  </strong>

                  <p>
                    License approval
                  </p>
                </div>
              </div>

              <div
                className={`progress-line ${
                  isStepCompleted(4)
                    ? "completed"
                    : ""
                }`}
              ></div>

              {/* STEP 4 */}

              <div
                className={`progress-step ${
                  isStepCompleted(4)
                    ? "completed"
                    : ""
                } ${
                  isStepActive(4)
                    ? "active"
                    : ""
                }`}
              >
                <div className="progress-circle">
                  4
                </div>

                <div>
                  <strong>
                    License
                  </strong>

                  <p>
                    License issued
                  </p>
                </div>
              </div>
            </div>

            {/* APPLICATION BUTTON */}

            <button
              className="start-application-button"
              onClick={
                handleApplicationNavigation
              }
            >
              {application
                ? "View Application Status"
                : "Start License Application"}

              <span>
                →
              </span>
            </button>
          </div>

          {/* QUICK SERVICES */}

          <div className="dashboard-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-label">
                  SERVICES
                </span>

                <h3>
                  Quick Services
                </h3>
              </div>
            </div>

            <div className="quick-services">

              {/* APPLY FOR LICENSE */}

              <button
                className="quick-service"
                onClick={handleApplyForLicense}
              >
                <div className="quick-service-icon">
                  +
                </div>

                <div>
                  <strong>
                    Apply for License
                  </strong>

                  <p>
                    Submit a new application
                  </p>
                </div>

                <span>
                  →
                </span>
              </button>

              
{/* RENEW LICENSE / VIEW RENEWAL STATUS */}
<button
  className="quick-service"
  onClick={() => navigate("/renewal-status")}
>
  <div className="quick-service-icon">
    ↻
  </div>
  <div>
    <strong>
      Renewal Applications
    </strong>
    <p>
      View submitted renewals and track progress
    </p>
  </div>
  <span>
    →
  </span>
</button>
              {/* COMPLAINT */}

              <button
  className="quick-service"
  onClick={() => navigate("/complaints/new")}
>
  <div className="quick-service-icon">⚑</div>

  <div>
    <strong>Submit Complaint</strong>
    <p>Report an issue involving tourists or tourist places</p>
  </div>

  <span>→</span>
</button>
            </div>
          </div>
        </section>

        {/* ==================================================
            RECENT ACTIVITY
        ================================================== */}

        <section className="dashboard-panel activity-panel">

          <div className="panel-heading">

            <div>
              <span className="panel-label">
                ACTIVITY
              </span>

              <h3>
                Recent Activity
              </h3>
            </div>
          </div>

          {application ? (
            <div className="empty-activity">

              <div className="empty-icon">
                ✓
              </div>

              <h4>
                Application Submitted
              </h4>

              <p>
                Your application was submitted
                successfully and is currently
                {application.applicationStatus ===
                "Submitted"
                  ? " waiting for officer verification."
                  : ` marked as ${application.applicationStatus}.`}
              </p>

              <button
                className="dashboard-card-link"
                onClick={() =>
                  navigate(
                    "/application-status"
                  )
                }
              >
                View Application →
              </button>
            </div>
          ) : (
            <div className="empty-activity">

              <div className="empty-icon">
                ✓
              </div>

              <h4>
                No recent activity
              </h4>

              <p>
                Your application and portal
                activities will appear here.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;