// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./AdminDashboard.css";

// function AdminDashboard() {
//   const navigate = useNavigate();

//   const [applications, setApplications] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const officer = JSON.parse(
//     localStorage.getItem("officer") || "{}"
//   );

//   const officerToken = localStorage.getItem("officerToken");

//   useEffect(() => {
//     fetchApplications();
//   }, []);

//   const fetchApplications = async () => {
//     try {
//       setLoading(true);

//       const response = await fetch(
//         "http://localhost:5000/api/admin/applications",
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${officerToken}`
//           }
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message || "Unable to fetch applications"
//         );
//       }

//       setApplications(data.applications || []);

//     } catch (error) {
//       console.error("Dashboard error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const totalApplications = applications.length;

//   const pendingApplications = applications.filter(
//     (application) =>
//       application.applicationStatus === "Submitted" ||
//       application.applicationStatus === "Under Verification"
//   ).length;

//   const approvedApplications = applications.filter(
//     (application) =>
//       application.applicationStatus === "Approved"
//   ).length;

//   const rejectedApplications = applications.filter(
//     (application) =>
//       application.applicationStatus === "Rejected"
//   ).length;

//   const returnedApplications = applications.filter(
//     (application) =>
//       application.applicationStatus === "Returned"
//   ).length;

//   const handleLogout = () => {
//     localStorage.removeItem("officerToken");
//     localStorage.removeItem("officer");

//     navigate("/login");
//   };

//   return (
//     <div className="admin-layout">

//       {/* SIDEBAR */}

//       <aside className="admin-sidebar">

//         <div className="admin-brand">

//           <div className="admin-logo">
//             TG
//           </div>

//           <div>
//             <h2>Tourism Guide</h2>
//             <span>Management Portal</span>
//           </div>

//         </div>

//         <nav className="admin-navigation">

//           <button
//             className="admin-nav-item active"
//             onClick={() => navigate("/admin-dashboard")}
//           >
//             <span>▦</span>
//             Dashboard
//           </button>

//           <button
//             className="admin-nav-item"
//             onClick={() => navigate("/admin-applications")}
//           >
//             <span>▤</span>
//             Applications
//           </button>

//           <button className="admin-nav-item">
//             <span>↻</span>
//             Renewals
//           </button>

//           <button className="admin-nav-item">
//             <span>⚑</span>
//             Complaints
//           </button>

//           <button className="admin-nav-item">
//             <span>▣</span>
//             Licenses
//           </button>

//           <button className="admin-nav-item">
//             <span>▥</span>
//             Reports
//           </button>

//         </nav>

//         <div className="admin-sidebar-bottom">

//           <div className="admin-user-mini">

//             <div className="admin-avatar">
//               {officer.fullName
//                 ? officer.fullName.charAt(0).toUpperCase()
//                 : "A"}
//             </div>

//             <div className="admin-user-info">
//               <strong>
//                 {officer.fullName || "Administrator"}
//               </strong>

//               <span>
//                 {officer.role || "Admin"}
//               </span>
//             </div>

//           </div>

//           <button
//             className="admin-logout"
//             onClick={handleLogout}
//           >
//             <span>↪</span>
//             Logout
//           </button>

//         </div>

//       </aside>

//       {/* MAIN CONTENT */}

//       <main className="admin-main">

//         {/* HEADER */}

//         <header className="admin-header">

//           <div>
//             <p className="admin-page-label">
//               ADMINISTRATION
//             </p>

//             <h1>
//               Dashboard
//             </h1>

//             <p className="admin-header-description">
//               Monitor and manage tourism guide licensing
//               activities from one place.
//             </p>
//           </div>

//           <div className="admin-header-right">

//             <button
//               className="admin-refresh"
//               onClick={fetchApplications}
//             >
//               ↻ Refresh
//             </button>

//             <div className="admin-header-profile">

//               <div className="admin-header-avatar">
//                 {officer.fullName
//                   ? officer.fullName.charAt(0).toUpperCase()
//                   : "A"}
//               </div>

//               <div>
//                 <strong>
//                   {officer.fullName || "Administrator"}
//                 </strong>

//                 <span>
//                   {officer.role || "Admin"}
//                 </span>
//               </div>

//             </div>

//           </div>

//         </header>

//         {/* STATISTICS */}

//         <section className="admin-stat-grid">

//           <div className="admin-stat-card">

//             <div className="stat-icon blue">
//               ▤
//             </div>

//             <div>
//               <span>Total Applications</span>

//               <strong>
//                 {loading ? "—" : totalApplications}
//               </strong>

//               <small>
//                 All submitted applications
//               </small>
//             </div>

//           </div>

//           <div className="admin-stat-card">

//             <div className="stat-icon orange">
//               ◷
//             </div>

//             <div>
//               <span>Pending Verification</span>

//               <strong>
//                 {loading ? "—" : pendingApplications}
//               </strong>

//               <small>
//                 Require officer review
//               </small>
//             </div>

//           </div>

//           <div className="admin-stat-card">

//             <div className="stat-icon green">
//               ✓
//             </div>

//             <div>
//               <span>Approved</span>

//               <strong>
//                 {loading ? "—" : approvedApplications}
//               </strong>

//               <small>
//                 Successfully approved
//               </small>
//             </div>

//           </div>

//           <div className="admin-stat-card">

//             <div className="stat-icon red">
//               !
//             </div>

//             <div>
//               <span>Rejected</span>

//               <strong>
//                 {loading ? "—" : rejectedApplications}
//               </strong>

//               <small>
//                 Rejected applications
//               </small>
//             </div>

//           </div>

//         </section>

//         {/* QUICK ACTIONS */}

//         <section className="admin-section">

//           <div className="admin-section-heading">

//             <div>
//               <h2>
//                 Application Management
//               </h2>

//               <p>
//                 Review and process tourism guide license
//                 applications.
//               </p>
//             </div>

//             <button
//               className="view-all-button"
//               onClick={() => navigate("/admin-applications")}
//             >
//               View All Applications →
//             </button>

//           </div>

//           <div className="admin-action-grid">

//             <button
//               className="admin-action-card"
//               onClick={() => navigate("/admin-applications")}
//             >
//               <div className="action-icon">
//                 ▤
//               </div>

//               <div>
//                 <h3>
//                   Review Applications
//                 </h3>

//                 <p>
//                   Verify applicant information,
//                   documents and eligibility.
//                 </p>
//               </div>

//               <span className="action-arrow">
//                 →
//               </span>
//             </button>

//             <button
//               className="admin-action-card"
//             >
//               <div className="action-icon">
//                 ↻
//               </div>

//               <div>
//                 <h3>
//                   Renewal Requests
//                 </h3>

//                 <p>
//                   Review and process license renewal
//                   requests.
//                 </p>
//               </div>

//               <span className="action-arrow">
//                 →
//               </span>
//             </button>

//             <button
//               className="admin-action-card"
//             >
//               <div className="action-icon">
//                 ⚑
//               </div>

//               <div>
//                 <h3>
//                   Manage Complaints
//                 </h3>

//                 <p>
//                   Monitor complaints and update their
//                   resolution status.
//                 </p>
//               </div>

//               <span className="action-arrow">
//                 →
//               </span>
//             </button>

//           </div>

//         </section>

//         {/* RECENT APPLICATIONS */}

//         <section className="admin-section">

//           <div className="admin-section-heading">

//             <div>
//               <h2>
//                 Recent Applications
//               </h2>

//               <p>
//                 Latest applications submitted by
//                 applicants.
//               </p>
//             </div>

//             <button
//               className="view-all-button"
//               onClick={() => navigate("/admin-applications")}
//             >
//               View All →
//             </button>

//           </div>

//           <div className="admin-table-card">

//             {loading ? (

//               <div className="admin-empty-state">
//                 Loading applications...
//               </div>

//             ) : applications.length === 0 ? (

//               <div className="admin-empty-state">
//                 <div className="empty-icon">
//                   ▤
//                 </div>

//                 <h3>
//                   No applications yet
//                 </h3>

//                 <p>
//                   New tourism guide applications will
//                   appear here.
//                 </p>
//               </div>

//             ) : (

//               <div className="admin-table-wrapper">

//                 <table className="admin-table">

//                   <thead>
//                     <tr>
//                       <th>Applicant</th>
//                       <th>Email</th>
//                       <th>Qualification</th>
//                       <th>Status</th>
//                       <th>Submitted</th>
//                     </tr>
//                   </thead>

//                   <tbody>

//                     {applications
//                       .slice(0, 5)
//                       .map((application) => (

//                         <tr key={application._id}>

//                           <td>
//                             <strong>
//                               {application.fullName}
//                             </strong>
//                           </td>

//                           <td>
//                             {application.email}
//                           </td>

//                           <td>
//                             {application.educationalQualification}
//                           </td>

//                           <td>
//                             <span
//                               className={`status-badge ${application.applicationStatus
//                                 .toLowerCase()
//                                 .replace(/\s+/g, "-")}`}
//                             >
//                               {application.applicationStatus}
//                             </span>
//                           </td>

//                           <td>
//                             {new Date(
//                               application.createdAt
//                             ).toLocaleDateString()}
//                           </td>

//                         </tr>

//                       ))}

//                   </tbody>

//                 </table>

//               </div>

//             )}

//           </div>

//         </section>

//       </main>

//     </div>
//   );
// }

// export default AdminDashboard;

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import NotificationBell from "../tourism/components/NotificationBell";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({});
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tourismNotifications, setTourismNotifications] = useState({
    tours: [],
    entries: [],
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const officer = JSON.parse(
    localStorage.getItem("officer") || "{}"
  );

  const officerToken = localStorage.getItem("officerToken");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/applications?page=1&pageSize=10`,
        {
          method: "GET",
          headers: {
            Authorization: ["Bearer", officerToken].join(" "),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch applications"
        );
      }

      setApplications(data.applications || []);
      setSummary(data.summary || {});

      try {
        const overviewResponse = await fetch(
          `${API_BASE_URL}/api/admin/reports/overview`,
          {
            method: "GET",
            headers: {
              Authorization: ["Bearer", officerToken].join(" "),
            }
          }
        );
        const overviewData = await overviewResponse.json();
        if (!overviewResponse.ok) {
          throw new Error(
            overviewData.message || "Unable to fetch dashboard metrics"
          );
        }
        setOverview(overviewData);
        setOverviewError("");
      } catch (overviewFetchError) {
        console.error("Dashboard overview error:", overviewFetchError);
        setOverview(null);
        setOverviewError(
          overviewFetchError.message || "Unable to load dashboard metrics."
        );
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [officerToken]);

  const refreshTourismNotifications = useCallback(async () => {
    if (officer.role !== "Admin") return;
    setNotificationsLoading(true);
    setNotificationError("");
    try {
      const headers = { Authorization: `Bearer ${officerToken}` };
      const [tourResponse, feedbackResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tourism/admin/tours`, { headers }),
        fetch(`${API_BASE_URL}/api/tourism/admin/feedback`, { headers }),
      ]);
      const [tourData, feedbackData] = await Promise.all([
        tourResponse.json(),
        feedbackResponse.json(),
      ]);
      if (!tourResponse.ok) {
        throw new Error(tourData.message || "Unable to refresh tour activity.");
      }
      if (!feedbackResponse.ok) {
        throw new Error(
          feedbackData.message || "Unable to refresh tourist submissions."
        );
      }
      setTourismNotifications({
        tours: tourData.tours || [],
        entries: feedbackData.entries || [],
      });
    } catch (error) {
      console.error("Admin tourism notifications error:", error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to refresh tourism notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, [officer.role, officerToken]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (officer.role !== "Admin") return undefined;
    const initialRefresh = window.setTimeout(
      () => refreshTourismNotifications(),
      0
    );
    const refreshInterval = window.setInterval(
      refreshTourismNotifications,
      60_000
    );
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(refreshInterval);
    };
  }, [refreshTourismNotifications, officer.role]);

  const totalApplications = Object.values(summary).reduce(
    (total, count) => total + count,
    0
  );
  const pendingApplications =
    (summary.Submitted || 0) + (summary["Under Verification"] || 0);
  const approvedApplications = summary.Approved || 0;
  const rejectedApplications = summary.Rejected || 0;

  const adminNotifications = [
    ...(tourismNotifications.entries || [])
      .filter((entry) => entry.moderationStatus === "Pending")
      .map((entry) => ({
        id: `tourism-submission:${entry._id}:${entry.updatedAt || entry.createdAt}`,
        title: `New tourist ${entry.type.toLowerCase()}`,
        message: `${entry.attractionId?.name || "Tour"} · ${entry.touristId?.fullName || "Tourist"}: ${entry.message}`,
        date: entry.createdAt,
        path: "/admin-tourism",
      })),
    ...(tourismNotifications.tours || [])
      .filter(
        (tour) =>
          tour.status === "Started" ||
          (tour.status === "Completed" && tour.verified)
      )
      .map((tour) => ({
        id: `tourism-tour:${tour._id}:${tour.updatedAt || tour.status}`,
        title:
          tour.status === "Started"
            ? "Tour in progress"
            : "GPS-verified tour completed",
        message: `${tour.attractionId?.name || "Tour"} · ${tour.guideApplicationId?.fullName || "Licensed guide"} · ${tour.participants?.length || 0} tourist check-in${tour.participants?.length === 1 ? "" : "s"}`,
        date: tour.updatedAt || tour.startedAt,
        path: "/admin-tourism",
      })),
  ]
    .sort(
      (first, second) =>
        new Date(second.date || 0) - new Date(first.date || 0)
    )
    .slice(0, 30);

  const handleLogout = () => {
    localStorage.removeItem("officerToken");
    localStorage.removeItem("officer");
    navigate("/login");
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="admin-logo">
            TG
          </div>

          <div>
            <h2>Tourism Guide</h2>
            <span>Management Portal</span>
          </div>
        </div>

        <nav className="admin-navigation">

          <button
            className="admin-nav-item active"
            onClick={() => navigate("/admin-dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin-applications")}
          >
            <span>▤</span>
            Applications
          </button>

          {/* RENEWALS SIDEBAR NAVIGATION */}
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin-renewals")}
          >
            <span>↻</span>
            Renewals
          </button>

          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin-complaints")}
          >
            <span>⚑</span>
            Complaints
          </button>

          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin-licenses")}
          >
            <span>▣</span>
            Licenses
          </button>

          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin-reports")}
          >
            <span>▥</span>
            Reports
          </button>

          {officer.role === "Admin" && (
            <button
              className="admin-nav-item"
              onClick={() => navigate("/admin-tourism")}
            >
              <span>⌖</span>
              Tourism Operations
            </button>
          )}

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-user-mini">
            <div className="admin-avatar">
              {officer.fullName
                ? officer.fullName.charAt(0).toUpperCase()
                : "A"}
            </div>

            <div className="admin-user-info">
              <strong>
                {officer.fullName || "Administrator"}
              </strong>

              <span>
                {officer.role || "Admin"}
              </span>
            </div>
          </div>

          <button
            className="admin-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        {/* HEADER */}
        <header className="admin-header">

          <div>
            <p className="admin-page-label">
              ADMINISTRATION
            </p>

            <h1>Dashboard</h1>

            <p className="admin-header-description">
              Monitor and manage tourism guide licensing
              activities from one place.
            </p>
          </div>

          <div className="admin-header-right">

            <button
              className="admin-refresh"
              onClick={fetchApplications}
            >
              ↻ Refresh
            </button>

            {officer.role === "Admin" && (
              <NotificationBell
                notifications={adminNotifications}
                storageKey={`adminTourismReadNotifications:${officer.id || officer._id || officer.email || "admin"}`}
                loading={notificationsLoading}
                error={notificationError}
                onRefresh={refreshTourismNotifications}
                onSelect={(notification) => navigate(notification.path)}
                emptyMessage="New tourist submissions and verified tour activity will appear here."
              />
            )}

            <div className="admin-header-profile">

              <div className="admin-header-avatar">
                {officer.fullName
                  ? officer.fullName.charAt(0).toUpperCase()
                  : "A"}
              </div>

              <div>
                <strong>
                  {officer.fullName || "Administrator"}
                </strong>

                <span>
                  {officer.role || "Admin"}
                </span>
              </div>

            </div>
          </div>

        </header>

        {/* STATISTICS */}
        <section className="admin-stat-grid">

          <div className="admin-stat-card">
            <div className="stat-icon blue">
              ▤
            </div>

            <div>
              <span>Total Applications</span>

              <strong>
                {loading ? "—" : totalApplications}
              </strong>

              <small>
                All submitted applications
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon orange">
              ◷
            </div>

            <div>
              <span>Pending Verification</span>

              <strong>
                {loading ? "—" : pendingApplications}
              </strong>

              <small>
                Require officer review
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon green">
              ✓
            </div>

            <div>
              <span>Approved</span>

              <strong>
                {loading ? "—" : approvedApplications}
              </strong>

              <small>
                Successfully approved
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon red">
              !
            </div>

            <div>
              <span>Rejected</span>

              <strong>
                {loading ? "—" : rejectedApplications}
              </strong>

              <small>
                Rejected applications
              </small>
            </div>
          </div>

        </section>

        {overviewError && (
          <p role="alert" className="dashboard-overview-error">
            {overviewError}
          </p>
        )}

        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="stat-icon blue">▣</div>
            <div>
              <span>Licenses Issued</span>
              <strong>{loading ? "—" : overview?.licenses.issued ?? "—"}</strong>
              <small>Approved guide licenses</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <span>Active Licenses</span>
              <strong>{loading ? "—" : overview?.licenses.active ?? "—"}</strong>
              <small>Not yet expired</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon orange">↻</div>
            <div>
              <span>Pending Renewals</span>
              <strong>{loading ? "—" : overview?.renewals.pending ?? "—"}</strong>
              <small>Awaiting officer review</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon red">⚑</div>
            <div>
              <span>Open Complaints</span>
              <strong>{loading ? "—" : overview?.complaints.open ?? "—"}</strong>
              <small>{overview?.complaints.resolved ?? "—"} resolved</small>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="admin-section">

          <div className="admin-section-heading">

            <div>
              <h2>Application Management</h2>

              <p>
                Review and process tourism guide license
                applications.
              </p>
            </div>

            <button
              className="view-all-button"
              onClick={() => navigate("/admin-applications")}
            >
              View All Applications →
            </button>

          </div>

          <div className="admin-action-grid">

            {/* REVIEW APPLICATIONS */}
            <button
              className="admin-action-card"
              onClick={() => navigate("/admin-applications")}
            >
              <div className="action-icon">
                ▤
              </div>

              <div>
                <h3>Review Applications</h3>

                <p>
                  Verify applicant information,
                  documents and eligibility.
                </p>
              </div>

              <span className="action-arrow">
                →
              </span>
            </button>

            {/* RENEWAL REQUESTS */}
            <button
              className="admin-action-card"
              onClick={() => navigate("/admin-renewals")}
            >
              <div className="action-icon">
                ↻
              </div>

              <div>
                <h3>Renewal Requests</h3>

                <p>
                  Review and process license renewal
                  requests.
                </p>
              </div>

              <span className="action-arrow">
                →
              </span>
            </button>

            {/* MANAGE COMPLAINTS */}
            <button
              className="admin-action-card"
              onClick={() => navigate("/admin-complaints")}
            >
              <div className="action-icon">
                ⚑
              </div>

              <div>
                <h3>Manage Complaints</h3>

                <p>
                  Monitor complaints and update their
                  resolution status.
                </p>
              </div>

              <span className="action-arrow">
                →
              </span>
            </button>

          </div>

        </section>

        {/* RECENT APPLICATIONS */}
        <section className="admin-section">

          <div className="admin-section-heading">

            <div>
              <h2>Recent Applications</h2>

              <p>
                Latest applications submitted by
                applicants.
              </p>
            </div>

            <button
              className="view-all-button"
              onClick={() => navigate("/admin-applications")}
            >
              View All →
            </button>

          </div>

          <div className="admin-table-card">

            {loading ? (
              <div className="admin-empty-state">
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="admin-empty-state">

                <div className="empty-icon">
                  ▤
                </div>

                <h3>No applications yet</h3>

                <p>
                  New tourism guide applications will
                  appear here.
                </p>

              </div>
            ) : (

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Email</th>
                      <th>Qualification</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>

                  <tbody>

                    {applications.slice(0, 5).map((application) => (
                      <tr key={application._id}>

                        <td>
                          <strong>
                            {application.fullName}
                          </strong>
                        </td>

                        <td>
                          {application.email}
                        </td>

                        <td>
                          {application.educationalQualification}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              (application.applicationStatus || "")
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                            }`}
                          >
                            {application.applicationStatus}
                          </span>
                        </td>

                        <td>
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;