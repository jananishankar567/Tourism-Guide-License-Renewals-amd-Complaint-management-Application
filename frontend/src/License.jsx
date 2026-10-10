
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./License.css";

function License() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passportPhotoUrl, setPassportPhotoUrl] = useState("");
  const [passportPhotoError, setPassportPhotoError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
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
            data.message || "Failed to fetch application"
          );
        }

        // Backend returns the application object directly
        setApplication(data);
      } catch (err) {
        console.error("License loading error:", err);
        setError(
          err.message || "Unable to load license information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, []);

  useEffect(() => {
    const photoPath = application?.passportPhoto;
    if (!photoPath) {
      setPassportPhotoUrl("");
      setPassportPhotoError(false);
      return undefined;
    }

    const filename = photoPath.replace(/\\/g, "/").split("/").pop();
    const token = localStorage.getItem("token");
    if (!filename || !token) {
      setPassportPhotoError(true);
      return undefined;
    }

    const controller = new AbortController();
    let objectUrl = "";
    setPassportPhotoUrl("");
    setPassportPhotoError(false);

    const fetchPassportPhoto = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/files/${encodeURIComponent(filename)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          throw new Error(`Passport photo request failed (${response.status}).`);
        }

        const photoBlob = await response.blob();
        if (!photoBlob.type.startsWith("image/")) {
          throw new Error("The uploaded passport photo is not a valid image.");
        }

        objectUrl = URL.createObjectURL(photoBlob);
        setPassportPhotoUrl(objectUrl);
      } catch (photoRequestError) {
        if (photoRequestError.name !== "AbortError") {
          console.error("Passport photo loading error:", photoRequestError);
          setPassportPhotoError(true);
        }
      }
    };

    fetchPassportPhoto();
    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [application?.passportPhoto]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     DOWNLOAD LICENSE
  ========================================================= */

  const downloadLicense = async () => {
    const licenseCard =
      document.getElementById("digital-license");

    if (!licenseCard || !application) {
      alert("License is not ready for download.");
      return;
    }

    try {
      setDownloading(true);

      /*
       * Give the browser a moment to make sure
       * images and QR code are completely rendered.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      const canvas = await html2canvas(licenseCard, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imageData =
        canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 297;
      const pageHeight = 210;

      const margin = 15;

      const availableWidth =
        pageWidth - margin * 2;

      const availableHeight =
        pageHeight - margin * 2;

      const imageRatio =
        canvas.width / canvas.height;

      let imageWidth = availableWidth;
      let imageHeight =
        imageWidth / imageRatio;

      /*
       * Make sure the license does not
       * overflow the A4 page.
       */
      if (imageHeight > availableHeight) {
        imageHeight = availableHeight;
        imageWidth =
          imageHeight * imageRatio;
      }

      const x =
        (pageWidth - imageWidth) / 2;

      const y =
        (pageHeight - imageHeight) / 2;

      pdf.addImage(
        imageData,
        "PNG",
        x,
        y,
        imageWidth,
        imageHeight
      );

      const licenseNumber =
        application.licenseNumber || "License";

      pdf.save(
        `Tourism_Guide_License_${licenseNumber}.pdf`
      );
    } catch (error) {
      console.error(
        "License download error:",
        error
      );

      alert(
        "Unable to download the license. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="license-page">
        <div className="license-loading">
          <div className="loading-spinner"></div>

          <p>
            Loading your digital license...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="license-page">
        <div className="license-error">

          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load License
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  /* =========================================================
     NO APPLICATION
  ========================================================= */

  if (!application) {
    return (
      <div className="license-page">
        <div className="license-error">

          <div className="error-icon">
            📄
          </div>

          <h2>
            License Not Available
          </h2>

          <p>
            No application information was found
            for your account.
          </p>

        </div>
      </div>
    );
  }

  const isApproved =
    application.applicationStatus ===
    "Approved";

  const verificationUrl =
    application.licenseNumber
      ? `${window.location.origin}/verify-license/${application.licenseNumber}`
      : "";

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="license-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      {/* <div className="license-header">

        <div>
          <p className="license-header-label">
            TOURISM GUIDE PORTAL
          </p>

          <h1>
            Digital Guide License
          </h1>

          <p>
            Official digital license issued through
            the Tourism Guide Management Portal
          </p>
        </div>

        <div className="license-status">

          <span
            className={
              isApproved
                ? "status-dot active"
                : "status-dot"
            }
          ></span>

          {isApproved
            ? "VALID LICENSE"
            : application.applicationStatus}

        </div>

      </div> */}
      
<div className="license-header">
  <div>
    <p className="license-header-label">
      TOURISM GUIDE PORTAL
    </p>

    <h1>Digital Guide License</h1>

    <p>
      Official digital license issued through the
      Tourism Guide Management Portal
    </p>
  </div>

  <div className="license-header-actions">
    <button
      type="button"
      className="back-dashboard-btn"
      onClick={() => navigate("/dashboard")}
    >
      ← Back to Dashboard
    </button>

    <div className="license-status">
      <span
        className={
          isApproved ? "status-dot active" : "status-dot"
        }
      ></span>

      {isApproved
        ? "VALID LICENSE"
        : application.applicationStatus}
    </div>
  </div>
</div>


      {/* =====================================================
          DIGITAL LICENSE CARD
      ===================================================== */}

      <div
        className="digital-license-card"
        id="digital-license"
      >

        {/* ===================================================
            LICENSE HEADER
        =================================================== */}

        <div className="license-card-top">

          <div className="government-symbol">
            TG
          </div>

          <div className="license-title">

            <span>
              GOVERNMENT OF TOURISM
            </span>

            <h2>
              TOURIST GUIDE LICENSE
            </h2>

          </div>

          <div className="license-card-badge">
            DIGITAL
          </div>

        </div>


        {/* ===================================================
            LICENSE MAIN BODY
        =================================================== */}

        <div className="license-card-body">

          {/* ================================================
              PHOTO
          ================================================= */}

          <div className="license-photo-section">

            <div className="license-photo">

              {passportPhotoUrl && !passportPhotoError ? (
                <img
                  src={passportPhotoUrl}
                  alt="Tourist Guide"
                />
              ) : (
                <div className="photo-placeholder">
                  👤
                </div>
              )}

            </div>

            <span>
              AUTHORIZED GUIDE
            </span>

          </div>


          {/* ================================================
              GUIDE INFORMATION
          ================================================= */}

          <div className="guide-information">

            {/* Full Name */}

            <div className="info-group">

              <span className="info-label">
                FULL NAME
              </span>

              <strong>
                {application.fullName ||
                  "N/A"}
              </strong>

            </div>


            {/* License Number */}

            <div className="info-group">

              <span className="info-label">
                LICENSE NUMBER
              </span>

              <strong className="license-number">
                {application.licenseNumber ||
                  "Not Issued"}
              </strong>

            </div>


            {/* DOB + Gender */}

            <div className="info-row">

              <div className="info-group">

                <span className="info-label">
                  DATE OF BIRTH
                </span>

                <strong>
                  {formatDate(
                    application.dateOfBirth
                  )}
                </strong>

              </div>


              <div className="info-group">

                <span className="info-label">
                  GENDER
                </span>

                <strong>
                  {application.gender ||
                    "N/A"}
                </strong>

              </div>

            </div>


            {/* Languages + Qualification */}

            <div className="info-row">

              <div className="info-group">

                <span className="info-label">
                  LANGUAGES
                </span>

                <strong>
                  {application.languagesKnown ||
                    "N/A"}
                </strong>

              </div>


              <div className="info-group">

                <span className="info-label">
                  QUALIFICATION
                </span>

                <strong>
                  {application.educationalQualification ||
                    "N/A"}
                </strong>

              </div>

            </div>

          </div>


          {/* ================================================
              QR CODE
          ================================================= */}

          <div className="qr-section">

            {verificationUrl ? (
              <>
                <div className="qr-container">

                  <QRCodeSVG
                    value={verificationUrl}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />

                </div>

                <span className="qr-title">
                  SCAN TO VERIFY
                </span>

                <span className="qr-subtitle">
                  Official License Verification
                </span>
              </>
            ) : (
              <div className="qr-unavailable">
                QR unavailable
              </div>
            )}

          </div>

        </div>


        {/* ===================================================
            LICENSE DETAILS
        ===================================================== */}

        <div className="license-details">

          <div className="detail-item">

            <span>
              ISSUE DATE
            </span>

            <strong>
              {formatDate(
                application.licenseIssueDate
              )}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              EXPIRY DATE
            </span>

            <strong>
              {formatDate(
                application.licenseExpiryDate
              )}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              LICENSE STATUS
            </span>

            <strong
              className={
                isApproved
                  ? "valid-text"
                  : "status-text"
              }
            >
              {isApproved
                ? "ACTIVE"
                : application.applicationStatus}
            </strong>

          </div>

        </div>


        {/* ===================================================
            LICENSE FOOTER
        ===================================================== */}

        <div className="license-card-footer">

          <div>

            <strong>
              Tourism Guide Management Portal
            </strong>

            <span>
              Digitally generated license
            </span>

          </div>

          <div className="footer-note">
            This digital license can be verified
            using the QR code.
          </div>

        </div>

      </div>


      {/* =====================================================
          DOWNLOAD BUTTON
      ===================================================== */}

      <div className="license-actions">

        <button
          className="download-license-btn"
          onClick={downloadLicense}
          disabled={downloading}
        >

          {downloading
            ? "Preparing License..."
            : "↓ Download License"}

        </button>

      </div>


      {/* =====================================================
          INFORMATION CARD
      ===================================================== */}

      <div className="license-information">

        <div className="information-icon">
          ✓
        </div>

        <div>

          <h3>
            Digital License Verification
          </h3>

          <p>
            This license is digitally generated
            and can be verified by scanning the
            QR code. The verification page
            displays the authenticity and current
            validity of the license.
          </p>

        </div>

      </div>

    </div>
  );
}

export default License;