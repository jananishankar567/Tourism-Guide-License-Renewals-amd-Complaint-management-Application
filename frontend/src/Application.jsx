import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";
import { useNavigate, useSearchParams } from "react-router-dom";
import tamilNaduDistricts from "./tourism/tamilNaduDistricts";
import "./Application.css";

function getAuthenticatedEmail() {
  const token = localStorage.getItem("token");
  if (!token) return "";

  try {
    const encodedPayload = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = JSON.parse(
      atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "="))
    );
    return payload.email || "";
  } catch (error) {
    console.error("Unable to read applicant email from session:", error);
    return "";
  }
}

function Application() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResubmission = searchParams.get("resubmit") === "1";

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [isInitializing, setIsInitializing] = useState(isResubmission);
  const [initializationError, setInitializationError] = useState("");

  // ==========================================
  // PERSONAL DETAILS
  // ==========================================

  const [personalData, setPersonalData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    mobile: "",
    email: getAuthenticatedEmail(),
    district: "",
    address: "",
  });

  // ==========================================
  // ELIGIBILITY DETAILS
  // ==========================================

  const [eligibilityData, setEligibilityData] = useState({
    qualification: "",
    qualificationDetails: "",
    tourismTraining: "",
    trainingDetails: "",
    languages: "",
    governmentId: "",
    policeVerification: "",
    medicalFitness: "",
  });

  // ==========================================
  // DOCUMENT DETAILS
  // ==========================================

  const [documentData, setDocumentData] = useState({
    governmentId: null,
    educationCertificate: null,
    tourismCertificate: null,
    iitfcRegistrationProof: null,
    moduleCompletionCertificate: null,
    nchmctExamCertificate: null,
    communicationSeminarCertificate: null,
    verificationVideo: null,
    policeCertificate: null,
    medicalCertificate: null,
    passportPhoto: null,
  });

  useEffect(() => {
    if (!isResubmission) {
      return undefined;
    }

    const controller = new AbortController();
    const loadApplicationForResubmission = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setInitializationError("Your session has expired. Please log in again.");
        setIsInitializing(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/applications/mine`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );
        const application = await response.json();
        if (!response.ok) {
          throw new Error(application.message || "Unable to load your application.");
        }
        if (!["Returned", "Rejected"].includes(application.applicationStatus)) {
          throw new Error("Only returned or rejected applications can be corrected.");
        }

        const qualification = String(application.educationalQualification || "");
        const qualificationPrefix = qualification.toLowerCase();
        const qualificationCode = qualificationPrefix.startsWith("higher secondary")
          ? "higher_secondary"
          : qualificationPrefix.startsWith("diploma")
            ? "diploma"
            : qualificationPrefix.startsWith("bachelor")
              ? "degree"
              : qualificationPrefix.startsWith("postgraduate")
                ? "postgraduate"
                : "";
        const qualificationDetails = qualification.includes(" - ")
          ? qualification.slice(qualification.indexOf(" - ") + 3)
          : qualificationCode
            ? ""
            : qualification;
        const training = String(application.tourismTraining || "");
        const trainingYes = /^yes\b/i.test(training);
        const trainingNo = /^no\b/i.test(training);
        const identityProof = String(application.identityProof || "").toLowerCase();
        const governmentId = identityProof.includes("aadhaar")
          ? "aadhaar"
          : identityProof.includes("passport")
            ? "passport"
            : identityProof.includes("voter")
              ? "voter_id"
              : identityProof.includes("driving")
                ? "driving_license"
                : "";

        setExistingApplication(application);
        setPersonalData({
          fullName: application.fullName || "",
          dateOfBirth: String(application.dateOfBirth || "").slice(0, 10),
          gender: String(application.gender || "").toLowerCase(),
          mobile: application.phone || "",
          email: application.email || "",
          district: application.district || "other",
          address: application.address || "",
        });
        setEligibilityData({
          qualification: qualificationCode,
          qualificationDetails,
          tourismTraining: trainingYes ? "yes" : trainingNo ? "no" : "",
          trainingDetails:
            trainingYes && training.includes(" - ")
              ? training.slice(training.indexOf(" - ") + 3)
              : "",
          languages: application.languagesKnown || "",
          governmentId,
          policeVerification: "pending",
          medicalFitness: "pending",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Application resubmission load error:", error);
          setInitializationError(error.message || "Unable to load your application.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsInitializing(false);
        }
      }
    };

    loadApplicationForResubmission();
    return () => controller.abort();
  }, [isResubmission]);

  // ==========================================
  // PERSONAL FIELD CHANGE
  // ==========================================

  const handlePersonalChange = (e) => {
    setPersonalData({
      ...personalData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // ELIGIBILITY FIELD CHANGE
  // ==========================================

  const handleEligibilityChange = (e) => {
    setEligibilityData({
      ...eligibilityData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // FILE CHANGE
  // ==========================================

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (files && files.length > 0) {
      setDocumentData({
        ...documentData,
        [name]: files[0],
      });
    }
  };

  // ==========================================
  // SCROLL TO TOP
  // ==========================================

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // STEP 1 → STEP 2
  // ==========================================

  const handlePersonalNext = (e) => {
    e.preventDefault();

    setCurrentStep(2);

    scrollTop();
  };

  // ==========================================
  // STEP 2 → STEP 3
  // ==========================================

  const handleEligibilityNext = (e) => {
    e.preventDefault();

    setCurrentStep(3);

    scrollTop();
  };

  // ==========================================
  // STEP 3 → STEP 4
  // ==========================================

  const handleReview = () => {
    const requiredDocuments = [
      ["governmentId", "governmentIdDocument"],
      ["educationCertificate", "educationalCertificate"],
      ["tourismCertificate", "trainingCertificate"],
      ["policeCertificate", "policeCertificate"],
      ["medicalCertificate", "medicalCertificate"],
      ["passportPhoto", "passportPhoto"],
    ];

    const allDocumentsUploaded =
      requiredDocuments.every(
        ([formField, applicationField]) =>
          documentData[formField] || existingApplication?.[applicationField]
      );

    if (!allDocumentsUploaded) {
      alert(
        "Please upload all required documents before continuing."
      );

      return;
    }

    setCurrentStep(4);

    scrollTop();
  };

  // ==========================================
  // SUBMIT APPLICATION TO BACKEND
  // ==========================================

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      // ========================================
      // CREATE FORMDATA
      // ========================================

      const formData = new FormData();
      if (existingApplication) {
        formData.append("applicationId", existingApplication._id);
      }

      // ========================================
      // PERSONAL INFORMATION
      // ========================================

      formData.append(
        "fullName",
        personalData.fullName
      );

      formData.append(
        "dateOfBirth",
        personalData.dateOfBirth
      );

      // Convert frontend gender value
      // into backend enum value
      let genderValue = "";

      if (personalData.gender === "male") {
        genderValue = "Male";
      } else if (
        personalData.gender === "female"
      ) {
        genderValue = "Female";
      } else if (
        personalData.gender === "other"
      ) {
        genderValue = "Other";
      }

      formData.append(
        "gender",
        genderValue
      );

      formData.append(
        "phone",
        personalData.mobile
      );

      formData.append(
        "email",
        personalData.email
      );

      formData.append(
        "district",
        personalData.district
      );

      formData.append(
        "address",
        personalData.address
      );

      // ========================================
      // ELIGIBILITY INFORMATION
      // ========================================

      const qualificationLabel =
        getQualificationLabel(
          eligibilityData.qualification
        );

      const qualificationValue =
        eligibilityData.qualificationDetails
          ? `${qualificationLabel} - ${eligibilityData.qualificationDetails}`
          : qualificationLabel;

      formData.append(
        "educationalQualification",
        qualificationValue
      );

      let trainingValue = "";

      if (
        eligibilityData.tourismTraining === "yes"
      ) {
        trainingValue =
          eligibilityData.trainingDetails
            ? `Yes - ${eligibilityData.trainingDetails}`
            : "Yes";
      } else if (
        eligibilityData.tourismTraining === "no"
      ) {
        trainingValue = "No";
      }

      formData.append(
        "tourismTraining",
        trainingValue
      );

      formData.append(
        "languagesKnown",
        eligibilityData.languages
      );

      formData.append(
        "identityProof",
        getGovernmentIdLabel(
          eligibilityData.governmentId
        )
      );

      // ========================================
      // DOCUMENTS
      // ========================================

      const uploadFields = {
        governmentIdDocument: documentData.governmentId,
        educationalCertificate: documentData.educationCertificate,
        trainingCertificate: documentData.tourismCertificate,
        iitfcRegistrationProof: documentData.iitfcRegistrationProof,
        moduleCompletionCertificate: documentData.moduleCompletionCertificate,
        nchmctExamCertificate: documentData.nchmctExamCertificate,
        communicationSeminarCertificate: documentData.communicationSeminarCertificate,
        verificationVideo: documentData.verificationVideo,
        policeCertificate: documentData.policeCertificate,
        medicalCertificate: documentData.medicalCertificate,
        passportPhoto: documentData.passportPhoto,
      };

      Object.entries(uploadFields).forEach(([field, file]) => {
        if (file) {
          formData.append(field, file);
        }
      });

      // ========================================
      // SEND REQUEST
      // ========================================

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/applications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // ========================================
      // READ BACKEND RESPONSE
      // ========================================

      const result = await response.json();

      // ========================================
      // HANDLE BACKEND ERROR
      // ========================================

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to submit application."
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      console.log(
        "Application submitted successfully:",
        result
      );

      alert(
        result.message === "Application resubmitted successfully"
          ? "Your corrected application has been resubmitted for officer review."
          : "Application submitted successfully! Your application has been sent to the licensing officer for verification."
      );

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Application submission error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while submitting the application."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DISPLAY LABEL FUNCTIONS
  // ==========================================

  const getGenderLabel = (gender) => {
    if (gender === "male") {
      return "Male";
    }

    if (gender === "female") {
      return "Female";
    }

    if (gender === "other") {
      return "Other";
    }

    return "Not provided";
  };

  const getQualificationLabel = (
    qualification
  ) => {
    if (
      qualification ===
      "higher_secondary"
    ) {
      return "Higher Secondary";
    }

    if (qualification === "diploma") {
      return "Diploma";
    }

    if (qualification === "degree") {
      return "Bachelor's Degree";
    }

    if (
      qualification === "postgraduate"
    ) {
      return "Postgraduate Degree";
    }

    return "Not provided";
  };

  const getTrainingLabel = (
    training
  ) => {
    if (training === "yes") {
      return "Yes";
    }

    if (training === "no") {
      return "No";
    }

    return "Not provided";
  };

  const getGovernmentIdLabel = (
    id
  ) => {
    if (id === "aadhaar") {
      return "Aadhaar";
    }

    if (id === "passport") {
      return "Passport";
    }

    if (id === "voter_id") {
      return "Voter ID";
    }

    if (
      id === "driving_license"
    ) {
      return "Driving License";
    }

    return "Not provided";
  };

  const getPoliceLabel = (
    status
  ) => {
    if (status === "available") {
      return "Certificate Available";
    }

    if (status === "pending") {
      return "Verification Pending";
    }

    if (
      status === "not_available"
    ) {
      return "Not Available";
    }

    return "Not provided";
  };

  const getMedicalLabel = (
    status
  ) => {
    if (status === "available") {
      return "Medical Certificate Available";
    }

    if (status === "pending") {
      return "Certificate Pending";
    }

    if (
      status === "not_available"
    ) {
      return "Not Available";
    }

    return "Not provided";
  };

  if (isInitializing) {
    return (
      <div className="application-page">
        <main className="application-main">
          <div className="application-loading">
            Loading your application for correction...
          </div>
        </main>
      </div>
    );
  }

  if (initializationError) {
    return (
      <div className="application-page">
        <main className="application-main">
          <div className="application-error">
            <h2>Unable to prepare your application</h2>
            <p>{initializationError}</p>
            <button
              className="back-dashboard-button"
              onClick={() => navigate("/application-status")}
            >
              Back to Application Status
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="application-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="application-header">

        <div className="application-brand">

          <div className="application-brand-mark">
            TG
          </div>

          <div>
            <h1>
              Tourism Guide Portal
            </h1>

            <span>
              License Application
            </span>
          </div>

        </div>

        <button
          className="back-dashboard-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

      </header>


      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="application-main">

        {/* PAGE HEADING */}

        <div className="application-heading">

          <span className="application-label">
            TOURISM GUIDE LICENSE
          </span>

          <h2>
            {existingApplication ? "Correct Your Application" : "License Application"}
          </h2>

          <p>
            {existingApplication
              ? `Update the details and documents requested by the officer. Your existing application ID (${existingApplication._id}) will be retained.`
              : "Complete the following information to apply for a Tamil Nadu local-level tourism guide license."}
          </p>

        </div>


        {/* ====================================
            PROGRESS BAR
        ==================================== */}

        <div className="application-progress">

          <div
            className={`application-step ${
              currentStep >= 1
                ? "active"
                : ""
            }`}
          >

            <div className="step-number">
              1
            </div>

            <span>
              Personal Details
            </span>

          </div>


          <div className="step-line"></div>


          <div
            className={`application-step ${
              currentStep >= 2
                ? "active"
                : ""
            }`}
          >

            <div className="step-number">
              2
            </div>

            <span>
              Eligibility
            </span>

          </div>


          <div className="step-line"></div>


          <div
            className={`application-step ${
              currentStep >= 3
                ? "active"
                : ""
            }`}
          >

            <div className="step-number">
              3
            </div>

            <span>
              Documents
            </span>

          </div>


          <div className="step-line"></div>


          <div
            className={`application-step ${
              currentStep >= 4
                ? "active"
                : ""
            }`}
          >

            <div className="step-number">
              4
            </div>

            <span>
              Review & Submit
            </span>

          </div>

        </div>


        {/* ====================================
            STEP 1
        ==================================== */}

        {currentStep === 1 && (

          <section className="application-card">

            <div className="application-card-heading">

              <div>

                <span>
                  SECTION 01
                </span>

                <h3>
                  Personal Information
                </h3>

              </div>

              <p>
                Step 1 of 4
              </p>

            </div>


            <form
              onSubmit={
                handlePersonalNext
              }
            >

              <div className="form-grid">

                {/* FULL NAME */}

                <div className="form-field">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={
                      personalData.fullName
                    }
                    onChange={
                      handlePersonalChange
                    }
                    required
                  />

                </div>


                {/* DOB */}

                <div className="form-field">

                  <label>
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={
                      personalData.dateOfBirth
                    }
                    onChange={
                      handlePersonalChange
                    }
                    required
                  />

                </div>


                {/* GENDER */}

                <div className="form-field">

                  <label>
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={
                      personalData.gender
                    }
                    onChange={
                      handlePersonalChange
                    }
                    required
                  >

                    <option value="">
                      Select gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>


                {/* MOBILE */}

                <div className="form-field">

                  <label>
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={
                      personalData.mobile
                    }
                    onChange={
                      handlePersonalChange
                    }
                    required
                  />

                </div>


                {/* EMAIL */}

                <div className="form-field">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      personalData.email
                    }
                    readOnly
                    required
                  />
                  <small>
                    Your application email is linked to your applicant account.
                  </small>

                </div>


                {/* DISTRICT */}

                <div className="form-field">

                  <label>
                    District
                  </label>

                  <select
                    name="district"
                    value={
                      personalData.district
                    }
                    onChange={
                      handlePersonalChange
                    }
                    required
                  >

                    <option value="">
                      Select district
                    </option>

                    {tamilNaduDistricts.map((district) => (
                      <option
                        key={district}
                        value={district.toLowerCase()}
                      >
                        {district}
                      </option>
                    ))}

                  </select>

                </div>


                {/* ADDRESS */}

                <div className="form-field full-width">

                  <label>
                    Residential Address
                  </label>

                  <textarea
                    rows="3"
                    name="address"
                    placeholder="Enter your complete residential address"
                    value={
                      personalData.address
                    }
                    onChange={
                      handlePersonalChange
                    }
                    required
                  ></textarea>

                </div>

              </div>


              <div className="application-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="next-button"
                >
                  Save & Continue →
                </button>

              </div>

            </form>

          </section>

        )}


        {/* ====================================
            STEP 2
        ==================================== */}

        {currentStep === 2 && (

          <section className="application-card">

            <div className="application-card-heading">

              <div>

                <span>
                  SECTION 02
                </span>

                <h3>
                  Eligibility Criteria
                </h3>

              </div>

              <p>
                Step 2 of 4
              </p>

            </div>


            <div className="eligibility-info">

              <strong>
                Important:
              </strong>

              <span>
                You may apply for a tourism
                guide license, but the final
                eligibility and document
                verification will be performed
                by the licensing officer.
              </span>

            </div>


            <form
              onSubmit={
                handleEligibilityNext
              }
            >

              <div className="form-grid">

                {/* QUALIFICATION */}

                <div className="form-field">

                  <label>
                    Educational Qualification
                  </label>

                  <select
                    name="qualification"
                    value={
                      eligibilityData.qualification
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  >

                    <option value="">
                      Select qualification
                    </option>

                    <option value="higher_secondary">
                      Higher Secondary
                    </option>

                    <option value="diploma">
                      Diploma
                    </option>

                    <option value="degree">
                      Bachelor's Degree
                    </option>

                    <option value="postgraduate">
                      Postgraduate Degree
                    </option>

                  </select>

                </div>


                {/* QUALIFICATION DETAILS */}

                <div className="form-field">

                  <label>
                    Qualification Details
                  </label>

                  <input
                    type="text"
                    name="qualificationDetails"
                    placeholder="Example: B.A. Tourism"
                    value={
                      eligibilityData
                        .qualificationDetails
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  />

                </div>


                {/* TOURISM TRAINING */}

                <div className="form-field">

                  <label>
                    Tourism Training
                  </label>

                  <select
                    name="tourismTraining"
                    value={
                      eligibilityData
                        .tourismTraining
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  >

                    <option value="">
                      Select option
                    </option>

                    <option value="yes">
                      Yes
                    </option>

                    <option value="no">
                      No
                    </option>

                  </select>

                </div>


                {/* TRAINING DETAILS */}

                <div className="form-field">

                  <label>
                    Training / Course Details
                  </label>

                  <input
                    type="text"
                    name="trainingDetails"
                    placeholder="Enter course or training details"
                    value={
                      eligibilityData
                        .trainingDetails
                    }
                    onChange={
                      handleEligibilityChange
                    }
                  />

                </div>


                {/* LANGUAGES */}

                <div className="form-field full-width">

                  <label>
                    Language Proficiency
                  </label>

                  <input
                    type="text"
                    name="languages"
                    placeholder="Example: Tamil, English, Hindi"
                    value={
                      eligibilityData.languages
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  />

                  <small>
                    Mention the languages in which
                    you can communicate with tourists.
                  </small>

                </div>


                {/* GOVERNMENT ID */}

                <div className="form-field">

                  <label>
                    Valid Government ID
                  </label>

                  <select
                    name="governmentId"
                    value={
                      eligibilityData
                        .governmentId
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  >

                    <option value="">
                      Select ID type
                    </option>

                    <option value="aadhaar">
                      Aadhaar
                    </option>

                    <option value="passport">
                      Passport
                    </option>

                    <option value="voter_id">
                      Voter ID
                    </option>

                    <option value="driving_license">
                      Driving License
                    </option>

                  </select>

                </div>


                {/* POLICE */}

                <div className="form-field">

                  <label>
                    Police / Background Verification
                  </label>

                  <select
                    name="policeVerification"
                    value={
                      eligibilityData
                        .policeVerification
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  >

                    <option value="">
                      Select status
                    </option>

                    <option value="available">
                      Certificate Available
                    </option>

                    <option value="pending">
                      Verification Pending
                    </option>

                    <option value="not_available">
                      Not Available
                    </option>

                  </select>

                </div>


                {/* MEDICAL */}

                <div className="form-field full-width">

                  <label>
                    Medical Fitness
                  </label>

                  <select
                    name="medicalFitness"
                    value={
                      eligibilityData
                        .medicalFitness
                    }
                    onChange={
                      handleEligibilityChange
                    }
                    required
                  >

                    <option value="">
                      Select status
                    </option>

                    <option value="available">
                      Medical Certificate Available
                    </option>

                    <option value="pending">
                      Certificate Pending
                    </option>

                    <option value="not_available">
                      Not Available
                    </option>

                  </select>

                </div>

              </div>


              <div className="eligibility-note">

                <div className="eligibility-note-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Eligibility Review
                  </strong>

                  <p>
                    Your submitted information will
                    be checked against the prescribed
                    eligibility requirements. The
                    licensing officer will verify the
                    supporting documents before
                    approving your application.
                  </p>

                </div>

              </div>


              <div className="application-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setCurrentStep(1);
                    scrollTop();
                  }}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="next-button"
                >
                  Save & Continue →
                </button>

              </div>

            </form>

          </section>

        )}


        {/* ====================================
            STEP 3
        ==================================== */}

        {currentStep === 3 && (

          <section className="application-card">

            <div className="application-card-heading">

              <div>

                <span>
                  SECTION 03
                </span>

                <h3>
                  Supporting Documents
                </h3>

              </div>

              <p>
                Step 3 of 4
              </p>

            </div>


            <div className="document-info">

              <strong>
                Document Verification:
              </strong>

              <span>
                Upload clear and readable documents.
                All documents will be reviewed and
                verified by the licensing officer
                before your application is approved.
                {existingApplication &&
                  " Existing documents will be retained unless you upload replacements."}
              </span>

            </div>


            <div className="document-grid">

              {/* GOVERNMENT ID */}

              <div className="document-field">

                <div className="document-heading">

                  <div>

                    <strong>
                      Government ID
                    </strong>

                    <p>
                      Aadhaar, Passport, Voter ID
                      or Driving License
                    </p>

                  </div>

                  <span className="required-badge">
                    {existingApplication?.governmentIdDocument ? "On file" : "Required"}
                  </span>

                </div>


                <input
                  type="file"
                  name="governmentId"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                />


                {(documentData.governmentId || existingApplication?.governmentIdDocument) && (

                  <span className="selected-file">
                    ✓{" "}
                    {documentData.governmentId?.name ||
                      existingApplication.governmentIdDocument.split(/[\\/]/).pop()}
                  </span>

                )}

              </div>


              {/* EDUCATION */}

              <div className="document-field">

                <div className="document-heading">

                  <div>

                    <strong>
                      Educational Certificate
                    </strong>

                    <p>
                      Certificate supporting
                      your qualification
                    </p>

                  </div>

                  <span className="required-badge">
                    {existingApplication?.educationalCertificate ? "On file" : "Required"}
                  </span>

                </div>


                <input
                  type="file"
                  name="educationCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                />


                {(documentData.educationCertificate || existingApplication?.educationalCertificate) && (

                  <span className="selected-file">
                    ✓{" "}
                    {documentData.educationCertificate?.name ||
                      existingApplication.educationalCertificate.split(/[\\/]/).pop()}
                  </span>

                )}

              </div>


              {/* TOURISM CERTIFICATE */}

              <div className="document-field">

                <div className="document-heading">

                  <div>

                    <strong>
                      Tourism Training Certificate
                    </strong>

                    <p>
                      Tourism-related training
                      certificate
                    </p>

                  </div>

                  <span className="required-badge">
                    {existingApplication?.trainingCertificate ? "On file" : "Required"}
                  </span>

                </div>


                <input
                  type="file"
                  name="tourismCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                />


                {(documentData.tourismCertificate || existingApplication?.trainingCertificate) && (

                  <span className="selected-file">
                    ✓{" "}
                    {documentData.tourismCertificate?.name ||
                      existingApplication.trainingCertificate.split(/[\\/]/).pop()}
                  </span>

                )}

              </div>


              {/* IITFC PORTAL REGISTRATION PROOF */}

              <div className="document-field">
                <div className="document-heading">
                  <div>
                    <strong>IITFC Portal Registration Proof</strong>
                    <p>Registration confirmation or learner ID evidence</p>
                  </div>
                  <span className="required-badge">
                    {existingApplication?.iitfcRegistrationProof ? "On file" : "Optional"}
                  </span>
                </div>
                <input
                  type="file"
                  name="iitfcRegistrationProof"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                {(documentData.iitfcRegistrationProof || existingApplication?.iitfcRegistrationProof) && (
                  <span className="selected-file">
                    ✓ {documentData.iitfcRegistrationProof?.name ||
                      existingApplication.iitfcRegistrationProof.split(/[\\/]/).pop()}
                  </span>
                )}
              </div>


              {/* IITFC MODULE COMPLETION CERTIFICATE */}

              <div className="document-field">
                <div className="document-heading">
                  <div>
                    <strong>Seven-Module Completion Certificate</strong>
                    <p>Proof of completion for all seven online learning modules</p>
                  </div>
                  <span className="required-badge">
                    {existingApplication?.moduleCompletionCertificate ? "On file" : "Optional"}
                  </span>
                </div>
                <input
                  type="file"
                  name="moduleCompletionCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                {(documentData.moduleCompletionCertificate || existingApplication?.moduleCompletionCertificate) && (
                  <span className="selected-file">
                    ✓ {documentData.moduleCompletionCertificate?.name ||
                      existingApplication.moduleCompletionCertificate.split(/[\\/]/).pop()}
                  </span>
                )}
              </div>


              {/* NCHMCT EXAM RESULT */}

              <div className="document-field">
                <div className="document-heading">
                  <div>
                    <strong>NCHMCT Examination Result</strong>
                    <p>Exam result or pass certificate</p>
                  </div>
                  <span className="required-badge">
                    {existingApplication?.nchmctExamCertificate ? "On file" : "Optional"}
                  </span>
                </div>
                <input
                  type="file"
                  name="nchmctExamCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                {(documentData.nchmctExamCertificate || existingApplication?.nchmctExamCertificate) && (
                  <span className="selected-file">
                    ✓ {documentData.nchmctExamCertificate?.name ||
                      existingApplication.nchmctExamCertificate.split(/[\\/]/).pop()}
                  </span>
                )}
              </div>


              {/* COMMUNICATION SEMINAR CERTIFICATE */}

              <div className="document-field">
                <div className="document-heading">
                  <div>
                    <strong>Communication Seminar Certificate</strong>
                    <p>Proof of completion or attendance for the seven-day seminar</p>
                  </div>
                  <span className="required-badge">
                    {existingApplication?.communicationSeminarCertificate ? "On file" : "Optional"}
                  </span>
                </div>
                <input
                  type="file"
                  name="communicationSeminarCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                {(documentData.communicationSeminarCertificate || existingApplication?.communicationSeminarCertificate) && (
                  <span className="selected-file">
                    ✓ {documentData.communicationSeminarCertificate?.name ||
                      existingApplication.communicationSeminarCertificate.split(/[\\/]/).pop()}
                  </span>
                )}
              </div>


              {/* VERIFICATION VIDEO */}

              <div className="document-field">
                <div className="document-heading">
                  <div>
                    <strong>Verification Video</strong>
                    <p>MP4 video file, up to 5 MB</p>
                  </div>
                  <span className="required-badge">
                    {existingApplication?.verificationVideo ? "On file" : "Optional"}
                  </span>
                </div>
                <input
                  type="file"
                  name="verificationVideo"
                  accept=".mp4,video/mp4"
                  onChange={handleFileChange}
                />
                {(documentData.verificationVideo || existingApplication?.verificationVideo) && (
                  <span className="selected-file">
                    ✓ {documentData.verificationVideo?.name ||
                      existingApplication.verificationVideo.split(/[\\/]/).pop()}
                  </span>
                )}
              </div>


              {/* POLICE CERTIFICATE */}

              <div className="document-field">

                <div className="document-heading">

                  <div>

                    <strong>
                      Police / Background Certificate
                    </strong>

                    <p>
                      Background verification
                      certificate
                    </p>

                  </div>

                  <span className="required-badge">
                    {existingApplication?.policeCertificate ? "On file" : "Required"}
                  </span>

                </div>


                <input
                  type="file"
                  name="policeCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                />


                {(documentData.policeCertificate || existingApplication?.policeCertificate) && (

                  <span className="selected-file">
                    ✓{" "}
                    {documentData.policeCertificate?.name ||
                      existingApplication.policeCertificate.split(/[\\/]/).pop()}
                  </span>

                )}

              </div>


              {/* MEDICAL CERTIFICATE */}

              <div className="document-field">

                <div className="document-heading">

                  <div>

                    <strong>
                      Medical Fitness Certificate
                    </strong>

                    <p>
                      Certificate confirming
                      medical fitness
                    </p>

                  </div>

                  <span className="required-badge">
                    {existingApplication?.medicalCertificate ? "On file" : "Required"}
                  </span>

                </div>


                <input
                  type="file"
                  name="medicalCertificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                />


                {(documentData.medicalCertificate || existingApplication?.medicalCertificate) && (

                  <span className="selected-file">
                    ✓{" "}
                    {documentData.medicalCertificate?.name ||
                      existingApplication.medicalCertificate.split(/[\\/]/).pop()}
                  </span>

                )}

              </div>


              {/* PASSPORT PHOTO */}

              <div className="document-field">

                <div className="document-heading">

                  <div>

                    <strong>
                      Passport Photograph
                    </strong>

                    <p>
                      Recent passport-size
                      photograph
                    </p>

                  </div>

                  <span className="required-badge">
                    {existingApplication?.passportPhoto ? "On file" : "Required"}
                  </span>

                </div>


                <input
                  type="file"
                  name="passportPhoto"
                  accept=".jpg,.jpeg,.png"
                  onChange={
                    handleFileChange
                  }
                />


                {(documentData.passportPhoto || existingApplication?.passportPhoto) && (

                  <span className="selected-file">
                    ✓{" "}
                    {documentData.passportPhoto?.name ||
                      existingApplication.passportPhoto.split(/[\\/]/).pop()}
                  </span>

                )}

              </div>

            </div>


            <div className="document-note">

              <div className="document-note-icon">
                i
              </div>

              <div>

                <strong>
                  Upload Guidelines
                </strong>

                <p>
                  Accepted formats: PDF, JPG,
                  JPEG and PNG. Upload clear and
                  readable documents. The licensing
                  officer may reject documents that
                  are unclear, expired or do not match
                  the information provided in the
                  application.
                </p>

              </div>

            </div>


            <div className="application-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setCurrentStep(2);
                  scrollTop();
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="next-button"
                onClick={handleReview}
              >
                Review Application →
              </button>

            </div>

          </section>

        )}


        {/* ====================================
            STEP 4
        ==================================== */}

        {currentStep === 4 && (

          <section className="application-card">

            <div className="application-card-heading">

              <div>

                <span>
                  SECTION 04
                </span>

                <h3>
                  Review & Submit
                </h3>

              </div>

              <p>
                Step 4 of 4
              </p>

            </div>


            <div className="review-info">

              <strong>
                Review your application
              </strong>

              <p>
                Please carefully verify all the
                information before submitting your
                application. Once submitted, the
                application will be forwarded to the
                licensing officer for verification.
              </p>

            </div>


            {/* ==================================
                REVIEW PERSONAL INFORMATION
            ================================== */}

            <div className="review-section">

              <div className="review-section-heading">

                <div>

                  <span>
                    SECTION 01
                  </span>

                  <h4>
                    Personal Information
                  </h4>

                </div>


                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    scrollTop();
                  }}
                >
                  Edit
                </button>

              </div>


              <div className="review-grid">

                <div>

                  <span>
                    Full Name
                  </span>

                  <strong>
                    {
                      personalData.fullName ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Date of Birth
                  </span>

                  <strong>
                    {
                      personalData.dateOfBirth ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Gender
                  </span>

                  <strong>
                    {getGenderLabel(
                      personalData.gender
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Mobile
                  </span>

                  <strong>
                    {
                      personalData.mobile ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Email
                  </span>

                  <strong>
                    {
                      personalData.email ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    District
                  </span>

                  <strong>
                    {
                      personalData.district ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div className="review-full-width">

                  <span>
                    Residential Address
                  </span>

                  <strong>
                    {
                      personalData.address ||
                      "Not provided"
                    }
                  </strong>

                </div>

              </div>

            </div>


            {/* ==================================
                REVIEW ELIGIBILITY
            ================================== */}

            <div className="review-section">

              <div className="review-section-heading">

                <div>

                  <span>
                    SECTION 02
                  </span>

                  <h4>
                    Eligibility Information
                  </h4>

                </div>


                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    scrollTop();
                  }}
                >
                  Edit
                </button>

              </div>


              <div className="review-grid">

                <div>

                  <span>
                    Educational Qualification
                  </span>

                  <strong>

                    {getQualificationLabel(
                      eligibilityData
                        .qualification
                    )}

                    {" - "}

                    {
                      eligibilityData
                        .qualificationDetails ||
                      "Details not provided"
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    Tourism Training
                  </span>

                  <strong>
                    {getTrainingLabel(
                      eligibilityData
                        .tourismTraining
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Training Details
                  </span>

                  <strong>
                    {
                      eligibilityData
                        .trainingDetails ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Languages
                  </span>

                  <strong>
                    {
                      eligibilityData.languages ||
                      "Not provided"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Government ID
                  </span>

                  <strong>
                    {getGovernmentIdLabel(
                      eligibilityData
                        .governmentId
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Police Verification
                  </span>

                  <strong>
                    {getPoliceLabel(
                      eligibilityData
                        .policeVerification
                    )}
                  </strong>

                </div>


                <div className="review-full-width">

                  <span>
                    Medical Fitness
                  </span>

                  <strong>
                    {getMedicalLabel(
                      eligibilityData
                        .medicalFitness
                    )}
                  </strong>

                </div>

              </div>

            </div>


            {/* ==================================
                REVIEW DOCUMENTS
            ================================== */}

            <div className="review-section">

              <div className="review-section-heading">

                <div>

                  <span>
                    SECTION 03
                  </span>

                  <h4>
                    Supporting Documents
                  </h4>

                </div>


                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    scrollTop();
                  }}
                >
                  Edit
                </button>

              </div>


              <div className="review-documents">

                <div>

                  <span>
                    Government ID
                  </span>

                  <strong>
                    {
                      documentData
                        .governmentId
                        ? `✓ ${documentData.governmentId.name}`
                        : "Not uploaded"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Educational Certificate
                  </span>

                  <strong>
                    {
                      documentData
                        .educationCertificate
                        ? `✓ ${documentData.educationCertificate.name}`
                        : "Not uploaded"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Tourism Training Certificate
                  </span>

                  <strong>
                    {
                      documentData
                        .tourismCertificate
                        ? `✓ ${documentData.tourismCertificate.name}`
                        : "Not uploaded"
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    IITFC Portal Registration Proof
                  </span>

                  <strong>
                    {documentData.iitfcRegistrationProof?.name ||
                      existingApplication?.iitfcRegistrationProof?.split(/[\\/]/).pop() ||
                      "Not uploaded"}
                  </strong>

                </div>

                <div>

                  <span>
                    Seven-Module Completion Certificate
                  </span>

                  <strong>
                    {documentData.moduleCompletionCertificate?.name ||
                      existingApplication?.moduleCompletionCertificate?.split(/[\\/]/).pop() ||
                      "Not uploaded"}
                  </strong>

                </div>

                <div>

                  <span>
                    NCHMCT Examination Result
                  </span>

                  <strong>
                    {documentData.nchmctExamCertificate?.name ||
                      existingApplication?.nchmctExamCertificate?.split(/[\\/]/).pop() ||
                      "Not uploaded"}
                  </strong>

                </div>

                <div>

                  <span>
                    Communication Seminar Certificate
                  </span>

                  <strong>
                    {documentData.communicationSeminarCertificate?.name ||
                      existingApplication?.communicationSeminarCertificate?.split(/[\\/]/).pop() ||
                      "Not uploaded"}
                  </strong>

                </div>

                <div>

                  <span>
                    Verification Video
                  </span>

                  <strong>
                    {documentData.verificationVideo?.name ||
                      existingApplication?.verificationVideo?.split(/[\\/]/).pop() ||
                      "Not uploaded"}
                  </strong>

                </div>


                <div>

                  <span>
                    Police / Background Certificate
                  </span>

                  <strong>
                    {
                      documentData
                        .policeCertificate
                        ? `✓ ${documentData.policeCertificate.name}`
                        : "Not uploaded"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Medical Fitness Certificate
                  </span>

                  <strong>
                    {
                      documentData
                        .medicalCertificate
                        ? `✓ ${documentData.medicalCertificate.name}`
                        : "Not uploaded"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Passport Photograph
                  </span>

                  <strong>
                    {
                      documentData
                        .passportPhoto
                        ? `✓ ${documentData.passportPhoto.name}`
                        : "Not uploaded"
                    }
                  </strong>

                </div>

              </div>

            </div>


            {/* ==================================
                OFFICER REVIEW NOTICE
            ================================== */}

            <div className="officer-review-notice">

              <div className="officer-review-icon">
                !
              </div>


              <div>

                <strong>
                  Officer / Admin Review
                </strong>

                <p>
                  {existingApplication
                    ? "Your corrected application will be returned to the licensing officer for review."
                    : "After submission, your application will be forwarded to the licensing officer for eligibility and document verification."}
                </p>

              </div>

            </div>


            {/* ==================================
                ACTION BUTTONS
            ================================== */}

            <div className="application-actions">

              <button
                type="button"
                className="cancel-button"
                disabled={isSubmitting}
                onClick={() => {
                  setCurrentStep(3);
                  scrollTop();
                }}
              >
                ← Back
              </button>


              <button
                type="button"
                className="submit-application-button"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >

                {isSubmitting
                  ? existingApplication ? "Resubmitting..." : "Submitting..."
                  : existingApplication ? "Resubmit Application" : "Submit Application"}

              </button>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default Application;