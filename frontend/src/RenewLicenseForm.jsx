import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./api";
import "./RenewLicenseForm.css";

function RenewLicenseForm() {
  const navigate = useNavigate();

  const applicant = JSON.parse(
    localStorage.getItem("applicant") || "null"
  );

  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    renewalReason: "",
    updatedPhone: applicant?.mobile || "",
    updatedAddress: "",
    updatedLanguagesKnown: "",
    additionalRemarks: ""
  });

  const [documents, setDocuments] = useState({
    governmentId: null,
    policeCertificate: null,
    medicalCertificate: null,
    trainingCertificate: null,
    passportPhoto: null
  });

  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    setDocuments((prev) => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!applicant || !token) {
      setError(
        "Your session has expired. Please login again."
      );
      return;
    }

    if (!declaration) {
      setError(
        "Please accept the declaration before submitting."
      );
      return;
    }

    if (
      !documents.governmentId ||
      !documents.policeCertificate ||
      !documents.medicalCertificate ||
      !documents.passportPhoto
    ) {
      setError(
        "Please upload all required documents."
      );
      return;
    }

    try {
      setSubmitting(true);

      // Get the applicant's approved license
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
            "Unable to fetch license details."
        );
      }

      const application =
        applicationData.application ||
        applicationData;

      if (
        application.applicationStatus !==
        "Approved"
      ) {
        throw new Error(
          "Only an approved license can be renewed."
        );
      }

      if (!application.licenseNumber) {
        throw new Error(
          "No valid license number was found."
        );
      }

      // Prepare multipart form data
      const data = new FormData();

      data.append(
        "applicationId",
        application._id
      );

      data.append(
        "previousLicenseNumber",
        application.licenseNumber
      );

      data.append(
        "currentLicenseExpiryDate",
        application.licenseExpiryDate
      );

      data.append(
        "renewalReason",
        formData.renewalReason
      );

      data.append(
        "updatedPhone",
        formData.updatedPhone
      );

      data.append(
        "updatedAddress",
        formData.updatedAddress
      );

      data.append(
        "updatedLanguagesKnown",
        formData.updatedLanguagesKnown
      );

      data.append(
        "additionalRemarks",
        formData.additionalRemarks
      );

      // Documents
      data.append(
        "governmentId",
        documents.governmentId
      );

      data.append(
        "policeCertificate",
        documents.policeCertificate
      );

      data.append(
        "medicalCertificate",
        documents.medicalCertificate
      );

      if (documents.trainingCertificate) {
        data.append(
          "trainingCertificate",
          documents.trainingCertificate
        );
      }

      data.append(
        "passportPhoto",
        documents.passportPhoto
      );

      // Submit renewal
      const response = await fetch(
        `${API_BASE_URL}/api/renewals`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: data
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to submit renewal."
        );
      }

      setSuccess(
        "Your license renewal application has been submitted successfully."
      );

      // Go to renewal status after short delay
      setTimeout(() => {
        navigate("/renewal-status");
      }, 1200);

    } catch (error) {
      console.error(
        "Renewal submission error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong while submitting the renewal."
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="renew-form-page">

      <div className="renew-form-header">
        <div>
          <h1>License Renewal Application</h1>

          <p>
            Submit the required information and
            documents to renew your tourism guide license.
          </p>
        </div>

        <button
          className="back-btn"
          onClick={() =>
            navigate("/renew-license")
          }
        >
          ← Back
        </button>
      </div>

      <form
        className="renewal-form-card"
        onSubmit={handleSubmit}
      >

        {/* Renewal Information */}

        <div className="form-section">

          <div className="section-heading">
            <span>01</span>

            <div>
              <h2>Renewal Information</h2>
              <p>
                Provide the reason for renewing your
                tourism guide license.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">

              <label>
                Renewal Reason
                <span>*</span>
              </label>

              <select
                name="renewalReason"
                value={formData.renewalReason}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select renewal reason
                </option>

                <option value="License Expiry">
                  License Expiry
                </option>

                <option value="Upcoming Expiry">
                  Upcoming Expiry
                </option>

                <option value="License Information Update">
                  License Information Update
                </option>
              </select>

            </div>

          </div>

        </div>


        {/* Updated Details */}

        <div className="form-section">

          <div className="section-heading">
            <span>02</span>

            <div>
              <h2>Updated Details</h2>

              <p>
                Update your contact or personal
                information if required.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-group">

              <label>
                Mobile Number
              </label>

              <input
                type="text"
                name="updatedPhone"
                value={formData.updatedPhone}
                onChange={handleChange}
                placeholder="Enter mobile number"
              />

            </div>


            <div className="form-group full-width">

              <label>
                Updated Address
              </label>

              <textarea
                name="updatedAddress"
                value={formData.updatedAddress}
                onChange={handleChange}
                placeholder="Enter updated address if changed"
                rows="3"
              />

            </div>


            <div className="form-group">

              <label>
                Languages Known
              </label>

              <input
                type="text"
                name="updatedLanguagesKnown"
                value={
                  formData.updatedLanguagesKnown
                }
                onChange={handleChange}
                placeholder="Example: English, Tamil, Hindi"
              />

            </div>


            <div className="form-group full-width">

              <label>
                Additional Remarks
              </label>

              <textarea
                name="additionalRemarks"
                value={
                  formData.additionalRemarks
                }
                onChange={handleChange}
                placeholder="Enter any additional information"
                rows="3"
              />

            </div>

          </div>

        </div>


        {/* Documents */}

        <div className="form-section">

          <div className="section-heading">

            <span>03</span>

            <div>
              <h2>Required Documents</h2>

              <p>
                Upload clear and valid documents.
                Maximum file size: 5 MB.
              </p>
            </div>

          </div>


          <div className="document-grid">

            <div className="document-upload">

              <label>
                Government ID
                <span>*</span>
              </label>

              <input
                type="file"
                name="governmentId"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />

            </div>


            <div className="document-upload">

              <label>
                Police Verification Certificate
                <span>*</span>
              </label>

              <input
                type="file"
                name="policeCertificate"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />

            </div>


            <div className="document-upload">

              <label>
                Medical Fitness Certificate
                <span>*</span>
              </label>

              <input
                type="file"
                name="medicalCertificate"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />

            </div>


            <div className="document-upload">

              <label>
                Tourism Training Certificate
              </label>

              <input
                type="file"
                name="trainingCertificate"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />

            </div>


            <div className="document-upload">

              <label>
                Passport Photo
                <span>*</span>
              </label>

              <input
                type="file"
                name="passportPhoto"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />

            </div>

          </div>

        </div>


        {/* Declaration */}

        <div className="form-section">

          <div className="section-heading">

            <span>04</span>

            <div>
              <h2>Declaration</h2>

              <p>
                Confirm the accuracy of your submitted
                information.
              </p>
            </div>

          </div>


          <label className="declaration-box">

            <input
              type="checkbox"
              checked={declaration}
              onChange={(e) =>
                setDeclaration(
                  e.target.checked
                )
              }
            />

            <span>
              I hereby declare that the information
              provided in this renewal application is
              true and accurate. I understand that the
              submitted documents will be verified by
              an authorized officer.
            </span>

          </label>

        </div>


        {/* Messages */}

        {error && (
          <div className="form-error">
            ⚠ {error}
          </div>
        )}

        {success && (
          <div className="form-success">
            ✓ {success}
          </div>
        )}


        {/* Submit */}

        <div className="form-actions">

          <button
            type="button"
            className="cancel-btn"
            onClick={() =>
              navigate("/renew-license")
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-renewal-btn"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit Renewal Application →"}
          </button>

        </div>

      </form>

    </div>
  );
}

export default RenewLicenseForm;