import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_URL } from "../api";
import "./AdminDashboard.css";
import "./AdminApplications.css";
import "./AdminComplaints.css";

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = [
  "Submitted",
  "Under Review",
  "In Progress",
  "Action Taken",
  "Resolved",
  "Returned",
  "Rejected",
  "Closed",
];

async function openPrivateDocument(documentPath, token) {
  const filename = documentPath.split(/[\\/]/).pop();
  const documentWindow = window.open("", "_blank");

  try {
    const response = await fetch(
      `${API_URL}/api/files/${encodeURIComponent(filename)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error("Unable to open the document.");
    }

    const blobUrl = URL.createObjectURL(await response.blob());
    if (!documentWindow) {
      URL.revokeObjectURL(blobUrl);
      throw new Error("Allow pop-ups to open the document.");
    }
    documentWindow.location.href = blobUrl;
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    documentWindow?.close();
    throw error;
  }
}

function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getClassName(value = "") {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, critical: 0, resolved: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Submitted");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [resolution, setResolution] = useState("");

  const fetchComplaints = useCallback(async () => {
    const token = localStorage.getItem("officerToken");
    if (!token) {
      setError("Your officer session is missing. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({
        page: String(page),
        pageSize: "25",
        search,
        priority: priorityFilter,
        status: statusFilter
      });
      const response = await fetch(`${API_URL}/api/complaints?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load complaints.");
      }

      const records = data.complaints || [];
      setComplaints(records);
      setSummary(data.summary || { total: 0, pending: 0, critical: 0, resolved: 0 });
      setTotalCount(data.count || 0);
      setTotalPages(Math.max(data.totalPages || 1, 1));
      setSelectedComplaint((current) =>
        current
          ? records.find((record) => record._id === current._id) || null
          : null
      );
    } catch (fetchError) {
      console.error("Admin complaints fetch error:", fetchError);
      setError(fetchError.message || "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  }, [page, priorityFilter, search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchComplaints, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [fetchComplaints, search]);

  const filteredComplaints = complaints;

  const openComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setPriority(complaint.priority || "Medium");
    setStatus(complaint.complaintStatus || "Submitted");
    setOfficerRemarks(complaint.officerRemarks || "");
    setResolution(complaint.resolution || "");
    setReviewError("");
    setReviewMessage("");
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!selectedComplaint) return;

    const token = localStorage.getItem("officerToken");
    if (!token) {
      setReviewError("Your officer session has expired. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setReviewError("");
      setReviewMessage("");

      const response = await fetch(
        `${API_URL}/api/complaints/${selectedComplaint._id}/review`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priority,
            ...(status !== "Submitted" ? { complaintStatus: status } : {}),
            officerRemarks: officerRemarks.trim(),
            resolution: resolution.trim(),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update this complaint.");
      }

      const updatedComplaint = data.complaint || data;
      setComplaints((current) =>
        current.map((complaint) =>
          complaint._id === updatedComplaint._id
            ? { ...complaint, ...updatedComplaint }
            : complaint
        )
      );
      setSelectedComplaint((current) =>
        current?._id === updatedComplaint._id
          ? { ...current, ...updatedComplaint }
          : current
      );
      setReviewMessage(data.message || "Complaint updated successfully.");
      await fetchComplaints();
    } catch (saveError) {
      console.error("Admin complaint review error:", saveError);
      setReviewError(saveError.message || "Unable to update this complaint.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("officerToken");
    localStorage.removeItem("officer");
    navigate("/login");
  };

  const pendingCount = summary.pending;
  const criticalCount = summary.critical;
  const resolvedCount = summary.resolved;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">TG</div>
          <div>
            <h2>Tourism Guide</h2>
            <span>Management Portal</span>
          </div>
        </div>

        <nav className="admin-navigation">
          <button className="admin-nav-item" onClick={() => navigate("/admin-dashboard")}>
            <span>▦</span> Dashboard
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-applications")}>
            <span>▤</span> Applications
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-renewals")}>
            <span>↻</span> Renewals
          </button>
          <button className="admin-nav-item active" aria-current="page">
            <span>⚑</span> Complaints
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-licenses")}>
            <span>▣</span> Licenses
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-reports")}>
            <span>▥</span> Reports
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-mini">
            <div className="admin-avatar">A</div>
            <div className="admin-user-info">
              <strong>Administrator</strong>
              <span>Officer</span>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="applications-header">
          <div>
            <p className="admin-page-label">ADMINISTRATION</p>
            <h1>Complaints</h1>
            <p>Review guide complaints, prioritize cases and provide applicant updates.</p>
          </div>
          <button
            className="application-refresh-button"
            onClick={fetchComplaints}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="application-summary complaint-admin-summary">
          <article className="summary-card">
            <span>Total Complaints</span>
            <strong>{summary.total}</strong>
          </article>
          <article className="summary-card pending-summary">
            <span>Awaiting Action</span>
            <strong>{pendingCount}</strong>
          </article>
          <article className="summary-card complaint-critical-summary">
            <span>Critical Priority</span>
            <strong>{criticalCount}</strong>
          </article>
          <article className="summary-card approved-summary">
            <span>Resolved / Closed</span>
            <strong>{resolvedCount}</strong>
          </article>
        </section>

        <section className="applications-container complaint-admin-container">
          <div className="applications-toolbar">
            <div className="application-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search reference, guide, subject, category or location..."
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                aria-label="Search complaints"
              />
            </div>
            <div className="complaint-admin-filters">
              <label>
                Priority
                <select
                  value={priorityFilter}
                  onChange={(event) => {
                    setPage(1);
                    setPriorityFilter(event.target.value);
                  }}
                  aria-label="Filter by priority"
                >
                  <option value="All">All priorities</option>
                  {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setPage(1);
                    setStatusFilter(event.target.value);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="All">All statuses</option>
                  {STATUSES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          {error && (
            <div className="complaint-admin-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={fetchComplaints}>Try Again</button>
            </div>
          )}

          {loading ? (
            <div className="applications-loading">
              <div className="loading-spinner" />
              <p>Loading complaints...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="applications-empty">
              <div className="empty-application-icon">⚑</div>
              <h3>{totalCount ? "No matching complaints" : "No complaints yet"}</h3>
              <p>
                {totalCount
                  ? "Change your search or filters to see other complaints."
                  : "Guide complaints will appear here when submitted."}
              </p>
            </div>
          ) : (
            <div className="applications-table-wrapper">
              <table className="applications-table complaint-admin-table">
                <thead>
                  <tr>
                    <th>Guide / Reference</th>
                    <th>Complaint</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint._id}>
                      <td>
                        <div className="applicant-cell">
                          <div className="applicant-avatar">
                            {complaint.complainantName?.charAt(0).toUpperCase() || "G"}
                          </div>
                          <div>
                            <strong>{complaint.complainantName || "Guide"}</strong>
                            <small>{complaint.referenceNumber || complaint._id.slice(-8)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span>{complaint.subject}</span>
                          <small>{complaint.category} · {complaint.incidentLocation}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`complaint-admin-priority priority-${getClassName(complaint.priority || "Medium")}`}>
                          {complaint.priority || "Medium"}
                        </span>
                      </td>
                      <td>
                        <span className={`application-status ${getClassName(complaint.complaintStatus || "Submitted")}`}>
                          {complaint.complaintStatus || "Submitted"}
                        </span>
                      </td>
                      <td>{formatDate(complaint.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="review-button"
                          onClick={() => openComplaint(complaint)}
                        >
                          Read & Review
                        </button>
                      </td>
                    </tr>
                  ))}
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

        {selectedComplaint && (
          <section className="applications-container complaint-admin-review">
            <header className="complaint-admin-review-heading">
              <div>
                <p className="admin-page-label">COMPLAINT REVIEW</p>
                <h2>{selectedComplaint.subject}</h2>
                <p>
                  {selectedComplaint.referenceNumber} · {selectedComplaint.complainantName} · {selectedComplaint.complainantEmail}
                </p>
              </div>
              <button
                type="button"
                className="complaint-admin-close"
                onClick={() => setSelectedComplaint(null)}
                aria-label="Close complaint review"
              >
                ×
              </button>
            </header>

            <div className="complaint-admin-detail-grid">
              <div><span>Category</span><strong>{selectedComplaint.category}</strong></div>
              <div><span>Incident date</span><strong>{formatDate(selectedComplaint.incidentDate)}</strong></div>
              <div><span>Location</span><strong>{selectedComplaint.incidentLocation}</strong></div>
              <div><span>Guide phone</span><strong>{selectedComplaint.complainantPhone || "—"}</strong></div>
            </div>
            <div className="complaint-admin-description">
              <h3>Complaint description</h3>
              <p>{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.evidence?.length > 0 && (
              <div className="complaint-admin-evidence">
                <h3>Supporting evidence</h3>
                <ul>
                  {selectedComplaint.evidence.map((filePath, index) => (
                    <li key={`${filePath}-${index}`}>
                      <span>{filePath.split("/").pop()}</span>
                      <a
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          const token = localStorage.getItem("officerToken");
                          if (!token) {
                            setReviewError("Your officer session has expired. Please log in again.");
                            return;
                          }
                          openPrivateDocument(filePath, token).catch((error) => {
                            console.error("Complaint evidence access error:", error);
                            setReviewError(error.message || "Unable to open the document.");
                          });
                        }}
                      >
                        Open evidence ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form className="complaint-admin-review-form" onSubmit={submitReview}>
              <h3>Record review and applicant update</h3>
              {reviewError && <p className="complaint-admin-feedback error" role="alert">{reviewError}</p>}
              {reviewMessage && <p className="complaint-admin-feedback success" role="status">{reviewMessage}</p>}
              <div className="complaint-admin-review-fields">
                <label>
                  Priority
                  <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                    {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Status
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    {STATUSES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="complaint-admin-review-wide">
                  Officer remarks <span className="complaint-admin-hint">(visible to the applicant)</span>
                  <textarea
                    rows={4}
                    value={officerRemarks}
                    onChange={(event) => setOfficerRemarks(event.target.value)}
                    placeholder="Enter a clear update for the guide"
                  />
                </label>
                <label className="complaint-admin-review-wide">
                  Resolution
                  <textarea
                    rows={3}
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    placeholder="Record the action taken or resolution, if applicable"
                  />
                </label>
              </div>
              <button className="application-refresh-button" type="submit" disabled={saving}>
                {saving ? "Saving review..." : "Save Review"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminComplaints;
