
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./ComplaintsDashboard.css";


const API_URL = `${API_BASE_URL}/api/complaints`;

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status = "") {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function ComplaintsDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Your session is missing. Please log in again.");
          return;
        }

        const response = await fetch(`${API_URL}/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load complaints.");
        }

        setComplaints(
          Array.isArray(data) ? data : data.complaints || []
        );
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesSearch = [
        complaint.referenceNumber,
        complaint.subject,
        complaint.category,
        complaint.incidentLocation,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" ||
        complaint.complaintStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, statusFilter]);

  const openStatuses = [
    "Submitted",
    "Under Review",
    "In Progress",
    "Action Taken",
    "Returned",
  ];

  const activeCount = complaints.filter((complaint) =>
    openStatuses.includes(complaint.complaintStatus)
  ).length;

  const resolvedCount = complaints.filter(
    (complaint) => complaint.complaintStatus === "Resolved"
  ).length;

  const rejectedCount = complaints.filter(
    (complaint) => complaint.complaintStatus === "Rejected"
  ).length;

  return (
    <div className="complaints-page">
      <header className="complaints-header">
        <div>
          <p className="complaints-eyebrow">APPLICANT PORTAL</p>
          <h1>Complaint Management</h1>
          <p className="complaints-subtitle">
            Submit concerns and track the progress of complaints you have
            reported.
          </p>
        </div>

<div className="complaints-header-actions">
  <button
    type="button"
    className="complaint-back-btn"
    onClick={() => navigate("/dashboard")}
  >
    ← Back to Dashboard
  </button>

  <button
    type="button"
    className="complaint-primary-btn"
    onClick={() => navigate("/complaints/new")}
  >
    <span aria-hidden="true">＋</span> Submit a Complaint
  </button>
</div>


      </header>

      <section className="complaint-summary-grid">
        <article className="complaint-summary-card summary-total">
          <div className="summary-icon">▤</div>
          <div>
            <p>Total Complaints</p>
            <h2>{complaints.length}</h2>
            <span>All submissions</span>
          </div>
        </article>

        <article className="complaint-summary-card summary-active">
          <div className="summary-icon">◷</div>
          <div>
            <p>Active Complaints</p>
            <h2>{activeCount}</h2>
            <span>Awaiting completion</span>
          </div>
        </article>

        <article className="complaint-summary-card summary-resolved">
          <div className="summary-icon">✓</div>
          <div>
            <p>Resolved</p>
            <h2>{resolvedCount}</h2>
            <span>Resolution recorded</span>
          </div>
        </article>

        <article className="complaint-summary-card summary-rejected">
          <div className="summary-icon">!</div>
          <div>
            <p>Rejected</p>
            <h2>{rejectedCount}</h2>
            <span>Review the remarks</span>
          </div>
        </article>
      </section>

      <section className="complaints-list-panel">
        <div className="complaints-list-heading">
          <div>
            <h2>My Complaints</h2>
            <p>View tracking information and officer updates.</p>
          </div>

          <span className="complaint-count">
            {filteredComplaints.length} record
            {filteredComplaints.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="complaint-toolbar">
          <div className="complaint-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Search reference, subject, category or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search complaints"
            />
          </div>

          <select
            className="complaint-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter complaints by status"
          >
            <option value="All">All statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Action Taken">Action Taken</option>
            <option value="Returned">Returned</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="complaint-message">
            <div className="complaint-loader" />
            <p>Loading your complaints...</p>
          </div>
        ) : error ? (
          <div className="complaint-message complaint-error">
            <div className="complaint-message-icon">!</div>
            <h3>Unable to load complaints</h3>
            <p>{error}</p>
            <button
              type="button"
              className="complaint-secondary-btn"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="complaint-message">
            <div className="complaint-empty-icon">▤</div>
            <h3>
              {complaints.length === 0
                ? "No complaints submitted yet"
                : "No matching complaints"}
            </h3>
            <p>
              {complaints.length === 0
                ? "Your submitted complaints and their progress will appear here."
                : "Try a different search term or change the status filter."}
            </p>

            {complaints.length === 0 && (
              <button
                type="button"
                className="complaint-primary-btn"
                onClick={() => navigate("/complaints/new")}
              >
                Submit Your First Complaint
              </button>
            )}
          </div>
        ) : (
          <div className="complaint-table-wrapper">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>Complaint Details</th>
                  <th>Incident Location</th>
                  <th>Submitted On</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td>
                      <div className="complaint-detail-cell">
                        <strong>
                          {complaint.subject || "Untitled complaint"}
                        </strong>
                        <span>
                          {complaint.referenceNumber || "Reference pending"}
                        </span>
                        <small>{complaint.category}</small>
                      </div>
                    </td>

                    <td className="complaint-location-cell">
                      {complaint.incidentLocation || "—"}
                    </td>

                    <td>{formatDate(complaint.createdAt)}</td>

                    <td>
                      <span
                        className={`complaint-priority priority-${(
                          complaint.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {complaint.priority || "Medium"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`complaint-status status-${getStatusClass(
                          complaint.complaintStatus
                        )}`}
                      >
                        {complaint.complaintStatus || "Submitted"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="complaint-view-btn"
                        onClick={() =>
                          navigate(`/complaints/${complaint._id}`)
                        }
                      >
                        View details <span aria-hidden="true">→</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="complaint-information-note">
        <span className="note-icon" aria-hidden="true">ⓘ</span>
        <p>
          <strong>Need an update?</strong> Open a complaint to check its
          status, officer remarks, and any recorded resolution. Status updates
          appear after the reviewing officer updates the record.
        </p>
      </div>
    </div>
  );
}

export default ComplaintsDashboard;