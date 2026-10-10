import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./AdminApplications.css";

function AdminApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const officerToken = localStorage.getItem("officerToken");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!officerToken) {
        throw new Error("Your officer session has expired. Please sign in again.");
      }

      const query = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        search,
        status: statusFilter
      });
      const response = await fetch(
        `${API_BASE_URL}/api/admin/applications?${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${officerToken}`
          }
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
      setTotalCount(data.count || 0);
      setTotalPages(Math.max(data.totalPages || 1, 1));
    } catch (error) {
      console.error("Applications fetch error:", error);

      setError(
        error.message ||
          "Unable to load applications"
      );
    } finally {
      setLoading(false);
    }
  }, [officerToken, page, search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchApplications, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [fetchApplications, search]);

  const getStatusClass = (status) => {
    return status
      ?.toLowerCase()
      .replace(/\s+/g, "-");
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

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
            className="admin-nav-item"
            onClick={() =>
              navigate("/admin-dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="admin-nav-item active"
            onClick={() =>
              navigate("/admin-applications")
            }
          >
            <span>▤</span>
            Applications
          </button>

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

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-user-mini">

            <div className="admin-avatar">
              A
            </div>

            <div className="admin-user-info">
              <strong>
                Administrator
              </strong>

              <span>
                Officer
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

        <header className="applications-header">

          <div>

            <p className="admin-page-label">
              ADMINISTRATION
            </p>

            <h1>
              Applications
            </h1>

            <p>
              Review and manage tourism guide license
              applications.
            </p>

          </div>

          <button
            className="application-refresh-button"
            onClick={fetchApplications}
          >
            ↻ Refresh
          </button>

        </header>

        {/* SUMMARY */}

        <div className="application-summary">

          <div className="summary-card">
            <span>Total Applications</span>
            <strong>
              {Object.values(summary).reduce(
                (total, count) => total + count,
                0
              )}
            </strong>
          </div>

          <div className="summary-card pending-summary">
            <span>Pending</span>
            <strong>
              {
                (summary.Submitted || 0) +
                (summary["Under Verification"] || 0)
              }
            </strong>
          </div>

          <div className="summary-card approved-summary">
            <span>Approved</span>
            <strong>
              {
                summary.Approved || 0
              }
            </strong>
          </div>

          <div className="summary-card rejected-summary">
            <span>Rejected</span>
            <strong>
              {
                summary.Rejected || 0
              }
            </strong>
          </div>

        </div>

        {/* FILTER SECTION */}

        <section className="applications-container">

          <div className="applications-toolbar">

            <div className="application-search">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search by name, email, phone or license number..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />

            </div>

            <div className="status-filter">

              <label>
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="All">
                  All Applications
                </option>

                <option value="Submitted">
                  Submitted
                </option>

                <option value="Under Verification">
                  Under Verification
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="Returned">
                  Returned
                </option>

                <option value="Rejected">
                  Rejected
                </option>

              </select>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="applications-error">
              {error}
            </div>
          )}

          {/* LOADING */}

          {loading ? (

            <div className="applications-loading">
              <div className="loading-spinner"></div>

              <p>
                Loading applications...
              </p>
            </div>

          ) : applications.length === 0 ? (

            <div className="applications-empty">

              <div className="empty-application-icon">
                ▤
              </div>

              <h3>
                No applications found
              </h3>

              <p>
                Try changing your search or
                status filter.
              </p>

            </div>

          ) : (

            <div className="applications-table-wrapper">

              <table className="applications-table">

                <thead>

                  <tr>
                    <th>Applicant</th>
                    <th>Contact</th>
                    <th>Qualification</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {applications.map(
                    (application) => (

                      <tr
                        key={application._id}
                      >

                        <td>

                          <div className="applicant-cell">

                            <div className="applicant-avatar">
                              {application.fullName
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {
                                  application.fullName
                                }
                              </strong>

                              <small>
                                Application ID:{" "}
                                {application._id.slice(
                                  -8
                                )}
                              </small>
                            </div>

                          </div>

                        </td>

                        <td>

                          <div className="contact-cell">

                            <span>
                              {
                                application.email
                              }
                            </span>

                            <small>
                              {
                                application.phone
                              }
                            </small>

                          </div>

                        </td>

                        <td>
                          {
                            application.educationalQualification
                          }
                        </td>

                        <td>

                          <span
                            className={`application-status ${getStatusClass(
                              application.applicationStatus
                            )}`}
                          >
                            {
                              application.applicationStatus
                            }
                          </span>

                        </td>

                        <td>
                          {formatDate(
                            application.createdAt
                          )}
                        </td>

                        <td>

                          <button
                            className="review-button"
                            onClick={() =>
                              navigate(
                                `/admin-applications/${application._id}`
                              )
                            }
                          >
                            Review →
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

          {!loading && totalCount > 0 && (
            <div className="applications-pagination">
              <span>
                Showing {(page - 1) * 25 + 1}–
                {Math.min(page * 25, totalCount)} of {totalCount}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default AdminApplications;