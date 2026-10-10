
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import "./SubmitComplaint.css";


const API_URL = `${API_BASE_URL}/api/complaints`;
const categories = [
  "Tourist Misconduct",
  "Harassment or Safety",
  "Overcharging",
  "False Information",
  "Tourist Site Facilities",
  "Damage to Tourist Property",
  "Service Issue",
  "Threat or Intimidation",
  "Other",
];

const today = new Date().toLocaleDateString("en-CA");

function SubmitComplaint() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: "",
    subject: "",
    description: "",
    incidentDate: "",
    incidentLocation: "",
    complainantPhone: "",
  });

  const [evidence, setEvidence] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setServerError("");
  };

  const handleEvidenceChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (selectedFiles.length > 5) {
      setErrors((previous) => ({
        ...previous,
        evidence: "You can upload a maximum of 5 files.",
      }));
      setEvidence([]);
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !allowedTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFile) {
      setErrors((previous) => ({
        ...previous,
        evidence:
          "Each file must be a PDF, JPG, or PNG and no larger than 5 MB.",
      }));
      setEvidence([]);
      event.target.value = "";
      return;
    }

    setEvidence(selectedFiles);
    setErrors((previous) => ({
      ...previous,
      evidence: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.category) {
      newErrors.category = "Please select a complaint category.";
    }

    if (!form.subject.trim()) {
      newErrors.subject = "Please enter a complaint subject.";
    } else if (form.subject.trim().length > 150) {
      newErrors.subject = "Subject cannot exceed 150 characters.";
    }

    if (!form.description.trim()) {
      newErrors.description = "Please describe the incident.";
    } else if (form.description.trim().length < 20) {
      newErrors.description =
        "Please provide at least 20 characters of detail.";
    } else if (form.description.trim().length > 5000) {
      newErrors.description =
        "Description cannot exceed 5000 characters.";
    }

    if (!form.incidentDate) {
      newErrors.incidentDate = "Please select the incident date.";
    } else if (form.incidentDate > today) {
      newErrors.incidentDate =
        "The incident date cannot be in the future.";
    }

    if (!form.incidentLocation.trim()) {
      newErrors.incidentLocation = "Please enter the incident location.";
    } else if (form.incidentLocation.trim().length > 250) {
      newErrors.incidentLocation =
        "Location cannot exceed 250 characters.";
    }

    const phone = form.complainantPhone.trim();

    if (!phone) {
      newErrors.complainantPhone = "Please enter your contact number.";
    } else if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
      newErrors.complainantPhone =
        "Please enter a valid contact number.";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setServerError("Please correct the highlighted fields before submitting.");
      const firstInvalidField = Object.keys(validationErrors)[0];
      const field = document.getElementsByName(firstInvalidField)[0];

      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.focus({ preventScroll: true });
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setServerError("Your session has expired. Please log in again.");
      return;
    }

    const payload = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, value.trim());
    });

    evidence.forEach((file) => {
      payload.append("evidence", file);
    });

    try {
      setSubmitting(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = [data.message, data.error]
          .filter((detail) => typeof detail === "string" && detail.trim())
          .join(" ");

        throw new Error(
          errorDetails ||
            `Unable to submit your complaint (HTTP ${response.status}).`
        );
      }

      setSuccess(data.complaint || data);
    } catch (error) {
      setServerError(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="submit-complaint-page">
        <section className="complaint-success-card">
          <div className="complaint-success-icon">✓</div>

          <p className="submit-complaint-eyebrow">
            COMPLAINT SUBMISSION
          </p>

          <h1>Complaint submitted successfully!</h1>

          <p className="complaint-success-description">
            Your complaint has been recorded. Keep the reference number
            below to track its progress.
          </p>

          <div className="complaint-reference-box">
            <span>TRACKING REFERENCE</span>
            <strong>
              {success.referenceNumber || "Reference generated"}
            </strong>
          </div>

          <div className="complaint-success-actions">
            <button
              type="button"
              className="submit-complaint-primary"
              onClick={() => navigate("/complaints")}
            >
              View My Complaints →
            </button>

            <button
              type="button"
              className="submit-complaint-secondary"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="submit-complaint-page">
      <div className="submit-complaint-top">
        <button
          type="button"
          className="complaint-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <p className="submit-complaint-eyebrow">
          TOURISM GUIDE PORTAL
        </p>

        <h1>Submit a Complaint</h1>

        <p className="submit-complaint-intro">
          Report an incident involving tourists or tourist places.
          Provide accurate details so the licensing officer can review
          your complaint.
        </p>
      </div>

      <div className="submit-complaint-layout">
        <form className="submit-complaint-form" onSubmit={handleSubmit}>
          <div className="complaint-form-heading">
            <div>
              <span className="complaint-section-number">01</span>
              <h2>Incident Information</h2>
            </div>
            <p>Fields marked * are required.</p>
          </div>

          {serverError && (
            <div className="complaint-form-alert" role="alert">
              <strong>Unable to submit</strong>
              <p>{serverError}</p>

              {serverError.toLowerCase().includes("log in") && (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </button>
              )}
            </div>
          )}

          <div className="complaint-form-field">
            <label htmlFor="category">
              Complaint Category <span>*</span>
            </label>

            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={errors.category ? "field-invalid" : ""}
            >
              <option value="">Select a complaint category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {errors.category && (
              <small className="complaint-field-error">
                {errors.category}
              </small>
            )}
          </div>

          <div className="complaint-form-field">
            <label htmlFor="subject">
              Complaint Subject <span>*</span>
            </label>

            <input
              id="subject"
              name="subject"
              type="text"
              maxLength={150}
              value={form.subject}
              onChange={handleChange}
              placeholder="Briefly describe the issue"
              className={errors.subject ? "field-invalid" : ""}
            />

            <div className="complaint-field-footer">
              {errors.subject ? (
                <small className="complaint-field-error">
                  {errors.subject}
                </small>
              ) : (
                <small>Provide a clear, specific subject.</small>
              )}
              <small>{form.subject.length}/150</small>
            </div>
          </div>

          <div className="complaint-form-field">
            <label htmlFor="description">
              Incident Description <span>*</span>
            </label>

            <textarea
              id="description"
              name="description"
              rows={6}
              maxLength={5000}
              value={form.description}
              onChange={handleChange}
              placeholder="Explain what happened, who was involved, and any relevant details..."
              className={errors.description ? "field-invalid" : ""}
            />

            <div className="complaint-field-footer">
              {errors.description ? (
                <small className="complaint-field-error">
                  {errors.description}
                </small>
              ) : (
                <small>Enter at least 20 characters.</small>
              )}
              <small>{form.description.length}/5000</small>
            </div>
          </div>

          <div className="complaint-form-two-columns">
            <div className="complaint-form-field">
              <label htmlFor="incidentDate">
                Incident Date <span>*</span>
              </label>

              <input
                id="incidentDate"
                name="incidentDate"
                type="date"
                max={today}
                value={form.incidentDate}
                onChange={handleChange}
                className={
                  errors.incidentDate ? "field-invalid" : ""
                }
              />

              {errors.incidentDate && (
                <small className="complaint-field-error">
                  {errors.incidentDate}
                </small>
              )}
            </div>

            <div className="complaint-form-field">
              <label htmlFor="complainantPhone">
                Contact Number <span>*</span>
              </label>

              <input
                id="complainantPhone"
                name="complainantPhone"
                type="tel"
                maxLength={20}
                value={form.complainantPhone}
                onChange={handleChange}
                placeholder="Your contact number"
                className={
                  errors.complainantPhone ? "field-invalid" : ""
                }
              />

              {errors.complainantPhone && (
                <small className="complaint-field-error">
                  {errors.complainantPhone}
                </small>
              )}
            </div>
          </div>

          <div className="complaint-form-field">
            <label htmlFor="incidentLocation">
              Incident Location <span>*</span>
            </label>

            <input
              id="incidentLocation"
              name="incidentLocation"
              type="text"
              maxLength={250}
              value={form.incidentLocation}
              onChange={handleChange}
              placeholder="Enter tourist site, landmark, city, or address"
              className={
                errors.incidentLocation ? "field-invalid" : ""
              }
            />

            {errors.incidentLocation && (
              <small className="complaint-field-error">
                {errors.incidentLocation}
              </small>
            )}
          </div>

          <div className="complaint-form-heading complaint-evidence-heading">
            <div>
              <span className="complaint-section-number">02</span>
              <h2>Supporting Evidence</h2>
            </div>
            <p>Optional</p>
          </div>

          <div className="complaint-upload-area">
            <label
              htmlFor="evidence"
              className="complaint-upload-label"
            >
              <span className="complaint-upload-icon">↑</span>
              <strong>Choose supporting files</strong>
              <span>
                PDF, JPG or PNG · Maximum 5 files · 5 MB per file
              </span>
            </label>

            <input
              id="evidence"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              onChange={handleEvidenceChange}
            />

            {errors.evidence && (
              <small className="complaint-field-error">
                {errors.evidence}
              </small>
            )}

            {evidence.length > 0 && (
              <ul className="complaint-file-list">
                {evidence.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <span>▧ {file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setEvidence((previous) =>
                          previous.filter((_, i) => i !== index)
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="complaint-form-actions">
            <button
              type="button"
              className="submit-complaint-secondary"
              onClick={() => navigate("/complaints")}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-complaint-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Complaint →"}
            </button>
          </div>
        </form>

        <aside className="complaint-form-sidebar">
          <div className="complaint-guidance-card">
            <div className="complaint-guidance-icon">ⓘ</div>
            <h3>Before you submit</h3>

            <ul>
              <li>Provide accurate incident details.</li>
              <li>Include the correct date and location.</li>
              <li>Attach relevant evidence if available.</li>
              <li>Use a contact number where you can be reached.</li>
            </ul>
          </div>

          <div className="complaint-guidance-card complaint-process-card">
            <h3>What happens next?</h3>

            <div className="complaint-process-step">
              <span>1</span>
              <div>
                <strong>Submission</strong>
                <p>Your complaint receives a tracking reference.</p>
              </div>
            </div>

            <div className="complaint-process-step">
              <span>2</span>
              <div>
                <strong>Officer Review</strong>
                <p>The officer reviews the details and evidence.</p>
              </div>
            </div>

            <div className="complaint-process-step">
              <span>3</span>
              <div>
                <strong>Status Update</strong>
                <p>Check progress and officer remarks in the portal.</p>
              </div>
            </div>
          </div>

          <p className="complaint-privacy-note">
            Your complaint is linked to your approved guide application.
            Do not include passwords or other sensitive account details.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default SubmitComplaint;