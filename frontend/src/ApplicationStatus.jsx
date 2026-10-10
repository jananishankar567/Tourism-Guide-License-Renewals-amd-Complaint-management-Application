import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";
import { useNavigate } from "react-router-dom";
import "./ApplicationStatus.css";

function ApplicationStatus() {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch application
  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/applications/mine`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to fetch application details."
        );
        return;
      }

      setApplication(data);

    } catch (error) {
      console.error(
        "Application fetch error:",
        error
      );

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  // Format date
  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Status class
  const getStatusClass = (status) => {
    switch (status) {
      case "Submitted":
        return "status-submitted";

      case "Under Verification":
        return "status-verification";

      case "Approved":
        return "status-approved";

      case "Rejected":
        return "status-rejected";

      case "Returned":
        return "status-returned";

      default:
        return "";
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="application-status-page">

        <div className="application-loading">

          <div className="loading-spinner"></div>

          <p>
            Loading your application...
          </p>

        </div>

      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="application-status-page">

        <header className="application-header">

          <div className="application-brand">

            <div className="application-brand-icon">
              TG
            </div>

            <div>
              <h1>
                Tourism Guide Portal
              </h1>

              <span>
                License Management System
              </span>
            </div>

          </div>

          <button
            className="back-dashboard-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

        </header>

        <main className="application-main">

          <div className="application-error">

            <div className="error-icon">
              !
            </div>

            <h2>
              Application Not Found
            </h2>

            <p>
              {error}
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="error-dashboard-button"
            >
              Back to Dashboard
            </button>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="application-status-page">

      {/* Header */}
      <header className="application-header">

        <div className="application-brand">

          <div className="application-brand-icon">
            TG
          </div>

          <div>

            <h1>
              Tourism Guide Portal
            </h1>

            <span>
              License Management System
            </span>

          </div>

        </div>

        <button
          className="back-dashboard-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </header>


      {/* Main */}
      <main className="application-main">

        {/* Page Heading */}
        <div className="page-heading">

          <div>

            <p className="page-label">
              APPLICANT SERVICES
            </p>

            <h2>
              My Application
            </h2>

            <p>
              View your submitted Tourism Guide License
              application and its current processing status.
            </p>

          </div>

        </div>


        {/* Status Card */}
        <section className="status-card">

          <div className="status-card-left">

            <div className="application-icon">
              📄
            </div>

            <div>

              <span className="small-label">
                APPLICATION STATUS
              </span>

              <h3>
                {application.applicationStatus}
              </h3>

              <p>
                Application ID:{" "}
                <strong>
                  {application._id}
                </strong>
              </p>

            </div>

          </div>


          <div
            className={`application-status-badge ${getStatusClass(
              application.applicationStatus
            )}`}
          >
            {application.applicationStatus}
          </div>

        </section>


        {/* Progress */}
        <section className="progress-card">

          <div className="section-title">

            <div>
              <h3>
                Application Progress
              </h3>

              <p>
                Track the current stage of your application.
              </p>
            </div>

          </div>


          <div className="progress-container">

            <div className="progress-step completed">

              <div className="progress-circle">
                ✓
              </div>

              <div>
                <h4>
                  Application Submitted
                </h4>

                <span>
                  {formatDate(application.createdAt)}
                </span>
              </div>

            </div>


            <div
              className={`progress-line ${
                application.applicationStatus !==
                  "Submitted"
                  ? "active"
                  : ""
              }`}
            ></div>


            <div
              className={`progress-step ${
                application.applicationStatus !==
                  "Submitted"
                  ? "completed"
                  : "current"
              }`}
            >

              <div className="progress-circle">
                {application.applicationStatus !==
                "Submitted"
                  ? "✓"
                  : "2"}
              </div>

              <div>
                <h4>
                  Officer Verification
                </h4>

                <span>
                  {application.applicationStatus ===
                  "Submitted"
                    ? "Pending"
                    : "Application under verification"}
                </span>
              </div>

            </div>


            <div
              className={`progress-line ${
                ["Approved", "Rejected", "Returned"].includes(
                  application.applicationStatus
                )
                  ? "active"
                  : ""
              }`}
            ></div>


            <div
              className={`progress-step ${
                ["Approved", "Rejected", "Returned"].includes(
                  application.applicationStatus
                )
                  ? "completed"
                  : "current"
              }`}
            >

              <div className="progress-circle">
                {["Approved", "Rejected", "Returned"].includes(
                  application.applicationStatus
                )
                  ? "✓"
                  : "3"}
              </div>

              <div>
                <h4>
                  Final Decision
                </h4>

                <span>
                  {["Approved", "Rejected", "Returned"].includes(
                    application.applicationStatus
                  )
                    ? application.applicationStatus
                    : "Pending"}
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* Personal Information */}
        <section className="details-card">

          <div className="section-title">

            <div>
              <h3>
                Applicant Information
              </h3>

              <p>
                Personal information submitted with your application.
              </p>
            </div>

          </div>


          <div className="details-grid">

            <div className="detail-item">

              <span>
                Full Name
              </span>

              <strong>
                {application.fullName}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Date of Birth
              </span>

              <strong>
                {formatDate(application.dateOfBirth)}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Gender
              </span>

              <strong>
                {application.gender}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Email Address
              </span>

              <strong>
                {application.email}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Mobile Number
              </span>

              <strong>
                {application.phone}
              </strong>

            </div>


            <div className="detail-item full-width">

              <span>
                Address
              </span>

              <strong>
                {application.address}
              </strong>

            </div>

          </div>

        </section>


        {/* Qualification Details */}
        <section className="details-card">

          <div className="section-title">

            <div>
              <h3>
                Qualification & Eligibility
              </h3>

              <p>
                Educational and tourism-related information.
              </p>
            </div>

          </div>


          <div className="details-grid">

            <div className="detail-item">

              <span>
                Educational Qualification
              </span>

              <strong>
                {application.educationalQualification}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Tourism Training
              </span>

              <strong>
                {application.tourismTraining}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Languages Known
              </span>

              <strong>
                {application.languagesKnown}
              </strong>

            </div>


            <div className="detail-item">

              <span>
                Identity Proof
              </span>

              <strong>
                {application.identityProof}
              </strong>

            </div>

          </div>

        </section>


        {/* Documents */}
        <section className="details-card">

          <div className="section-title">

            <div>
              <h3>
                Submitted Documents
              </h3>

              <p>
                Documents uploaded during application submission.
              </p>
            </div>

          </div>


          <div className="document-grid">

            <div className="document-item">

              <div className="document-icon">
                PDF
              </div>

              <div>
                <strong>
                  Government ID
                </strong>

                <span>
                  Submitted
                </span>
              </div>

              <span className="document-check">
                ✓
              </span>

            </div>


            <div className="document-item">

              <div className="document-icon">
                PDF
              </div>

              <div>
                <strong>
                  Educational Certificate
                </strong>

                <span>
                  Submitted
                </span>
              </div>

              <span className="document-check">
                ✓
              </span>

            </div>


            <div className="document-item">

              <div className="document-icon">
                PDF
              </div>

              <div>
                <strong>
                  Training Certificate
                </strong>

                <span>
                  Submitted
                </span>
              </div>

              <span className="document-check">
                ✓
              </span>

            </div>


            <div className="document-item">

              <div className="document-icon">
                PDF
              </div>

              <div>
                <strong>
                  Police Certificate
                </strong>

                <span>
                  Submitted
                </span>
              </div>

              <span className="document-check">
                ✓
              </span>

            </div>


            <div className="document-item">

              <div className="document-icon">
                PDF
              </div>

              <div>
                <strong>
                  Medical Certificate
                </strong>

                <span>
                  Submitted
                </span>
              </div>

              <span className="document-check">
                ✓
              </span>

            </div>


            <div className="document-item">

              <div className="document-icon">
                IMG
              </div>

              <div>
                <strong>
                  Passport Photo
                </strong>

                <span>
                  Submitted
                </span>
              </div>

              <span className="document-check">
                ✓
              </span>

            </div>

          </div>

        </section>


        {/* Officer Remarks */}
        {application.officerRemarks && (
          <section className="remarks-card">

            <div className="remarks-heading">

              <div className="remarks-icon">
                !
              </div>

              <div>

                <h3>
                  Officer Remarks
                </h3>

                <p>
                  Remarks provided during application review.
                </p>

              </div>

            </div>


            <div className="remarks-content">
              {application.officerRemarks}
            </div>

          </section>
        )}

        {application.history?.length > 0 && (
          <section className="application-history-card">
            <h3>Application History</h3>
            <div className="application-history-list">
              {[...application.history].reverse().map((entry, index) => (
                <article
                  className="application-history-entry"
                  key={`${entry.action}-${entry.updatedAt}-${index}`}
                >
                  <div>
                    <strong>{entry.action}</strong>
                    <span>{entry.status} · {entry.updatedBy}</span>
                  </div>
                  <time dateTime={entry.updatedAt}>
                    {entry.updatedAt
                      ? new Date(entry.updatedAt).toLocaleString("en-IN")
                      : "Date unavailable"}
                  </time>
                  {entry.remarks && <p>{entry.remarks}</p>}
                  {entry.verification &&
                    Object.values(entry.verification).some((value) => value !== undefined) && (
                      <p>
                        Verification:{" "}
                        {Object.entries(entry.verification)
                          .filter(([, value]) => value !== undefined)
                          .map(([field, value]) => {
                            const label = field
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (character) => character.toUpperCase());
                            const result =
                              typeof value === "boolean"
                                ? value
                                  ? "Verified"
                                  : "Not verified"
                                : value;
                            return `${label}: ${result}`;
                          })
                          .join(" · ")}
                      </p>
                    )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* License Details */}
        {application.applicationStatus === "Approved" &&
          application.licenseNumber && (
            <section className="license-card">

              <div className="license-header">

                <div>

                  <span>
                    LICENSE ISSUED
                  </span>

                  <h3>
                    Tourism Guide License
                  </h3>

                </div>

                <div className="license-badge">
                  APPROVED
                </div>

              </div>


              <div className="license-details">

                <div>
                  <span>
                    License Number
                  </span>

                  <strong>
                    {application.licenseNumber}
                  </strong>
                </div>


                <div>
                  <span>
                    Issue Date
                  </span>

                  <strong>
                    {formatDate(
                      application.licenseIssueDate
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Expiry Date
                  </span>

                  <strong>
                    {formatDate(
                      application.licenseExpiryDate
                    )}
                  </strong>
                </div>

              </div>


              <button
                className="view-license-button"
                onClick={() => navigate("/license")}
              >
                View License
              </button>

            </section>
          )}


        {/* Footer Action */}
        <div className="application-actions">

          <button
            className="action-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>

          {["Returned", "Rejected"].includes(application.applicationStatus) && (
            <button
              className="action-primary"
              onClick={() => navigate("/application?resubmit=1")}
            >
              Correct & Resubmit Application
            </button>
          )}

          <button
            className="action-primary"
            onClick={fetchApplication}
          >
            Refresh Status
          </button>

        </div>

      </main>

    </div>
  );
}

export default ApplicationStatus;