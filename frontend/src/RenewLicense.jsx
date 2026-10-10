import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./api";
import "./RenewLicense.css";

function RenewLicense() {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLicense();
  }, []);

  const fetchLicense = async () => {
    try {
      if (!token) {
        setError("Your session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/applications/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch license information"
        );
      }

      if (data.applicationStatus !== "Approved") {
        setError(
          "You do not have an approved Tourism Guide License eligible for renewal."
        );
        setLoading(false);
        return;
      }

      setApplication(data);
      setLoading(false);
    } catch (error) {
      console.error("Renewal license fetch error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateDaysRemaining = () => {
    if (!application?.licenseExpiryDate) return null;

    const today = new Date();
    const expiry = new Date(application.licenseExpiryDate);

    const difference = expiry - today;

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  if (loading) {
    return (
      <div className="renew-form-page">
        <div className="renew-loading">
          Loading your license information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="renew-form-page">
        <div className="renew-error">
          <div className="error-icon">!</div>

          <h2>License Renewal Unavailable</h2>

          <p>{error}</p>

          <button
            onClick={() => navigate("/renewal")}
            className="back-renewal-btn"
          >
            ← Back to License Renewal
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="renew-form-page">

      {/* Header */}
      <div className="renew-form-header">

        <div>
          <div className="breadcrumb">
            Dashboard / License Renewal / Renew License
          </div>

          <h1>Renew Tourism Guide License</h1>

          <p>
            Review your current license details and submit your
            renewal application.
          </p>
        </div>

        <button
          className="back-renewal-btn"
          onClick={() => navigate("/renewal")}
        >
          ← Back
        </button>

      </div>

      <div className="renew-form-container">

        {/* Current License */}
        <section className="renew-section">

          <div className="section-heading">
            <div className="section-number">01</div>

            <div>
              <h2>Current License Details</h2>
              <p>Your existing approved license</p>
            </div>
          </div>

          <div className="license-details-grid">

            <div className="detail-box">
              <span>License Number</span>
              <strong>
                {application.licenseNumber || "Not available"}
              </strong>
            </div>

            <div className="detail-box">
              <span>License Status</span>

              <strong className="status-active">
                ● {application.applicationStatus}
              </strong>
            </div>

            <div className="detail-box">
              <span>Issue Date</span>
              <strong>
                {formatDate(application.licenseIssueDate)}
              </strong>
            </div>

            <div className="detail-box">
              <span>Expiry Date</span>
              <strong>
                {formatDate(application.licenseExpiryDate)}
              </strong>
            </div>

          </div>

          {daysRemaining !== null && (
            <div
              className={
                daysRemaining <= 30
                  ? "expiry-warning"
                  : "expiry-info"
              }
            >
              <strong>
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "License has expired"}
              </strong>

              <span>
                {daysRemaining > 0
                  ? "Make sure to submit your renewal application before the license expires."
                  : "Submit your renewal request as soon as possible."}
              </span>
            </div>
          )}

        </section>

        {/* Applicant Information */}
        <section className="renew-section">

          <div className="section-heading">
            <div className="section-number">02</div>

            <div>
              <h2>Applicant Information</h2>
              <p>Information associated with your existing license</p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={application.fullName || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={application.email || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                value={application.phone || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <input
                type="text"
                value={application.gender || ""}
                readOnly
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                value={application.address || ""}
                readOnly
              />
            </div>

          </div>

        </section>

        {/* Renewal Declaration */}
        <section className="renew-section">

          <div className="section-heading">
            <div className="section-number">03</div>

            <div>
              <h2>Renewal Declaration</h2>
              <p>Please confirm the following before continuing</p>
            </div>
          </div>

          <div className="declaration-box">

            <div className="declaration-item">
              <span className="check-mark">✓</span>
              <p>
                I confirm that the information provided in my
                existing license application remains accurate.
              </p>
            </div>

            <div className="declaration-item">
              <span className="check-mark">✓</span>
              <p>
                I confirm that I continue to satisfy the eligibility
                requirements for a Tourism Guide License.
              </p>
            </div>

            <div className="declaration-item">
              <span className="check-mark">✓</span>
              <p>
                I agree to provide updated documents if requested
                during the renewal verification process.
              </p>
            </div>

          </div>

          <div className="renewal-next">

            <button
              className="continue-renewal-btn"
              onClick={() => navigate("/renew-license-form")}
            >
              Continue to Renewal Application
              <span>→</span>
            </button>

          </div>

        </section>

      </div>
    </div>
  );
}

export default RenewLicense;