import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_URL } from "../api";
import "./Renewals.css";

const STATUSES = [
  "Submitted",
  "Under Verification",
  "Approved",
  "Returned",
  "Rejected",
];
const DOCUMENTS = [
  ["Government ID", "governmentIdDocument"],
  ["Police Certificate", "policeCertificate"],
  ["Medical Certificate", "medicalCertificate"],
  ["Training Certificate", "trainingCertificate"],
  ["Passport Photo", "passportPhoto"],
];

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

function toDateInputValue(date) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const localDate = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
}

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

function getMinimumRenewedExpiry(currentExpiry) {
  const earliest = new Date();
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() + 1);

  if (currentExpiry) {
    const current = new Date(currentExpiry);
    if (!Number.isNaN(current.getTime())) {
      current.setHours(0, 0, 0, 0);
      current.setDate(current.getDate() + 1);
      if (current > earliest) {
        return toDateInputValue(current);
      }
    }
  }

  return toDateInputValue(earliest);
}

function Renewals() {
  const navigate = useNavigate();
  const [renewals, setRenewals] = useState([]);
  const [summary, setSummary] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("Under Verification");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [retryingNotification, setRetryingNotification] = useState(false);

  const fetchRenewals = useCallback(async () => {
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
        status: statusFilter
      });
      const response = await fetch(`${API_URL}/api/renewals?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load renewal requests.");
      }

      const records = data.renewals || [];
      setRenewals(records);
      setSummary(data.summary || {});
      setTotalCount(data.count || 0);
      setTotalPages(Math.max(data.totalPages || 1, 1));
      setSelectedRenewal((current) =>
        current
          ? records.find((record) => record._id === current._id) || null
          : null
      );
    } catch (fetchError) {
      console.error("Renewal requests fetch error:", fetchError);
      setError(fetchError.message || "Unable to load renewal requests.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchRenewals, search ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [fetchRenewals, search]);

  const filteredRenewals = renewals;
  const pendingCount =
    (summary.Submitted || 0) + (summary["Under Verification"] || 0);
  const approvedCount = summary.Approved || 0;
  const rejectedCount = summary.Rejected || 0;

  const openReview = (renewal) => {
    setSelectedRenewal(renewal);
    setReviewStatus(
      renewal.renewalStatus === "Submitted"
        ? "Under Verification"
        : renewal.renewalStatus
    );
    setOfficerRemarks(renewal.officerRemarks || "");
    setExpiryDate(toDateInputValue(renewal.renewedLicenseExpiryDate));
    setReviewMessage("");
    setReviewError("");
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!selectedRenewal) return;

    const token = localStorage.getItem("officerToken");
    if (!token) {
      setReviewError("Your officer session has expired. Please log in again.");
      return;
    }

    if (
      ["Returned", "Rejected"].includes(reviewStatus) &&
      !officerRemarks.trim()
    ) {
      setReviewError("Add officer remarks before returning or rejecting this request.");
      return;
    }

    if (reviewStatus === "Approved" && !expiryDate) {
      setReviewError("Enter the new license expiry date before approving.");
      return;
    }

    try {
      setSaving(true);
      setReviewError("");
      setReviewMessage("");

      const response = await fetch(
        `${API_URL}/api/renewals/${selectedRenewal._id}/review`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            renewalStatus: reviewStatus,
            officerRemarks: officerRemarks.trim(),
            ...(reviewStatus === "Approved"
              ? { renewedLicenseExpiryDate: expiryDate }
              : {}),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Unable to update this renewal (HTTP ${response.status}).`
        );
      }

      setReviewMessage(data.message || "Renewal request updated.");
      await fetchRenewals();
    } catch (saveError) {
      console.error("Renewal review error:", saveError);
      setReviewError(saveError.message || "Unable to update this renewal.");
    } finally {
      setSaving(false);
    }
  };

  const retryNotification = async () => {
    if (!selectedRenewal) return;
    const token = localStorage.getItem("officerToken");
    if (!token) {
      setReviewError("Your officer session has expired. Please log in again.");
      return;
    }

    try {
      setRetryingNotification(true);
      setReviewError("");
      setReviewMessage("");
      const response = await fetch(
        `${API_URL}/api/renewals/${selectedRenewal._id}/notifications/retry`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      await fetchRenewals();

      if (response.status === 202) {
        setReviewError(data.message || "Email delivery status is not yet confirmed.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to retry the notification.");
      }
      setReviewMessage(data.message || "Notification sent successfully.");
    } catch (retryError) {
      console.error("Renewal notification retry error:", retryError);
      setReviewError(retryError.message || "Unable to retry the notification.");
    } finally {
      setRetryingNotification(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPage(1);
  };

  const statusClass = (status = "") =>
    status.toLowerCase().replace(/\s+/g, "-");

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
          <button className="admin-nav-item active" aria-current="page">
            <span>↻</span> Renewals
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-complaints")}>
            <span>⚑</span> Complaints
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-licenses")}>
            <span>▣</span> Licenses
          </button>
          <button className="admin-nav-item" onClick={() => navigate("/admin-reports")}>
            <span>▥</span> Reports
          </button>
        </nav>
      </aside>

      <main className="admin-main renewals-main">
        <header className="admin-header">
          <div>
            <p className="admin-page-label">ADMINISTRATION</p>
            <h1>License Renewals</h1>
            <p className="admin-header-description">
              Review requests, verify supporting documents, and record decisions.
            </p>
          </div>
          <button type="button" className="admin-refresh" onClick={fetchRenewals}>
            ↻ Refresh
          </button>
        </header>

        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="stat-icon blue">↻</div>
            <div><span>Total Requests</span><strong>{loading ? "—" : Object.values(summary).reduce((total, count) => total + count, 0)}</strong><small>All renewal requests</small></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon orange">◷</div>
            <div><span>Pending Review</span><strong>{loading ? "—" : pendingCount}</strong><small>Submitted or under verification</small></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon green">✓</div>
            <div><span>Approved</span><strong>{loading ? "—" : approvedCount}</strong><small>Renewals approved</small></div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon red">!</div>
            <div><span>Rejected</span><strong>{loading ? "—" : rejectedCount}</strong><small>Renewals rejected</small></div>
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Renewal Requests</h2>
              <p>Search and review submitted license renewals.</p>
            </div>
            <button type="button" className="renewals-reset-btn" onClick={clearFilters}>
              Reset Filters
            </button>
          </div>

          <div className="renewals-toolbar">
            <input
              type="search"
              placeholder="Search applicant, email, license or reason..."
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              aria-label="Search renewal requests"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              aria-label="Filter renewal requests by status"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          {error ? (
            <div className="renewals-feedback renewals-feedback-error" role="alert">
              <strong>Unable to load renewal requests</strong>
              <p>{error}</p>
              <button type="button" onClick={fetchRenewals}>Try Again</button>
              {error.toLowerCase().includes("log in") && (
                <button type="button" onClick={() => navigate("/login")}>Go to Login</button>
              )}
            </div>
          ) : loading ? (
            <div className="renewals-feedback">Loading renewal requests...</div>
          ) : filteredRenewals.length === 0 ? (
            <div className="renewals-feedback">
              <strong>{totalCount ? "No matching requests" : "No renewal requests yet"}</strong>
              <p>
                {totalCount
                  ? "Change your search or status filter."
                  : "Applicant-submitted renewal requests will appear here."}
              </p>
            </div>
          ) : (
            <div className="renewals-table-wrapper">
              <table className="renewals-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>License</th>
                    <th>Reason</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRenewals.map((renewal) => {
                    const application =
                      renewal.applicationId && typeof renewal.applicationId === "object"
                        ? renewal.applicationId
                        : {};

                    return (
                      <tr key={renewal._id}>
                        <td>
                          <strong>{application.fullName || "Applicant"}</strong>
                          <small>{application.email || "Email unavailable"}</small>
                        </td>
                        <td>{renewal.previousLicenseNumber || "—"}</td>
                        <td>{renewal.renewalReason || "—"}</td>
                        <td>{formatDate(renewal.createdAt)}</td>
                        <td>
                          <span className={`renewals-status status-${statusClass(renewal.renewalStatus)}`}>
                            {renewal.renewalStatus}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="renewals-view-btn" onClick={() => openReview(renewal)}>
                            Review details →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

        {selectedRenewal && (
          <section className="admin-section renewal-review-section" aria-labelledby="renewal-review-title">
            <div className="admin-section-heading">
              <div>
                <p className="admin-page-label">REQUEST REVIEW</p>
                <h2 id="renewal-review-title">
                  {selectedRenewal.applicationId?.fullName || "Applicant"} · {selectedRenewal.previousLicenseNumber}
                </h2>
                <p>Submitted {formatDate(selectedRenewal.createdAt)}</p>
              </div>
              <button type="button" className="renewals-reset-btn" onClick={() => setSelectedRenewal(null)}>
                Close details
              </button>
            </div>

            <div className="renewal-review-grid">
              <div><span>Email</span><strong>{selectedRenewal.applicationId?.email || "—"}</strong></div>
              <div><span>Current phone</span><strong>{selectedRenewal.applicationId?.phone || "—"}</strong></div>
              <div><span>Renewal phone</span><strong>{selectedRenewal.updatedPhone || "No change"}</strong></div>
              <div><span>Current license expiry</span><strong>{formatDate(selectedRenewal.currentLicenseExpiryDate)}</strong></div>
              <div><span>Renewal reason</span><strong>{selectedRenewal.renewalReason || "—"}</strong></div>
              <div><span>Updated address</span><strong>{selectedRenewal.updatedAddress || "No change"}</strong></div>
              <div className="renewal-review-wide">
                <span>Languages</span>
                <strong>{selectedRenewal.updatedLanguagesKnown?.join(", ") || "No change"}</strong>
              </div>
              {selectedRenewal.applicantRemarks && (
                <div className="renewal-review-wide">
                  <span>Applicant remarks</span>
                  <strong>{selectedRenewal.applicantRemarks}</strong>
                </div>
              )}
            </div>

            <div className="renewal-documents">
              <h3>Supporting documents</h3>
              <div>
                {DOCUMENTS.map(([label, key]) => (
                  selectedRenewal[key] ? (
                    <a
                      key={key}
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        const token = localStorage.getItem("officerToken");
                        if (!token) {
                          setReviewError("Your officer session has expired. Please log in again.");
                          return;
                        }
                        openPrivateDocument(selectedRenewal[key], token).catch((error) => {
                          console.error("Renewal document access error:", error);
                          setReviewError(error.message || "Unable to open the document.");
                        });
                      }}
                    >
                      {label} ↗
                    </a>
                  ) : (
                    <span key={key} className="renewal-document-missing">{label}: not provided</span>
                  )
                ))}
              </div>
            </div>

            {selectedRenewal.history?.length > 0 && (
              <div className="renewal-history">
                <div className="admin-section-heading">
                  <h3>Request history</h3>
                  {selectedRenewal.history.some((entry) =>
                    ["Pending", "Failed"].includes(entry.notificationStatus)
                  ) && (
                    <button
                      type="button"
                      className="renewals-reset-btn"
                      onClick={retryNotification}
                      disabled={retryingNotification}
                    >
                      {retryingNotification ? "Retrying email..." : "Retry failed email"}
                    </button>
                  )}
                </div>
                <ol>
                  {[...selectedRenewal.history].reverse().map((entry, index) => (
                    <li key={`${entry.status}-${entry.updatedAt}-${index}`}>
                      <strong>{entry.status}</strong>
                      <span>{formatDate(entry.updatedAt)} · {entry.updatedBy}</span>
                      {entry.notificationStatus &&
                        entry.notificationStatus !== "NotRequired" && (
                          <span>Email: {entry.notificationStatus}</span>
                        )}
                      {entry.remarks && <p>{entry.remarks}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <form className="renewal-review-form" onSubmit={submitReview}>
              <h3>Record decision</h3>
              {reviewError && <p className="renewals-feedback-error" role="alert">{reviewError}</p>}
              {reviewMessage && <p className="renewals-feedback-success" role="status">{reviewMessage}</p>}
              <div className="renewal-review-form-fields">
                <label>
                  Status
                  <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
                    {STATUSES.filter((status) => status !== "Submitted").map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {reviewStatus === "Approved" && (
                  <label>
                    New license expiry date
                    <input
                      type="date"
                      min={getMinimumRenewedExpiry(selectedRenewal.currentLicenseExpiryDate)}
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(event.target.value)}
                      required
                    />
                  </label>
                )}
                <label className="renewal-review-wide">
                  Officer remarks {["Returned", "Rejected"].includes(reviewStatus) && <span>(required)</span>}
                  <textarea
                    rows={3}
                    value={officerRemarks}
                    onChange={(event) => setOfficerRemarks(event.target.value)}
                    placeholder="Enter a clear update for the applicant"
                    required={["Returned", "Rejected"].includes(reviewStatus)}
                  />
                </label>
              </div>
              <button type="submit" className="renewals-save-btn" disabled={saving}>
                {saving ? "Saving decision..." : "Save Decision"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default Renewals;
