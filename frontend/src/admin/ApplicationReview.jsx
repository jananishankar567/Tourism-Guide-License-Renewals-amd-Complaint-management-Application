// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import "./ApplicationReview.css";

// function ApplicationReview() {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [application, setApplication] =
//     useState(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const officerToken =
//     localStorage.getItem("officerToken");

//   useEffect(() => {
//     fetchApplication();
//   }, [id]);

//   const fetchApplication = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await fetch(
//         `http://localhost:5000/api/admin/applications/${id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${officerToken}`
//           }
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(
//           data.message ||
//             "Unable to fetch application"
//         );
//       }

//       setApplication(data.application);

//     } catch (error) {
//       console.error(
//         "Application review error:",
//         error
//       );

//       setError(
//         error.message ||
//           "Unable to load application"
//       );

//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return "—";

//     return new Date(date).toLocaleDateString(
//       "en-IN",
//       {
//         day: "2-digit",
//         month: "long",
//         year: "numeric"
//       }
//     );
//   };

//   const getDocumentUrl = (documentPath) => {
//     if (!documentPath) return null;

//     if (documentPath.startsWith("http")) {
//       return documentPath;
//     }

//     return `http://localhost:5000/${documentPath.replace(
//       /^\/+/,
//       ""
//     )}`;
//   };

//   const openDocument = (documentPath) => {
//     const url = getDocumentUrl(documentPath);

//     if (url) {
//       window.open(url, "_blank");
//     }
//   };

//   const getStatusClass = (status) => {
//     return status
//       ?.toLowerCase()
//       .replace(/\s+/g, "-");
//   };

//   if (loading) {
//     return (
//       <div className="review-loading">
//         <div className="review-spinner"></div>
//         <p>Loading application...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="review-error-page">
//         <h2>Unable to load application</h2>
//         <p>{error}</p>

//         <button
//           onClick={() =>
//             navigate("/admin-applications")
//           }
//         >
//           ← Back to Applications
//         </button>
//       </div>
//     );
//   }

//   if (!application) {
//     return null;
//   }

//   return (
//     <div className="review-page">

//       {/* HEADER */}

//       <header className="review-header">

//         <div className="review-header-left">

//           <button
//             className="back-button"
//             onClick={() =>
//               navigate("/admin-applications")
//             }
//           >
//             ←
//           </button>

//           <div>
//             <p>
//               APPLICATION REVIEW
//             </p>

//             <h1>
//               Tourism Guide License Application
//             </h1>

//             <span>
//               ID: {application._id}
//             </span>
//           </div>

//         </div>

//         <span
//           className={`review-status ${getStatusClass(
//             application.applicationStatus
//           )}`}
//         >
//           {application.applicationStatus}
//         </span>

//       </header>

//       <main className="review-content">

//         {/* APPLICANT INFORMATION */}

//         <section className="review-card">

//           <div className="review-card-header">

//             <div>
//               <h2>
//                 Applicant Information
//               </h2>

//               <p>
//                 Personal and contact information
//               </p>
//             </div>

//           </div>

//           <div className="review-profile">

//             <div className="review-avatar">
//               {application.fullName
//                 ?.charAt(0)
//                 .toUpperCase()}
//             </div>

//             <div>
//               <h3>
//                 {application.fullName}
//               </h3>

//               <span>
//                 Application submitted on{" "}
//                 {formatDate(
//                   application.createdAt
//                 )}
//               </span>
//             </div>

//           </div>

//           <div className="review-info-grid">

//             <InfoItem
//               label="Full Name"
//               value={application.fullName}
//             />

//             <InfoItem
//               label="Date of Birth"
//               value={formatDate(
//                 application.dateOfBirth
//               )}
//             />

//             <InfoItem
//               label="Gender"
//               value={application.gender}
//             />

//             <InfoItem
//               label="Email Address"
//               value={application.email}
//             />

//             <InfoItem
//               label="Phone Number"
//               value={application.phone}
//             />

//             <InfoItem
//               label="Address"
//               value={application.address}
//             />

//           </div>

//         </section>

//         {/* ELIGIBILITY */}

//         <section className="review-card">

//           <div className="review-card-header">

//             <div>
//               <h2>
//                 Eligibility Information
//               </h2>

//               <p>
//                 Applicant qualification and
//                 eligibility details
//               </p>
//             </div>

//           </div>

//           <div className="review-info-grid">

//             <InfoItem
//               label="Educational Qualification"
//               value={
//                 application.educationalQualification
//               }
//             />

//             <InfoItem
//               label="Tourism Training"
//               value={
//                 application.tourismTraining
//               }
//             />

//             <InfoItem
//               label="Languages Known"
//               value={
//                 application.languagesKnown
//               }
//             />

//             <InfoItem
//               label="Identity Proof"
//               value={
//                 application.identityProof
//               }
//             />

//           </div>

//         </section>

//         {/* DOCUMENTS */}

//         <section className="review-card">

//           <div className="review-card-header">

//             <div>
//               <h2>
//                 Submitted Documents
//               </h2>

//               <p>
//                 Documents uploaded by the applicant
//               </p>
//             </div>

//           </div>

//           <div className="documents-grid">

//             <DocumentCard
//               title="Government ID"
//               value={
//                 application.governmentIdDocument
//               }
//               onOpen={openDocument}
//             />

//             <DocumentCard
//               title="Educational Certificate"
//               value={
//                 application.educationalCertificate
//               }
//               onOpen={openDocument}
//             />

//             <DocumentCard
//               title="Training Certificate"
//               value={
//                 application.trainingCertificate
//               }
//               onOpen={openDocument}
//             />

//             <DocumentCard
//               title="Police Verification"
//               value={
//                 application.policeCertificate
//               }
//               onOpen={openDocument}
//             />

//             <DocumentCard
//               title="Medical Certificate"
//               value={
//                 application.medicalCertificate
//               }
//               onOpen={openDocument}
//             />

//             <DocumentCard
//               title="Passport Photo"
//               value={
//                 application.passportPhoto
//               }
//               onOpen={openDocument}
//             />

//           </div>

//         </section>

//         {/* VERIFICATION */}

//         <section className="review-card">

//           <div className="review-card-header">

//             <div>
//               <h2>
//                 Eligibility Verification
//               </h2>

//               <p>
//                 Verification results will be
//                 completed by the officer.
//               </p>
//             </div>

//           </div>

//           <div className="verification-grid">

//             <VerificationItem
//               label="Age Verification"
//               verified={application.ageVerified}
//             />

//             <VerificationItem
//               label="Education Verification"
//               verified={
//                 application.educationVerified
//               }
//             />

//             <VerificationItem
//               label="Tourism Training"
//               verified={
//                 application.tourismTrainingVerified
//               }
//             />

//             <VerificationItem
//               label="Language Verification"
//               verified={
//                 application.languageVerified
//               }
//             />

//             <VerificationItem
//               label="Identity Verification"
//               verified={
//                 application.identityVerified
//               }
//             />

//             <VerificationItem
//               label="Police Verification"
//               value={
//                 application.policeVerification
//               }
//             />

//             <VerificationItem
//               label="Medical Fitness"
//               value={
//                 application.medicalFitness
//               }
//             />

//           </div>

//         </section>

//         {/* OCR PLACEHOLDER */}

//         <section className="ocr-preview-card">

//           <div className="ocr-icon">
//             ✦
//           </div>

//           <div>

//             <h2>
//               Document OCR Verification
//             </h2>

//             <p>
//               Tesseract OCR will extract information
//               from submitted documents and compare it
//               with the applicant's application data.
//             </p>

//           </div>

//           <span className="coming-soon-badge">
//             NEXT STEP
//           </span>

//         </section>

//         {/* OFFICER ACTION */}

//         <section className="review-action-card">

//           <div>

//             <h2>
//               Officer Decision
//             </h2>

//             <p>
//               After verifying the applicant and
//               submitted documents, choose an appropriate
//               action.
//             </p>

//           </div>

//           <div className="review-actions">

//             <button className="return-action">
//               ↩ Return for Correction
//             </button>

//             <button className="reject-action">
//               ✕ Reject Application
//             </button>

//             <button className="approve-action">
//               ✓ Approve Application
//             </button>

//           </div>

//         </section>

//       </main>

//     </div>
//   );
// }

// /* =========================
//    INFO ITEM
// ========================= */

// function InfoItem({ label, value }) {
//   return (
//     <div className="review-info-item">

//       <span>{label}</span>

//       <strong>
//         {value || "Not provided"}
//       </strong>

//     </div>
//   );
// }

// /* =========================
//    DOCUMENT CARD
// ========================= */

// function DocumentCard({
//   title,
//   value,
//   onOpen
// }) {
//   return (
//     <div className="document-card">

//       <div className="document-icon">
//         📄
//       </div>

//       <div className="document-details">

//         <strong>
//           {title}
//         </strong>

//         <span>
//           {value
//             ? value.split("/").pop()
//             : "Not uploaded"}
//         </span>

//       </div>

//       {value && (
//         <button
//           onClick={() => onOpen(value)}
//         >
//           View
//         </button>
//       )}

//     </div>
//   );
// }

// /* =========================
//    VERIFICATION ITEM
// ========================= */

// function VerificationItem({
//   label,
//   verified,
//   value
// }) {
//   const isVerified =
//     verified === true ||
//     value === "Verified" ||
//     value === "Fit";

//   return (
//     <div className="verification-item">

//       <div>
//         <span>{label}</span>

//         <strong>
//           {value ||
//             (verified
//               ? "Verified"
//               : "Pending")}
//         </strong>
//       </div>

//       <div
//         className={
//           isVerified
//             ? "verification-check verified"
//             : "verification-check pending"
//         }
//       >
//         {isVerified ? "✓" : "!"}
//       </div>

//     </div>
//   );
// }

// export default ApplicationReview;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL as API_URL } from "../api";
import "./ApplicationReview.css";


function ApplicationReview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [verification, setVerification] = useState({
    ageVerified: false,
    educationVerified: false,
    tourismTrainingVerified: false,
    languageVerified: false,
    identityVerified: false,
    policeVerification: "Pending",
    medicalFitness: "Pending"
  });

  const [officerRemarks, setOfficerRemarks] =
    useState("");

  const officerToken =
    localStorage.getItem("officerToken");

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${officerToken}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to fetch application"
        );
      }

      const app = data.application;

      setApplication(app);

      setVerification({
        ageVerified: app.ageVerified || false,
        educationVerified:
          app.educationVerified || false,
        tourismTrainingVerified:
          app.tourismTrainingVerified || false,
        languageVerified:
          app.languageVerified || false,
        identityVerified:
          app.identityVerified || false,
        policeVerification:
          app.policeVerification || "Pending",
        medicalFitness:
          app.medicalFitness || "Pending"
      });

      setOfficerRemarks(
        app.officerRemarks || ""
      );

    } catch (error) {
      console.error(
        "Application review error:",
        error
      );

      setError(
        error.message ||
          "Unable to load application"
      );

    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UPDATE CHECKBOX
  ========================= */

  const handleCheckboxChange = (field) => {
    setVerification((previous) => ({
      ...previous,
      [field]: !previous[field]
    }));
  };

  /* =========================
     SAVE VERIFICATION
  ========================= */

  const saveVerification = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/applications/${id}/verify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${officerToken}`
          },
          body: JSON.stringify({
            ...verification,
            officerRemarks
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save verification"
        );
      }

      setApplication(data.application);

      setSuccess(
        "Verification details saved successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    } catch (error) {
      console.error(
        "Verification update error:",
        error
      );

      setError(
        error.message ||
          "Failed to save verification"
      );

    } finally {
      setSaving(false);
    }
  };

  /* =========================
     FINAL DECISION
  ========================= */

  const handleDecision = async (decision) => {
    let confirmationMessage = "";

    if (decision === "Approved") {
      confirmationMessage =
        "Are you sure you want to approve this application? A tourism guide license will be generated automatically.";
    }

    if (decision === "Rejected") {
      confirmationMessage =
        "Are you sure you want to reject this application?";
    }

    if (decision === "Returned") {
      confirmationMessage =
        "Are you sure you want to return this application to the applicant?";
    }

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/applications/${id}/decision`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${officerToken}`
          },
          body: JSON.stringify({
            decision,
            officerRemarks
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update application"
        );
      }

      setApplication(data.application);

      if (decision === "Approved") {
        setSuccess(
          `Application approved successfully. License Number: ${data.application.licenseNumber}`
        );
      } else {
        setSuccess(
          `Application ${decision.toLowerCase()} successfully.`
        );
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    } catch (error) {
      console.error(
        "Decision update error:",
        error
      );

      setError(
        error.message ||
          "Failed to update application"
      );

    } finally {
      setSaving(false);
    }
  };

  /* =========================
     HELPERS
  ========================= */

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );
  };

  const getDocumentUrl = (documentPath) => {
    if (!documentPath) return null;

    const filename = documentPath.split(/[\\/]/).pop();
    return `${API_URL}/api/files/${encodeURIComponent(filename)}`;
  };

  const openDocument = (documentPath) => {
    const url = getDocumentUrl(documentPath);

    if (url) {
      const token = localStorage.getItem("officerToken");
      if (!token) {
        setError("Your officer session has expired. Please log in again.");
        return;
      }

      const documentWindow = window.open("", "_blank");
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (response) => {
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
        })
        .catch((documentError) => {
          documentWindow?.close();
          console.error("Document access error:", documentError);
          setError(documentError.message || "Unable to open the document.");
        });
    }
  };

  const getStatusClass = (status) => {
    return status
      ?.toLowerCase()
      .replace(/\s+/g, "-");
  };

  const allEligibilityVerified =
    verification.ageVerified &&
    verification.educationVerified &&
    verification.tourismTrainingVerified &&
    verification.languageVerified &&
    verification.identityVerified &&
    verification.policeVerification ===
      "Verified" &&
    verification.medicalFitness === "Fit";

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="review-loading">
        <div className="review-spinner"></div>

        <p>
          Loading application...
        </p>
      </div>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error && !application) {
    return (
      <div className="review-error-page">

        <h2>
          Unable to load application
        </h2>

        <p>{error}</p>

        <button
          onClick={() =>
            navigate("/admin-applications")
          }
        >
          ← Back to Applications
        </button>

      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="review-page">

      {/* HEADER */}

      <header className="review-header">

        <div className="review-header-left">

          <button
            className="back-button"
            onClick={() =>
              navigate("/admin-applications")
            }
          >
            ←
          </button>

          <div>

            <p>
              APPLICATION REVIEW
            </p>

            <h1>
              Tourism Guide License Application
            </h1>

            <span>
              ID: {application._id}
            </span>

          </div>

        </div>

        <span
          className={`review-status ${getStatusClass(
            application.applicationStatus
          )}`}
        >
          {application.applicationStatus}
        </span>

      </header>

      <main className="review-content">

        {/* SUCCESS */}

        {success && (
          <div className="review-success-message">
            <span>✓</span>
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="review-error-message">
            <span>!</span>
            {error}
          </div>
        )}

        {/* APPLICANT INFORMATION */}

        <section className="review-card">

          <div className="review-card-header">

            <div>
              <h2>
                Applicant Information
              </h2>

              <p>
                Personal and contact information
              </p>
            </div>

          </div>

          <div className="review-profile">

            <div className="review-avatar">
              {application.fullName
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <h3>
                {application.fullName}
              </h3>

              <span>
                Application submitted on{" "}
                {formatDate(
                  application.createdAt
                )}
              </span>

            </div>

          </div>

          <div className="review-info-grid">

            <InfoItem
              label="Full Name"
              value={application.fullName}
            />

            <InfoItem
              label="Date of Birth"
              value={formatDate(
                application.dateOfBirth
              )}
            />

            <InfoItem
              label="Gender"
              value={application.gender}
            />

            <InfoItem
              label="Email Address"
              value={application.email}
            />

            <InfoItem
              label="Phone Number"
              value={application.phone}
            />

            <InfoItem
              label="Address"
              value={application.address}
            />

          </div>

        </section>

        {/* ELIGIBILITY INFORMATION */}

        <section className="review-card">

          <div className="review-card-header">

            <div>
              <h2>
                Eligibility Information
              </h2>

              <p>
                Applicant qualification and
                eligibility details
              </p>
            </div>

          </div>

          <div className="review-info-grid">

            <InfoItem
              label="Educational Qualification"
              value={
                application.educationalQualification
              }
            />

            <InfoItem
              label="Tourism Training"
              value={
                application.tourismTraining
              }
            />

            <InfoItem
              label="Languages Known"
              value={
                application.languagesKnown
              }
            />

            <InfoItem
              label="Identity Proof"
              value={
                application.identityProof
              }
            />

          </div>

        </section>

        {/* DOCUMENTS */}

        <section className="review-card">

          <div className="review-card-header">

            <div>
              <h2>
                Submitted Documents
              </h2>

              <p>
                Documents uploaded by the applicant
              </p>
            </div>

          </div>

          <div className="documents-grid">

            <DocumentCard
              title="Government ID"
              value={
                application.governmentIdDocument
              }
              onOpen={openDocument}
            />

            <DocumentCard
              title="Educational Certificate"
              value={
                application.educationalCertificate
              }
              onOpen={openDocument}
            />

            <DocumentCard
              title="Training Certificate"
              value={
                application.trainingCertificate
              }
              onOpen={openDocument}
            />

            <DocumentCard
              title="IITFC Portal Registration Proof"
              value={application.iitfcRegistrationProof}
              onOpen={openDocument}
            />

            <DocumentCard
              title="Seven-Module Completion Certificate"
              value={application.moduleCompletionCertificate}
              onOpen={openDocument}
            />

            <DocumentCard
              title="NCHMCT Examination Result"
              value={application.nchmctExamCertificate}
              onOpen={openDocument}
            />

            <DocumentCard
              title="Communication Seminar Certificate"
              value={application.communicationSeminarCertificate}
              onOpen={openDocument}
            />

            <DocumentCard
              title="Verification Video"
              value={application.verificationVideo}
              onOpen={openDocument}
            />

            <DocumentCard
              title="Police Verification"
              value={
                application.policeCertificate
              }
              onOpen={openDocument}
            />

            <DocumentCard
              title="Medical Certificate"
              value={
                application.medicalCertificate
              }
              onOpen={openDocument}
            />

            <DocumentCard
              title="Passport Photo"
              value={
                application.passportPhoto
              }
              onOpen={openDocument}
            />

          </div>

        </section>

        {/* OFFICER VERIFICATION */}

        <section className="review-card">

          <div className="review-card-header">

            <div>
              <h2>
                Officer Verification
              </h2>

              <p>
                Verify the applicant's eligibility
                and supporting documents.
              </p>
            </div>

            <span
              className={
                allEligibilityVerified
                  ? "verification-complete"
                  : "verification-incomplete"
              }
            >
              {allEligibilityVerified
                ? "✓ Ready for Approval"
                : "Verification Pending"}
            </span>

          </div>

          <div className="verification-grid">

            <VerificationCheckbox
              label="Age Verified"
              checked={
                verification.ageVerified
              }
              onChange={() =>
                handleCheckboxChange(
                  "ageVerified"
                )
              }
            />

            <VerificationCheckbox
              label="Education Verified"
              checked={
                verification.educationVerified
              }
              onChange={() =>
                handleCheckboxChange(
                  "educationVerified"
                )
              }
            />

            <VerificationCheckbox
              label="Tourism Training Verified"
              checked={
                verification.tourismTrainingVerified
              }
              onChange={() =>
                handleCheckboxChange(
                  "tourismTrainingVerified"
                )
              }
            />

            <VerificationCheckbox
              label="Language Verified"
              checked={
                verification.languageVerified
              }
              onChange={() =>
                handleCheckboxChange(
                  "languageVerified"
                )
              }
            />

            <VerificationCheckbox
              label="Identity Verified"
              checked={
                verification.identityVerified
              }
              onChange={() =>
                handleCheckboxChange(
                  "identityVerified"
                )
              }
            />

          </div>

          <div className="verification-select-grid">

            <div className="verification-select">

              <label>
                Police Verification
              </label>

              <select
                value={
                  verification.policeVerification
                }
                onChange={(e) =>
                  setVerification({
                    ...verification,
                    policeVerification:
                      e.target.value
                  })
                }
              >
                <option value="Pending">
                  Pending
                </option>

                <option value="Verified">
                  Verified
                </option>

                <option value="Failed">
                  Failed
                </option>

              </select>

            </div>

            <div className="verification-select">

              <label>
                Medical Fitness
              </label>

              <select
                value={
                  verification.medicalFitness
                }
                onChange={(e) =>
                  setVerification({
                    ...verification,
                    medicalFitness:
                      e.target.value
                  })
                }
              >
                <option value="Pending">
                  Pending
                </option>

                <option value="Fit">
                  Fit
                </option>

                <option value="Unfit">
                  Unfit
                </option>

              </select>

            </div>

          </div>

          {/* REMARKS */}

          <div className="remarks-section">

            <label>
              Officer Remarks
            </label>

            <textarea
              value={officerRemarks}
              onChange={(e) =>
                setOfficerRemarks(
                  e.target.value
                )
              }
              placeholder="Enter verification remarks, observations or required corrections..."
              rows="5"
            />

          </div>

          <div className="verification-save-row">

            <button
              className="save-verification-button"
              onClick={saveVerification}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "✓ Save Verification"}
            </button>

          </div>

        </section>

        {/* OCR */}

        <section className="ocr-preview-card">

          <div className="ocr-icon">
            ✦
          </div>

          <div>

            <h2>
              Document OCR Verification
            </h2>

            <p>
              Tesseract OCR will extract information
              from submitted documents and compare
              it with the applicant's application data.
            </p>

          </div>

          <span className="coming-soon-badge">
            NEXT STEP
          </span>

        </section>

        {/* OFFICER DECISION */}

        <section className="review-action-card">

          <div>

            <h2>
              Officer Decision
            </h2>

            <p>
              Verify all required information before
              making the final decision.
            </p>

          </div>

          <div className="review-actions">

            <button
              className="return-action"
              onClick={() =>
                handleDecision("Returned")
              }
              disabled={saving}
            >
              ↩ Return for Correction
            </button>

            <button
              className="reject-action"
              onClick={() =>
                handleDecision("Rejected")
              }
              disabled={saving}
            >
              ✕ Reject Application
            </button>

            <button
              className="approve-action"
              onClick={() =>
                handleDecision("Approved")
              }
              disabled={
                saving ||
                !allEligibilityVerified
              }
              title={
                !allEligibilityVerified
                  ? "Complete all verification criteria before approval"
                  : ""
              }
            >
              ✓ Approve Application
            </button>

          </div>

        </section>

        {application.history?.length > 0 && (
          <section className="review-history-card">
            <div className="review-section-heading">
              <div>
                <h2>Application History</h2>
                <p>Verification and decision updates for this application.</p>
              </div>
            </div>
            <div className="review-history-list">
              {[...application.history].reverse().map((entry, index) => (
                <article
                  className="review-history-entry"
                  key={`${entry.action}-${entry.updatedAt}-${index}`}
                >
                  <div className="review-history-entry-heading">
                    <strong>{entry.action}</strong>
                    <span>{entry.status}</span>
                  </div>
                  <small>
                    {entry.updatedBy} ·{" "}
                    {entry.updatedAt
                      ? new Date(entry.updatedAt).toLocaleString("en-IN")
                      : "Date unavailable"}
                  </small>
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

      </main>

    </div>
  );
}

/* =========================
   INFO ITEM
========================= */

function InfoItem({ label, value }) {
  return (
    <div className="review-info-item">

      <span>{label}</span>

      <strong>
        {value || "Not provided"}
      </strong>

    </div>
  );
}

/* =========================
   DOCUMENT CARD
========================= */

function DocumentCard({
  title,
  value,
  onOpen
}) {
  return (
    <div className="document-card">

      <div className="document-icon">
        📄
      </div>

      <div className="document-details">

        <strong>
          {title}
        </strong>

        <span>
          {value
            ? value.split("/").pop()
            : "Not uploaded"}
        </span>

      </div>

      {value && (
        <button
          onClick={() => onOpen(value)}
        >
          View
        </button>
      )}

    </div>
  );
}

/* =========================
   VERIFICATION CHECKBOX
========================= */

function VerificationCheckbox({
  label,
  checked,
  onChange
}) {
  return (
    <label
      className={`verification-checkbox ${
        checked ? "checked" : ""
      }`}
    >

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      <span className="custom-checkbox">
        {checked ? "✓" : ""}
      </span>

      <span className="verification-label">
        {label}
      </span>

    </label>
  );
}

export default ApplicationReview;