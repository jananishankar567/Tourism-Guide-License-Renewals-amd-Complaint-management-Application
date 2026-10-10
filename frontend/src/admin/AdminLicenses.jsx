import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_URL } from "../api";
import "./AdminDashboard.css";
import "./AdminApplications.css";
import "./AdminLicenses.css";

const LICENSE_STATUSES = [
  "Active",
  "Expiring Soon",
  "Expired",
  "Expiry Date Missing",
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

function getClassName(value = "") {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function AdminLicenses() {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [renewalHistory, setRenewalHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  const fetchLicenses = useCallback(async () => {
    const token = localStorage.getItem("officerToken");
    if (!token) {
      setError("Your officer session is missing. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/admin/licenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load issued licenses.");
      }

      const records = Array.isArray(data) ? data : data.licenses || [];
      setLicenses(records);
      setSelectedLicense((current) =>
        current
          ? records.find((license) => license._id === current._id) || null
          : null
      );
    } catch (fetchError) {
      console.error("Issued license register fetch error:", fetchError);
      setError(fetchError.message || "Unable to load issued licenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const filteredLicenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return licenses.filter((license) => {
      const matchesSearch = [
        license.licenseNumber,
        license.fullName,
        license.email,
        license.phone,
        license.address,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "All" || license.licenseStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [licenses, search, statusFilter]);

  const openDetails = async (license) => {
    const token = localStorage.getItem("officerToken");
    if (!token) {
      setDetailsError("Your officer session has expired. Please log in again.");
      return;
    }

    setSelectedLicense(license);
    setRenewalHistory([]);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/licenses/${encodeURIComponent(license._id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load license details.");
      }

      setSelectedLicense(data.license);
      setRenewalHistory(data.renewalHistory || []);
    } catch (detailError) {
      console.error("Issued license details fetch error:", detailError);
      setDetailsError(detailError.message || "Unable to load license details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const activeCount = licenses.filter(
    (license) => license.licenseStatus === "Active"
  ).length;
  const expiringCount = licenses.filter(
    (license) => license.licenseStatus === "Expiring Soon"
  ).length;
  const expiredCount = licenses.filter(
    (license) => license.licenseStatus === "Expired"
  ).length;

  const handleLogout = () => {
    localStorage.removeItem("officerToken");
    localStorage.removeItem("officer");
    navigate("/login");
  };

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
          <button className="admin-nav-item" onClick={() => navigate("/admin-complaints")}>
            <span>⚑</span> Complaints
          </button>
          <button className="admin-nav-item active" aria-current="page">
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
            <h1>Issued License Register</h1>
            <p>Search issued guide licenses and review their validity and renewal history.</p>
          </div>
          <button
            className="application-refresh-button"
            onClick={fetchLicenses}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="application-summary license-summary">
          <article className="summary-card">
            <span>Issued Licenses</span>
            <strong>{licenses.length}</strong>
          </article>
          <article className="summary-card approved-summary">
            <span>Active</span>
            <strong>{activeCount}</strong>
          </article>
          <article className="summary-card license-expiring-summary">
            <span>Expiring Soon</span>
            <strong>{expiringCount}</strong>
          </article>
          <article className="summary-card rejected-summary">
            <span>Expired</span>
            <strong>{expiredCount}</strong>
          </article>
        </section>

        <section className="applications-container">
          <div className="applications-toolbar license-toolbar">
            <div className="application-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search license number, guide name, email or phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search issued licenses"
              />
            </div>
            <div className="status-filter">
              <label htmlFor="license-status-filter">Status</label>
              <select
                id="license-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                {LICENSE_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="license-register-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={fetchLicenses}>Try Again</button>
            </div>
          )}

          {loading ? (
            <div className="applications-loading">
              <div className="loading-spinner" />
              <p>Loading issued licenses...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="applications-empty">
              <div className="empty-application-icon">▣</div>
              <h3>{licenses.length ? "No matching licenses" : "No issued licenses found"}</h3>
              <p>
                {licenses.length
                  ? "Try another search term or status filter."
                  : "Licenses appear here after guide applications are approved and issued."}
              </p>
            </div>
          ) : (
            <div className="applications-table-wrapper">
              <table className="applications-table issued-license-table">
                <thead>
                  <tr>
                    <th>License Number</th>
                    <th>Guide</th>
                    <th>Contact</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLicenses.map((license) => (
                    <tr key={license._id}>
                      <td><strong>{license.licenseNumber}</strong></td>
                      <td>
                        <div className="applicant-cell">
                          <div className="applicant-avatar">
                            {license.fullName?.charAt(0).toUpperCase() || "G"}
                          </div>
                          <div>
                            <strong>{license.fullName}</strong>
                            <small>Guide license holder</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span>{license.email}</span>
                          <small>{license.phone}</small>
                        </div>
                      </td>
                      <td>{formatDate(license.licenseIssueDate)}</td>
                      <td>{formatDate(license.licenseExpiryDate)}</td>
                      <td>
                        <span className={`license-status-badge ${getClassName(license.licenseStatus)}`}>
                          {license.licenseStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="review-button"
                          type="button"
                          onClick={() => openDetails(license)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selectedLicense && (
          <section className="applications-container license-details-panel">
            <header className="license-details-heading">
              <div>
                <p className="admin-page-label">ISSUED LICENSE DETAILS</p>
                <h2>{selectedLicense.licenseNumber}</h2>
                <p>{selectedLicense.fullName} · {selectedLicense.email}</p>
              </div>
              <button
                type="button"
                className="license-details-close"
                onClick={() => {
                  setSelectedLicense(null);
                  setRenewalHistory([]);
                  setDetailsError("");
                }}
                aria-label="Close license details"
              >
                ×
              </button>
            </header>

            {detailsLoading ? (
              <div className="applications-loading license-details-loading">
                <div className="loading-spinner" />
                <p>Loading license details...</p>
              </div>
            ) : detailsError ? (
              <div className="license-register-error" role="alert">
                {detailsError}
              </div>
            ) : (
              <>
                <dl className="license-details-grid">
                  <div><dt>License holder</dt><dd>{selectedLicense.fullName || "—"}</dd></div>
                  <div><dt>Email</dt><dd>{selectedLicense.email || "—"}</dd></div>
                  <div><dt>Phone</dt><dd>{selectedLicense.phone || "—"}</dd></div>
                  <div><dt>Address</dt><dd>{selectedLicense.address || "—"}</dd></div>
                  <div><dt>Issue date</dt><dd>{formatDate(selectedLicense.licenseIssueDate)}</dd></div>
                  <div><dt>Expiry date</dt><dd>{formatDate(selectedLicense.licenseExpiryDate)}</dd></div>
                  <div>
                    <dt>Current status</dt>
                    <dd>
                      <span className={`license-status-badge ${getClassName(selectedLicense.licenseStatus)}`}>
                        {selectedLicense.licenseStatus}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="license-renewal-history">
                  <h3>Renewal History</h3>
                  {renewalHistory.length === 0 ? (
                    <p>No renewal requests recorded for this license.</p>
                  ) : (
                    <div className="applications-table-wrapper">
                      <table className="applications-table">
                        <thead>
                          <tr>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Previous Expiry</th>
                            <th>Renewed Until</th>
                            <th>Officer Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {renewalHistory.map((renewal) => (
                            <tr key={renewal._id}>
                              <td>{formatDate(renewal.createdAt)}</td>
                              <td>{renewal.renewalStatus}</td>
                              <td>{formatDate(renewal.currentLicenseExpiryDate)}</td>
                              <td>{formatDate(renewal.renewedLicenseExpiryDate)}</td>
                              <td>{renewal.officerRemarks || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminLicenses;
