import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./api";
import "./RenewalStatus.css";

function RenewalStatus() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        setLoading(false);
        return;
      }

      // First get the applicant's approved application
      const applicationResponse = await fetch(
        `${API_BASE_URL}/api/applications/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const applicationData =
        await applicationResponse.json();

      if (!applicationResponse.ok) {
        throw new Error(
          applicationData.message ||
            "Unable to fetch application."
        );
      }

      const application =
        applicationData.application ||
        applicationData;

      // Get renewal history
      const renewalResponse = await fetch(
        `${API_BASE_URL}/api/renewals/application/${application._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const renewalData =
        await renewalResponse.json();

      if (!renewalResponse.ok) {
        throw new Error(
          renewalData.message ||
            "Unable to fetch renewal status."
        );
      }

      setRenewals(renewalData);

    } catch (error) {
      console.error(
        "Renewal status error:",
        error
      );

      setError(
        error.message ||
          "Unable to load renewal status."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";

      case "Rejected":
        return "status-rejected";

      case "Returned":
        return "status-returned";

      case "Under Verification":
        return "status-verification";

      default:
        return "status-submitted";
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case "Submitted":
        return "Your renewal application has been submitted and is waiting for officer review.";

      case "Under Verification":
        return "Your renewal application is currently being verified by an authorized officer.";

      case "Approved":
        return "Your license renewal has been approved.";

      case "Rejected":
        return "Your renewal application has been rejected. Please check the officer remarks.";

      case "Returned":
        return "Your application has been returned for correction or additional information.";

      default:
        return "Your renewal request is being processed.";
    }
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

  return (
    <div className="renewal-status-page">

      {/* Header */}

      <div className="renewal-status-header">

        <div>
          <span className="page-label">
            TOURISM GUIDE PORTAL
          </span>

          <h1>Renewal Status</h1>

          <p>
            Track the progress of your tourism guide
            license renewal application.
          </p>
        </div>

        <button
          className="status-back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

      </div>


      {/* Loading */}

      {loading && (
        <div className="status-loading">
          <div className="loading-spinner"></div>

          <p>
            Loading your renewal information...
          </p>
        </div>
      )}


      {/* Error */}

      {!loading && error && (
        <div className="status-error">
          <div className="error-icon">
            !
          </div>

          <div>
            <h3>Unable to load renewal status</h3>

            <p>{error}</p>

            <button
              onClick={fetchRenewals}
            >
              Try Again
            </button>
          </div>
        </div>
      )}


      {/* No renewals */}

      {!loading &&
        !error &&
        renewals.length === 0 && (
          <div className="no-renewal-card">

            <div className="empty-icon">
              ↻
            </div>

            <h2>
              No Renewal Application Found
            </h2>

            <p>
              You have not submitted a license
              renewal application yet.
            </p>

            <button
              onClick={() =>
                navigate("/renewal")
              }
            >
              Start License Renewal →
            </button>

          </div>
        )}


      {/* Renewal List */}

      {!loading &&
        !error &&
        renewals.length > 0 && (
          <div className="renewal-status-content">

            {renewals.map(
              (renewal, index) => (
                <div
                  className="renewal-status-card"
                  key={renewal._id}
                >

                  {/* Card Header */}

                  <div className="status-card-top">

                    <div>
                      <span className="application-label">
                        RENEWAL APPLICATION
                      </span>

                      <h2>
                        {renewal.previousLicenseNumber}
                      </h2>

                      <p>
                        Submitted on{" "}
                        {formatDate(
                          renewal.createdAt
                        )}
                      </p>
                    </div>

                    <span
                      className={`renewal-status-badge ${getStatusClass(
                        renewal.renewalStatus
                      )}`}
                    >
                      {renewal.renewalStatus}
                    </span>

                  </div>


                  {/* Progress */}

                  <div className="renewal-progress">

                    <div
                      className={`progress-step ${
                        [
                          "Submitted",
                          "Under Verification",
                          "Approved"
                        ].includes(
                          renewal.renewalStatus
                        )
                          ? "completed"
                          : ""
                      }`}
                    >
                      <div className="step-circle">
                        ✓
                      </div>

                      <span>
                        Submitted
                      </span>
                    </div>


                    <div
                      className={`progress-line ${
                        [
                          "Under Verification",
                          "Approved"
                        ].includes(
                          renewal.renewalStatus
                        )
                          ? "active"
                          : ""
                      }`}
                    ></div>


                    <div
                      className={`progress-step ${
                        [
                          "Under Verification",
                          "Approved"
                        ].includes(
                          renewal.renewalStatus
                        )
                          ? "completed"
                          : ""
                      }`}
                    >
                      <div className="step-circle">
                        2
                      </div>

                      <span>
                        Verification
                      </span>
                    </div>


                    <div
                      className={`progress-line ${
                        renewal.renewalStatus ===
                        "Approved"
                          ? "active"
                          : ""
                      }`}
                    ></div>


                    <div
                      className={`progress-step ${
                        renewal.renewalStatus ===
                        "Approved"
                          ? "completed"
                          : ""
                      }`}
                    >
                      <div className="step-circle">
                        ✓
                      </div>

                      <span>
                        Decision
                      </span>
                    </div>

                  </div>


                  {/* Description */}

                  <div className="status-description">

                    <strong>
                      Current Status
                    </strong>

                    <p>
                      {getStatusDescription(
                        renewal.renewalStatus
                      )}
                    </p>

                  </div>


                  {/* Details */}

                  <div className="renewal-details">

                    <div className="detail-item">

                      <span>
                        Previous License
                      </span>

                      <strong>
                        {
                          renewal.previousLicenseNumber
                        }
                      </strong>

                    </div>


                    <div className="detail-item">

                      <span>
                        Current Expiry
                      </span>

                      <strong>
                        {formatDate(
                          renewal.currentLicenseExpiryDate
                        )}
                      </strong>

                    </div>


                    <div className="detail-item">

                      <span>
                        Renewal Reason
                      </span>

                      <strong>
                        {renewal.renewalReason}
                      </strong>

                    </div>


                    <div className="detail-item">

                      <span>
                        New Expiry
                      </span>

                      <strong>
                        {renewal.renewedLicenseExpiryDate
                          ? formatDate(
                              renewal.renewedLicenseExpiryDate
                            )
                          : "Pending"}
                      </strong>

                    </div>

                  </div>


                  {/* Officer Remarks */}

                  {renewal.officerRemarks && (
                    <div className="officer-remarks">

                      <div className="remarks-title">
                        Officer Remarks
                      </div>

                      <p>
                        {renewal.officerRemarks}
                      </p>

                    </div>
                  )}

                  {renewal.history?.length > 0 && (
                    <div className="renewal-status-history">
                      <h3>Status history</h3>
                      <ol>
                        {[...renewal.history]
                          .reverse()
                          .map((entry, historyIndex) => (
                            <li key={`${entry.status}-${entry.updatedAt}-${historyIndex}`}>
                              <strong>{entry.status}</strong>
                              <time>{formatDate(entry.updatedAt)}</time>
                              {entry.remarks && <p>{entry.remarks}</p>}
                              <small>Updated by {entry.updatedBy || "System"}</small>
                            </li>
                          ))}
                      </ol>
                    </div>
                  )}


                  {/* Returned / Rejected */}

                  {(renewal.renewalStatus ===
                    "Returned" ||
                    renewal.renewalStatus ===
                      "Rejected") && (
                    <div className="action-notice">

                      <span>!</span>

                      <p>
                        Please review the officer
                        remarks and follow the required
                        instructions before submitting
                        another request.
                      </p>

                    </div>
                  )}

                </div>
              )
            )}

          </div>
        )}


      {/* Bottom action */}

      {!loading &&
        !error &&
        renewals.length > 0 && (
          <div className="status-bottom-actions">

            <button
              onClick={() =>
                navigate("/renewal")
              }
            >
              ← License Renewal
            </button>

            <button
              onClick={fetchRenewals}
            >
              ↻ Refresh Status
            </button>

          </div>
        )}

    </div>
  );
}

export default RenewalStatus;