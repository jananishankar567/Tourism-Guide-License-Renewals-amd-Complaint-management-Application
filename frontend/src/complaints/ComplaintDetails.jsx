import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./ComplaintDetails.css";

const API_URL = `${API_BASE_URL}/api/complaints`;
const FILES_URL = `${API_BASE_URL}/api/files`;

function formatDate(date, includeTime = false) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function getStatusClass(status = "") {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const openEvidence = async (documentPath) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    const fileName = documentPath.split(/[\\/]/).pop();
    const documentWindow = window.open("", "_blank");
    try {
      const response = await fetch(
        `${FILES_URL}/${encodeURIComponent(fileName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error("Unable to open the evidence file.");
      }

      const blobUrl = URL.createObjectURL(await response.blob());
      if (documentWindow) {
        documentWindow.location.href = blobUrl;
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        URL.revokeObjectURL(blobUrl);
        throw new Error("Allow pop-ups to open the evidence file.");
      }
    } catch (documentError) {
      documentWindow?.close();
      console.error("Complaint evidence access error:", documentError);
      setError(documentError.message || "Unable to open the evidence file.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchComplaint = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Your session is missing. Please log in again.");
          return;
        }

        const response = await fetch(
          `${API_URL}/mine/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load complaint details.");
        }

        setComplaint(data.complaint || data);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message || "Unable to load complaint details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchComplaint();

    return () => controller.abort();
  }, [id]);

  return (
    <main className="complaint-details-page">
      <div className="complaint-details-container">
        <button
          type="button"
          className="complaint-details-back"
          onClick={() => navigate("/complaints")}
        >
          ← Back to My Complaints
        </button>

        {loading ? (
          <section className="complaint-details-message" aria-live="polite">
            <div className="complaint-loader" />
            <p>Loading complaint details...</p>
          </section>
        ) : error ? (
          <section className="complaint-details-message complaint-details-error" role="alert">
            <div className="complaint-details-message-icon">!</div>
            <h1>Unable to open this complaint</h1>
            <p>{error}</p>
            <button
              type="button"
              className="complaint-details-button"
              onClick={() => navigate("/complaints")}
            >
              Return to My Complaints
            </button>
            {error.toLowerCase().includes("log in") && (
              <button
                type="button"
                className="complaint-details-link-button"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            )}
          </section>
        ) : complaint ? (
          <>
            <header className="complaint-details-header">
              <div>
                <p className="complaint-details-eyebrow">COMPLAINT TRACKING</p>
                <h1>{complaint.subject || "Complaint details"}</h1>
                <p className="complaint-details-reference">
                  Reference: <strong>{complaint.referenceNumber || "Pending"}</strong>
                </p>
              </div>
              <span
                className={`complaint-details-status status-${getStatusClass(
                  complaint.complaintStatus || "Submitted"
                )}`}
              >
                {complaint.complaintStatus || "Submitted"}
              </span>
            </header>

            <section className="complaint-details-card">
              <div className="complaint-details-card-heading">
                <div>
                  <p className="complaint-details-eyebrow">INCIDENT INFORMATION</p>
                  <h2>Complaint details</h2>
                </div>
                <span
                  className={`complaint-details-priority priority-${(
                    complaint.priority || "Medium"
                  ).toLowerCase()}`}
                >
                  {complaint.priority || "Medium"} priority
                </span>
              </div>

              <dl className="complaint-details-grid">
                <div>
                  <dt>Category</dt>
                  <dd>{complaint.category || "—"}</dd>
                </div>
                <div>
                  <dt>Incident date</dt>
                  <dd>{formatDate(complaint.incidentDate)}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{complaint.incidentLocation || "—"}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDate(complaint.createdAt, true)}</dd>
                </div>
              </dl>

              <div className="complaint-details-description">
                <h3>Description</h3>
                <p>{complaint.description || "No description was provided."}</p>
              </div>
            </section>

            {(complaint.officerRemarks || complaint.resolution) && (
              <section className="complaint-details-card">
                <p className="complaint-details-eyebrow">OFFICER UPDATE</p>
                <h2>Review and resolution</h2>
                {complaint.officerRemarks && (
                  <div className="complaint-details-update">
                    <h3>Officer remarks</h3>
                    <p>{complaint.officerRemarks}</p>
                  </div>
                )}
                {complaint.resolution && (
                  <div className="complaint-details-update">
                    <h3>Resolution</h3>
                    <p>{complaint.resolution}</p>
                  </div>
                )}
              </section>
            )}

            {complaint.evidence?.length > 0 && (
              <section className="complaint-details-card">
                <p className="complaint-details-eyebrow">ATTACHMENTS</p>
                <h2>Supporting evidence</h2>
                <ul className="complaint-details-evidence">
                  {complaint.evidence.map((filePath, index) => {
                    const fileName = filePath.split("/").pop();

                    return (
                      <li key={`${filePath}-${index}`}>
                        <span>{fileName}</span>
                        <a
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            openEvidence(filePath);
                          }}
                        >
                          Open file ↗
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="complaint-details-card">
              <p className="complaint-details-eyebrow">PROGRESS</p>
              <h2>Status history</h2>
              {complaint.history?.length > 0 ? (
                <ol className="complaint-details-timeline">
                  {[...complaint.history]
                    .sort(
                      (first, second) =>
                        new Date(second.updatedAt).getTime() -
                        new Date(first.updatedAt).getTime()
                    )
                    .map((entry, index) => (
                      <li key={`${entry.status}-${entry.updatedAt}-${index}`}>
                        <span className="complaint-details-timeline-dot" />
                        <div>
                          <div className="complaint-details-history-heading">
                            <strong>{entry.status}</strong>
                            <time>{formatDate(entry.updatedAt, true)}</time>
                          </div>
                          {entry.remarks && <p>{entry.remarks}</p>}
                          <small>Updated by {entry.updatedBy || "System"}</small>
                        </div>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="complaint-details-muted">
                  No status updates have been recorded yet.
                </p>
              )}
            </section>
          </>
        ) : (
          <section className="complaint-details-message">
            <h1>Complaint not found</h1>
            <p>This complaint could not be found in your account.</p>
            <button
              type="button"
              className="complaint-details-button"
              onClick={() => navigate("/complaints")}
            >
              Return to My Complaints
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export default ComplaintDetails;