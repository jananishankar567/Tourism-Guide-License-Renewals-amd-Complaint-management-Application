import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL as API_URL } from "./api";
import "./Renewal.css";

const ACTIVE_STATUSES = ["Submitted", "Under Verification"];

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Renewal() {
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [renewals, setRenewals] = useState([]);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRenewalOverview = useCallback(async () => {
    const token = localStorage.getItem("token");

    setLoading(true);
    setError("");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const [applicationResponse, renewalsResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/applications/mine`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(`${API_URL}/api/renewals/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const applicationData = await applicationResponse.json();
      const renewalsData = await renewalsResponse.json();

      if (!applicationResponse.ok) {
        throw new Error(
          applicationData.message || "Unable to load your license."
        );
      }

      if (!renewalsResponse.ok) {
        throw new Error(
          renewalsData.message || "Unable to load your renewal requests."
        );
      }

      const application = applicationData.application || applicationData;
      setApplication(application);
      setRenewals(Array.isArray(renewalsData) ? renewalsData : []);
      if (application.licenseExpiryDate) {
        setDaysRemaining(
          Math.ceil(
            (new Date(application.licenseExpiryDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        );
      } else {
        setDaysRemaining(null);
      }
    } catch (fetchError) {
      console.error("Renewal overview error:", fetchError);
      setError(fetchError.message || "Unable to load renewal information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRenewalOverview();
  }, [fetchRenewalOverview]);

  const latestRenewal = renewals[0];
  const activeRenewal = renewals.find((renewal) =>
    ACTIVE_STATUSES.includes(renewal.renewalStatus)
  );
  return (
    <div className="renewal-page">
      <header className="renewal-header">
        <div>
          <p className="renewal-page-label">APPLICANT PORTAL</p>
          <h1>License Renewal</h1>
          <p>
            View your current license and manage the renewal request linked to
            your guide application.
          </p>
        </div>

        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </header>

      {loading ? (
        <div className="renewal-state-card" aria-live="polite">
          Loading your license and renewal information...
        </div>
      ) : error ? (
        <div className="renewal-state-card renewal-state-error" role="alert">
          <h2>Unable to load renewal information</h2>
          <p>{error}</p>
          <div className="renewal-state-actions">
            {error.toLowerCase().includes("log in") && (
              <button
                type="button"
                className="start-renewal-btn"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            )}
            <button
              type="button"
              className="back-btn"
              onClick={fetchRenewalOverview}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : application?.applicationStatus !== "Approved" ? (
        <div className="renewal-state-card">
          <h2>An approved guide license is required</h2>
          <p>
            Renewal services will be available after your guide application is
            approved and a license has been issued.
          </p>
          <button
            type="button"
            className="start-renewal-btn"
            onClick={() => navigate("/application-status")}
          >
            View My Application
          </button>
        </div>
      ) : (
        <div className="renewal-container">
          <section className="renewal-card">
            <div className="card-title">
              <div className="title-icon" aria-hidden="true">▣</div>
              <div>
                <h2>Current License</h2>
                <p>Your license information from the approved application</p>
              </div>
            </div>

            <div className="license-summary">
              <div className="license-item">
                <span>License Number</span>
                <strong>{application.licenseNumber || "Not available"}</strong>
              </div>
              <div className="license-item">
                <span>Issue Date</span>
                <strong>{formatDate(application.licenseIssueDate)}</strong>
              </div>
              <div className="license-item">
                <span>Expiry Date</span>
                <strong>{formatDate(application.licenseExpiryDate)}</strong>
              </div>
              <div className="license-item">
                <span>License Status</span>
                <strong className="active-status">
                  {application.applicationStatus}
                </strong>
              </div>
            </div>

            {daysRemaining !== null && (
              <div
                className={
                  daysRemaining <= 30 ? "expiry-warning" : "expiry-info"
                }
              >
                <strong>
                  {daysRemaining >= 0
                    ? `${daysRemaining} days until license expiry`
                    : `License expired ${Math.abs(daysRemaining)} days ago`}
                </strong>
                <span>
                  {daysRemaining <= 30
                    ? "Check renewal eligibility and submit your request with the required documents."
                    : "You can review your renewal status or prepare a renewal request."}
                </span>
              </div>
            )}
          </section>

          {latestRenewal && (
            <section className="renewal-card renewal-latest-card">
              <div className="card-title">
                <div className="title-icon" aria-hidden="true">↻</div>
                <div>
                  <h2>Latest Renewal Request</h2>
                  <p>
                    {latestRenewal.previousLicenseNumber} · submitted{" "}
                    {formatDate(latestRenewal.createdAt)}
                  </p>
                </div>
                <span
                  className={`renewal-overview-status status-${(
                    latestRenewal.renewalStatus || "submitted"
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {latestRenewal.renewalStatus}
                </span>
              </div>
              <p className="renewal-latest-reason">
                <strong>Reason:</strong> {latestRenewal.renewalReason || "—"}
              </p>
              {latestRenewal.officerRemarks && (
                <div className="renewal-officer-remarks">
                  <strong>Officer remarks</strong>
                  <p>{latestRenewal.officerRemarks}</p>
                </div>
              )}
            </section>
          )}

          <section className="renewal-card">
            <div className="card-title">
              <div className="title-icon" aria-hidden="true">↻</div>
              <div>
                <h2>{activeRenewal ? "Renewal in progress" : "Renew your license"}</h2>
                <p>
                  {activeRenewal
                    ? "A request is already being reviewed. Follow its status here."
                    : "Submit a renewal request with the required supporting documents."}
                </p>
              </div>
            </div>

            <div className="renewal-notice">
              <strong>Before you continue</strong>
              <ul>
                <li>Provide accurate updated information.</li>
                <li>
                  Government ID, police certificate, medical certificate, and
                  passport photo are required.
                </li>
                <li>Each upload must be 5 MB or smaller.</li>
                <li>
                  A returned or rejected request can be followed by a corrected
                  renewal request.
                </li>
              </ul>
            </div>

            <div className="renewal-actions">
              {activeRenewal ? (
                <button
                  type="button"
                  className="start-renewal-btn"
                  onClick={() => navigate("/renewal-status")}
                >
                  Track Existing Request <span>→</span>
                </button>
              ) : (
                <>
                  {renewals.length > 0 && (
                    <button
                      type="button"
                      className="back-btn"
                      onClick={() => navigate("/renewal-status")}
                    >
                      View Renewal History
                    </button>
                  )}
                  <button
                    type="button"
                    className="start-renewal-btn"
                    onClick={() => navigate("/renew-license")}
                  >
                    Start License Renewal <span>→</span>
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Renewal;
