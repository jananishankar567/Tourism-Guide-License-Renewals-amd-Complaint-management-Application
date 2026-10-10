const express = require("express");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");

const GuideApplication = require("../models/GuideApplication");
const authenticateApplicant = require("../middleware/authenticateApplicant");

const {
  authenticateOfficer,
  requireOfficer
} = require("../middleware/authMiddleware");

const {
  extractTextFromImage
} = require("../services/ocrService");

const router = express.Router();

/* =========================================================
   EMAIL CONFIGURATION
========================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/*
   Verify email configuration when the server starts
*/
transporter.verify((error) => {
  if (error) {
    console.log("Email configuration error:", error.message);
  } else {
    console.log("Email service is ready");
  }
});

/* =========================================================
   EMAIL SENDING FUNCTION
========================================================= */

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email credentials are missing in .env");
      return;
    }

    await transporter.sendMail({
      from: `"Tourism Guide Licensing Portal - No Reply" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    /*
      Email failure should not stop the application
      from being submitted or updated.
    */
    console.log("Failed to send email:", error.message);
  }
};

/* =========================================================
   COMMON EMAIL TEMPLATE
========================================================= */

const emailTemplate = (content) => {
  return `
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>
          Tourism Guide Licensing Portal
        </title>

      </head>

      <body
        style="
          margin:0;
          padding:0;
          background-color:#f4f7f8;
          font-family:Arial, Helvetica, sans-serif;
          color:#333333;
        "
      >

        <div
          style="
            width:100%;
            padding:35px 0;
            background-color:#f4f7f8;
          "
        >

          <div
            style="
              max-width:650px;
              margin:0 auto;
              background-color:#ffffff;
              border-radius:10px;
              overflow:hidden;
              box-shadow:0 2px 10px rgba(0,0,0,0.08);
            "
          >

            <!-- HEADER -->

            <div
              style="
                background-color:#0f766e;
                padding:24px 30px;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:22px;
                  font-weight:bold;
                  margin-bottom:5px;
                "
              >
                Tourism Guide Licensing Portal
              </div>

              <div
                style="
                  font-size:13px;
                  opacity:0.9;
                "
              >
                Automated System Notification
              </div>

            </div>


            <!-- CONTENT -->

            <div
              style="
                padding:30px;
                line-height:1.6;
                font-size:14px;
              "
            >

              ${content}

            </div>


            <!-- FOOTER -->

            <div
              style="
                background-color:#f8fafc;
                border-top:1px solid #e5e7eb;
                padding:20px 30px;
                text-align:center;
                font-size:12px;
                color:#6b7280;
                line-height:1.6;
              "
            >

              <div
                style="
                  font-weight:bold;
                  color:#374151;
                  margin-bottom:5px;
                "
              >
                Tourism Guide Licensing Portal
              </div>

              <div>
                This is an automated email notification.
              </div>

              <div>
                Please do not reply to this email.
              </div>

            </div>

          </div>

        </div>

      </body>

    </html>
  `;
};


/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    cb(null, path.join(__dirname, "../uploads"));

  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);

  }

});


/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (allowedTypes.includes(file.mimetype)) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only PDF, JPG and PNG files are allowed"
      ),
      false
    );

  }

};


/* =========================================================
   MULTER INSTANCE
========================================================= */

const upload = multer({

  storage: storage,

  fileFilter: fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024
  }

});


/* =========================================================
   SUBMIT LICENSE APPLICATION
========================================================= */

router.post(
  "/",

  authenticateApplicant,

  upload.fields([
    {
      name: "governmentIdDocument",
      maxCount: 1
    },
    {
      name: "educationalCertificate",
      maxCount: 1
    },
    {
      name: "trainingCertificate",
      maxCount: 1
    },
    {
      name: "policeCertificate",
      maxCount: 1
    },
    {
      name: "medicalCertificate",
      maxCount: 1
    },
    {
      name: "passportPhoto",
      maxCount: 1
    }
  ]),

  async (req, res) => {

    try {

      const {
        applicationId,
        fullName,
        dateOfBirth,
        gender,
        phone,
        district,
        address,
        educationalQualification,
        tourismTraining,
        languagesKnown,
        identityProof
      } = req.body;

      const applicantEmail = req.applicant.email;
      const applicantFilter = {
        $or: [
          { applicantId: req.applicant.applicantId },
          {
            applicantId: { $exists: false },
            email: applicantEmail
          }
        ]
      };
      let existingApplication = null;

      if (applicationId) {
        existingApplication = await GuideApplication.findOne({
          _id: applicationId,
          ...applicantFilter
        });

        if (!existingApplication) {
          return res.status(404).json({
            message: "Application not found."
          });
        }

        if (!["Returned", "Rejected"].includes(existingApplication.applicationStatus)) {
          return res.status(409).json({
            message: "Only returned or rejected applications can be resubmitted."
          });
        }
      } else {
        const currentApplication = await GuideApplication.findOne(
          applicantFilter
        ).sort({ createdAt: -1 });

        if (currentApplication) {
          if (["Submitted", "Under Verification"].includes(currentApplication.applicationStatus)) {
            return res.status(400).json({
              message: "You already have an application under processing."
            });
          }

          if (currentApplication.applicationStatus === "Approved") {
            return res.status(400).json({
              message: "Your license application has already been approved."
            });
          }

          return res.status(409).json({
            message: "Please resubmit your existing returned or rejected application."
          });
        }
      }

      const uploadedDocuments = {
        governmentIdDocument: req.files?.governmentIdDocument?.[0],
        educationalCertificate: req.files?.educationalCertificate?.[0],
        trainingCertificate: req.files?.trainingCertificate?.[0],
        policeCertificate: req.files?.policeCertificate?.[0],
        medicalCertificate: req.files?.medicalCertificate?.[0],
        passportPhoto: req.files?.passportPhoto?.[0]
      };
      const documentFields = Object.keys(uploadedDocuments);
      const missingDocuments = documentFields.filter(
        (field) =>
          !uploadedDocuments[field] &&
          !existingApplication?.[field]
      );

      if (missingDocuments.length) {
        return res.status(400).json({
          message: "All required documents must be available before submission."
        });
      }

      const applicationData = {
        fullName,
        dateOfBirth,
        gender,
        email: applicantEmail,
        applicantId: req.applicant.applicantId,
        phone,
        district,
        address,
        educationalQualification,
        tourismTraining,
        languagesKnown,
        identityProof,
        applicationStatus: "Submitted",
        ageVerified: false,
        educationVerified: false,
        tourismTrainingVerified: false,
        languageVerified: false,
        identityVerified: false,
        policeVerification: "Pending",
        medicalFitness: "Pending",
        officerRemarks: ""
      };

      for (const field of documentFields) {
        applicationData[field] = uploadedDocuments[field]
          ? `/uploads/${uploadedDocuments[field].filename}`
          : existingApplication[field];
      }

      let savedApplication;
      if (existingApplication) {
        savedApplication = await GuideApplication.findOneAndUpdate(
          {
            _id: existingApplication._id,
            ...applicantFilter,
            applicationStatus: { $in: ["Returned", "Rejected"] }
          },
          {
            $set: applicationData,
            $push: {
              history: {
                action: "Resubmitted",
                status: "Submitted",
                remarks: "",
                updatedBy: "Applicant",
                updatedAt: new Date()
              }
            },
            $unset: {
              licenseNumber: "",
              licenseIssueDate: "",
              licenseExpiryDate: ""
            }
          },
          { new: true, runValidators: true }
        );

        if (!savedApplication) {
          return res.status(409).json({
            message: "This application has already changed. Refresh and try again."
          });
        }
      } else {
        savedApplication = await new GuideApplication({
          ...applicationData,
          history: [{
            action: "Submitted",
            status: "Submitted",
            remarks: "",
            updatedBy: "Applicant"
          }]
        }).save();
      }
      const isResubmission = Boolean(existingApplication);


      /* =====================================================
         APPLICATION SUBMISSION EMAIL
      ===================================================== */

      const submissionEmail =
        emailTemplate(`

          <h2
            style="
              color:#0f766e;
              margin-top:0;
            "
          >
            ${isResubmission ? "Application Resubmission Confirmation" : "Application Submission Confirmation"}
          </h2>


          <p>
            Dear <strong>${fullName}</strong>,
          </p>


          <p>
            This is to confirm that your Tourism Guide
            License application has been successfully
            ${isResubmission ? "resubmitted for review" : "submitted"}
            through the Tourism Guide Licensing Portal.
          </p>


          <div
            style="
              background:#f8fafc;
              border:1px solid #e5e7eb;
              border-radius:8px;
              padding:20px;
              margin:20px 0;
            "
          >

            <div
              style="
                font-size:16px;
                font-weight:bold;
                color:#374151;
                margin-bottom:15px;
              "
            >
              Application Details
            </div>


            <table
              style="
                width:100%;
                border-collapse:collapse;
              "
            >

              <tr>

                <td
                  style="
                    padding:8px 0;
                    color:#6b7280;
                    width:40%;
                  "
                >
                  Application ID
                </td>

                <td
                  style="
                    padding:8px 0;
                    font-weight:bold;
                  "
                >
                  ${savedApplication._id}
                </td>

              </tr>


              <tr>

                <td
                  style="
                    padding:8px 0;
                    color:#6b7280;
                  "
                >
                  Applicant Name
                </td>

                <td
                  style="
                    padding:8px 0;
                    font-weight:bold;
                  "
                >
                  ${fullName}
                </td>

              </tr>


              <tr>

                <td
                  style="
                    padding:8px 0;
                    color:#6b7280;
                  "
                >
                  Application Status
                </td>

                <td
                  style="
                    padding:8px 0;
                  "
                >

                  <span
                    style="
                      background:#fef3c7;
                      color:#92400e;
                      padding:5px 12px;
                      border-radius:20px;
                      font-size:12px;
                      font-weight:bold;
                    "
                  >
                    Submitted
                  </span>

                </td>

              </tr>

            </table>

          </div>


          <p>
            Your application has been received and will be
            reviewed by the authorized officer.
          </p>


          <p>
            You will receive a further email notification
            when there is an update to your application
            status.
          </p>


          <p>
            Please retain your Application ID for future
            reference.
          </p>


          <p
            style="
              margin-top:25px;
            "
          >
            Regards,<br>

            <strong>
              Tourism Guide Licensing Portal
            </strong>
          </p>

        `);


      await sendEmail(
        applicantEmail,
        isResubmission
          ? "Tourism Guide License Application – Resubmission Confirmation"
          : "Tourism Guide License Application – Submission Confirmation",
        submissionEmail
      );


      /* -----------------------------------------------------
         RESPONSE
      ----------------------------------------------------- */

      res.status(isResubmission ? 200 : 201).json({

        message:
          isResubmission
            ? "Application resubmitted successfully"
            : "Application submitted successfully",

        application:
          savedApplication

      });


    } catch (error) {

      console.error(
        "Application submission error:",
        error
      );

      res.status(400).json({

        message:
          "Failed to submit application",

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   GET ALL APPLICATIONS
========================================================= */

router.get(
  "/",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {

    try {

      const applications =
        await GuideApplication.find()
          .sort({
            createdAt: -1
          });


      res.status(200).json(
        applications
      );


    } catch (error) {

      res.status(500).json({

        message:
          "Failed to fetch applications",

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   GET APPLICATION BY EMAIL
========================================================= */

router.get(
  "/mine",
  authenticateApplicant,
  async (req, res) => {
    try {
      const application = await GuideApplication.findOne({
        $or: [
          { applicantId: req.applicant.applicantId },
          {
            applicantId: { $exists: false },
            email: req.applicant.email
          }
        ]
      }).sort({ createdAt: -1 });

      if (!application) {
        return res.status(404).json({
          message: "No application found for your account."
        });
      }

      if (!application.applicantId) {
        application.applicantId = req.applicant.applicantId;
        await application.save({ validateModifiedOnly: true });
      }

      return res.status(200).json(application);
    } catch (error) {
      console.error("Fetch own application error:", error);
      return res.status(500).json({
        message: "Unable to fetch your application."
      });
    }
  }
);

router.get(
  "/by-email/:email",
  authenticateApplicant,
  async (req, res) => {

    try {

      const email =
        decodeURIComponent(
          req.params.email
        ).toLowerCase();

      if (email !== req.applicant.email) {
        return res.status(403).json({
          message: "You may only access your own application."
        });
      }

      const application =
        await GuideApplication.findOne({
          $or: [
            { applicantId: req.applicant.applicantId },
            {
              applicantId: { $exists: false },
              email
            }
          ]
        }).sort({
          createdAt: -1
        });


      if (!application) {

        return res.status(404).json({

          message:
            "No application found for this email"

        });

      }


      res.status(200).json(
        application
      );

    } catch (error) {

      res.status(500).json({

        message:
          "Failed to fetch application",

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   PUBLIC LICENSE VERIFICATION
========================================================= */

router.get(
  "/verify/:licenseNumber",

  async (req, res) => {

    try {

      const {
        licenseNumber
      } = req.params;


      const application =
        await GuideApplication.findOne({

          licenseNumber:
            licenseNumber.trim()

        });


      if (!application) {

        return res.status(404).json({

          valid: false,

          message:
            "License not found"

        });

      }


      const today =
        new Date();


      const isExpired =
        application.licenseExpiryDate &&
        new Date(
          application.licenseExpiryDate
        ) < today;


      const isValid =
        application.applicationStatus ===
          "Approved" &&
        !isExpired;


      return res.json({

        valid:
          isValid,

        license: {

          licenseNumber:
            application.licenseNumber,

          fullName:
            application.fullName,

          status:
            isExpired
              ? "Expired"
              : application.applicationStatus,

          issueDate:
            application.licenseIssueDate,

          expiryDate:
            application.licenseExpiryDate

        }

      });


    } catch (error) {

      console.error(
        "License verification error:",
        error
      );

      res.status(500).json({

        valid: false,

        message:
          "Unable to verify license"

      });

    }

  }
);


/* =========================================================
   OCR DOCUMENT VERIFICATION
   Officer/Admin only
========================================================= */

router.post(
  "/:id/ocr",

  authenticateOfficer,

  requireOfficer,

  async (req, res) => {

    try {

      const application =
        await GuideApplication.findById(
          req.params.id
        );


      if (!application) {

        return res.status(404).json({

          message:
            "Application not found"

        });

      }


      const {
        documentType
      } = req.body;


      /* -----------------------------------------------------
         ALLOWED DOCUMENTS
      ----------------------------------------------------- */

      const allowedDocuments = {

        governmentIdDocument:
          application.governmentIdDocument,

        educationalCertificate:
          application.educationalCertificate,

        trainingCertificate:
          application.trainingCertificate,

        policeCertificate:
          application.policeCertificate,

        medicalCertificate:
          application.medicalCertificate

      };


      if (
        !allowedDocuments[documentType]
      ) {

        return res.status(400).json({

          message:
            "Invalid document type"

        });

      }


      const relativePath =
        allowedDocuments[documentType];


      /*
        Stored paths normally look like:

        uploads/filename.jpg

        Convert Windows backslashes to
        forward slashes if necessary.
      */

      const normalizedPath =
        relativePath.replace(
          /\\/g,
          "/"
        );


      const filePath =
        path.join(
          __dirname,
          "..",
          normalizedPath
        );


      console.log(
        "OCR document:",
        documentType
      );

      console.log(
        "OCR file path:",
        filePath
      );


      /*
        Tesseract.js currently handles
        image files directly.

        PDF OCR will be added in the
        next step using PDF-to-image
        conversion.
      */

      const extension =
        path.extname(
          filePath
        ).toLowerCase();


      if (
        extension !== ".jpg" &&
        extension !== ".jpeg" &&
        extension !== ".png"
      ) {

        return res.status(400).json({

          message:
            "OCR currently supports JPG and PNG documents. PDF OCR will be enabled in the next step."

        });

      }


      const extractedText =
        await extractTextFromImage(
          filePath
        );


      res.status(200).json({

        message:
          "OCR completed successfully",

        documentType,

        extractedText

      });


    } catch (error) {

      console.error(
        "OCR processing error:",
        error
      );

      res.status(500).json({

        message:
          error.message ||
          "OCR processing failed"

      });

    }

  }
);


/* =========================================================
   GET APPLICATION BY ID
========================================================= */

router.get(
  "/:id",
  authenticateOfficer,
  requireOfficer,
  async (req, res) => {

    try {

      const application =
        await GuideApplication.findById(
          req.params.id
        );


      if (!application) {

        return res.status(404).json({

          message:
            "Application not found"

        });

      }


      res.status(200).json(
        application
      );


    } catch (error) {

      res.status(500).json({

        message:
          "Failed to fetch application",

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   OFFICER VERIFICATION
   Officer/Admin only
========================================================= */

router.put(
  "/:id/verify",

  authenticateOfficer,

  requireOfficer,

  async (req, res) => {

    try {

      const {

        ageVerified,

        educationVerified,

        tourismTrainingVerified,

        languageVerified,

        identityVerified,

        policeVerification,

        medicalFitness,

        officerRemarks

      } = req.body;


      const application =
        await GuideApplication.findById(
          req.params.id
        );


      if (!application) {

        return res.status(404).json({

          message:
            "Application not found"

        });

      }


      /* -----------------------------------------------------
         UPDATE VERIFICATION
      ----------------------------------------------------- */

      if (
        ageVerified !== undefined
      ) {

        application.ageVerified =
          ageVerified;

      }


      if (
        educationVerified !== undefined
      ) {

        application.educationVerified =
          educationVerified;

      }


      if (
        tourismTrainingVerified !== undefined
      ) {

        application.tourismTrainingVerified =
          tourismTrainingVerified;

      }


      if (
        languageVerified !== undefined
      ) {

        application.languageVerified =
          languageVerified;

      }


      if (
        identityVerified !== undefined
      ) {

        application.identityVerified =
          identityVerified;

      }


      if (
        policeVerification !== undefined
      ) {

        application.policeVerification =
          policeVerification;

      }


      if (
        medicalFitness !== undefined
      ) {

        application.medicalFitness =
          medicalFitness;

      }


      if (
        officerRemarks !== undefined
      ) {

        application.officerRemarks =
          officerRemarks;

      }


      /* -----------------------------------------------------
         CHANGE STATUS
      ----------------------------------------------------- */

      if (
        application.applicationStatus ===
        "Submitted"
      ) {

        application.applicationStatus =
          "Under Verification";

      }

      application.history.push({
        action: "Verification Updated",
        status: application.applicationStatus,
        remarks: officerRemarks || "",
        updatedBy: req.officer.role,
        verification: {
          ageVerified: application.ageVerified,
          educationVerified: application.educationVerified,
          tourismTrainingVerified: application.tourismTrainingVerified,
          languageVerified: application.languageVerified,
          identityVerified: application.identityVerified,
          policeVerification: application.policeVerification,
          medicalFitness: application.medicalFitness
        },
        updatedAt: new Date()
      });

      await application.save();


      res.status(200).json({

        message:
          "Application verification updated successfully",

        application

      });


    } catch (error) {

      res.status(400).json({

        message:
          "Failed to update verification",

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   OFFICER DECISION
   Officer/Admin only
========================================================= */

router.put(
  "/:id/decision",

  authenticateOfficer,

  requireOfficer,

  async (req, res) => {

    try {

      const {
        decision,
        officerRemarks
      } = req.body;


      /* -----------------------------------------------------
         VALIDATE DECISION
      ----------------------------------------------------- */

      if (
        ![
          "Approved",
          "Rejected",
          "Returned"
        ].includes(decision)
      ) {

        return res.status(400).json({

          message:
            "Invalid application decision"

        });

      }


      /* -----------------------------------------------------
         FIND APPLICATION
      ----------------------------------------------------- */

      const application =
        await GuideApplication.findById(
          req.params.id
        );


      if (!application) {

        return res.status(404).json({

          message:
            "Application not found"

        });

      }


      /* -----------------------------------------------------
         APPROVAL VALIDATION
      ----------------------------------------------------- */

      if (
        decision === "Approved"
      ) {

        const allVerified =

          application.ageVerified === true &&

          application.educationVerified === true &&

          application.tourismTrainingVerified === true &&

          application.languageVerified === true &&

          application.identityVerified === true &&

          application.policeVerification ===
            "Verified" &&

          application.medicalFitness ===
            "Fit";


        if (!allVerified) {

          return res.status(400).json({

            message:
              "Application cannot be approved. All eligibility and verification criteria must be completed."

          });

        }

      }


      /* -----------------------------------------------------
         UPDATE STATUS
      ----------------------------------------------------- */

      application.applicationStatus =
        decision;


      if (
        officerRemarks !== undefined
      ) {

        application.officerRemarks =
          officerRemarks;

      }

      application.history.push({
        action: "Decision",
        status: decision,
        remarks: officerRemarks || "",
        updatedBy: req.officer.role,
        updatedAt: new Date()
      });

      /* =====================================================
         GENERATE LICENSE
      ===================================================== */

      if (
        decision === "Approved"
      ) {

        /*
          Generate license only during
          the first approval.
        */

        if (
          !application.licenseNumber
        ) {

          const year =
            new Date().getFullYear();


          const randomNumber =
            Math.floor(
              10000 +
              Math.random() * 90000
            );


          application.licenseNumber =
            `TGL-${year}-${randomNumber}`;


          /* ISSUE DATE */

          const issueDate =
            new Date();


          application.licenseIssueDate =
            issueDate;


          /* EXPIRY DATE = 5 YEARS */

          const expiryDate =
            new Date(issueDate);


          expiryDate.setFullYear(
            expiryDate.getFullYear() + 5
          );


          expiryDate.setDate(
            expiryDate.getDate() - 1
          );


          application.licenseExpiryDate =
            expiryDate;

        }

      }


      await application.save();


      /* =====================================================
         DECISION EMAIL
      ===================================================== */

      let subject = "";

      let emailHTML = "";


      /* =====================================================
         APPROVED EMAIL
      ===================================================== */

      if (
        decision === "Approved"
      ) {

        const issueDate =
          application.licenseIssueDate
            ? new Date(
                application.licenseIssueDate
              ).toLocaleDateString(
                "en-IN"
              )
            : "N/A";


        const expiryDate =
          application.licenseExpiryDate
            ? new Date(
                application.licenseExpiryDate
              ).toLocaleDateString(
                "en-IN"
              )
            : "N/A";


        subject =
          "Tourism Guide License Application – Approved";


        emailHTML =
          emailTemplate(`

            <h2
              style="
                color:#15803d;
                margin-top:0;
              "
            >
              Application Approved
            </h2>


            <p>
              Dear
              <strong>
                ${application.fullName}
              </strong>,
            </p>


            <p>
              This is to inform you that your Tourism Guide
              License application has been successfully reviewed
              and approved by the authorized officer.
            </p>


            <div
              style="
                background:#f8fafc;
                border:1px solid #e5e7eb;
                border-radius:8px;
                padding:20px;
                margin:20px 0;
              "
            >

              <div
                style="
                  font-size:16px;
                  font-weight:bold;
                  margin-bottom:15px;
                  color:#374151;
                "
              >
                Application Details
              </div>


              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                "
              >

                <tr>

                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                    "
                  >
                    Application ID
                  </td>

                  <td
                    style="
                      padding:8px 0;
                      font-weight:bold;
                    "
                  >
                    ${application._id}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                    "
                  >
                    Applicant Name
                  </td>

                  <td
                    style="
                      padding:8px 0;
                      font-weight:bold;
                    "
                  >
                    ${application.fullName}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                    "
                  >
                    Application Status
                  </td>

                  <td
                    style="
                      padding:8px 0;
                    "
                  >

                    <span
                      style="
                        background:#dcfce7;
                        color:#166534;
                        padding:5px 12px;
                        border-radius:20px;
                        font-size:12px;
                        font-weight:bold;
                      "
                    >
                      Approved
                    </span>

                  </td>

                </tr>

              </table>

            </div>


            <div
              style="
                background:#f0fdfa;
                border:1px solid #99f6e4;
                border-radius:8px;
                padding:20px;
                margin:20px 0;
              "
            >

              <div
                style="
                  font-size:16px;
                  font-weight:bold;
                  color:#0f766e;
                  margin-bottom:15px;
                "
              >
                License Details
              </div>


              <table
                style="
                  width:100%;
                  border-collapse:collapse;
                "
              >

                <tr>

                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                    "
                  >
                    License Number
                  </td>

                  <td
                    style="
                      padding:8px 0;
                      font-weight:bold;
                    "
                  >
                    ${application.licenseNumber}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                    "
                  >
                    Issue Date
                  </td>

                  <td
                    style="
                      padding:8px 0;
                    "
                  >
                    ${issueDate}
                  </td>

                </tr>


                <tr>

                  <td
                    style="
                      padding:8px 0;
                      color:#6b7280;
                    "
                  >
                    Expiry Date
                  </td>

                  <td
                    style="
                      padding:8px 0;
                    "
                  >
                    ${expiryDate}
                  </td>

                </tr>

              </table>

            </div>


            <p>
              Your tourism guide license has now been approved.
              Please log in to the Tourism Guide Licensing Portal
              to view your license details and access available
              services.
            </p>


            <p>
              Please retain your License Number for future
              reference.
            </p>


            <p
              style="
                margin-top:25px;
              "
            >
              Regards,<br>

              <strong>
                Tourism Guide Licensing Portal
              </strong>
            </p>

          `);

      }


      /* =====================================================
         REJECTED EMAIL
      ===================================================== */

      else if (
        decision === "Rejected"
      ) {

        subject =
          "Tourism Guide License Application – Decision Notification";


        emailHTML =
          emailTemplate(`

            <h2
              style="
                color:#dc2626;
                margin-top:0;
              "
            >
              Application Decision Notification
            </h2>


            <p>
              Dear
              <strong>
                ${application.fullName}
              </strong>,
            </p>


            <p>
              This is to inform you that your Tourism Guide
              License application has been reviewed by the
              authorized officer and has not been approved.
            </p>


            <div
              style="
                background:#fef2f2;
                border:1px solid #fecaca;
                border-radius:8px;
                padding:20px;
                margin:20px 0;
              "
            >

              <div
                style="
                  font-weight:bold;
                  color:#991b1b;
                  margin-bottom:12px;
                "
              >
                Application Status
              </div>


              <div
                style="
                  color:#991b1b;
                  font-weight:bold;
                "
              >
                Rejected
              </div>

            </div>


            <p>
              <strong>Application ID:</strong>
              ${application._id}
            </p>


            <p>
              <strong>Officer Remarks:</strong>
            </p>


            <div
              style="
                background:#f9fafb;
                border-left:4px solid #dc2626;
                padding:15px;
                margin:10px 0 20px 0;
              "
            >
              ${
                application.officerRemarks ||
                "No remarks were provided."
              }
            </div>


            <p>
              Please log in to the portal to review the
              application details and officer remarks.
            </p>


            <p
              style="
                margin-top:25px;
              "
            >
              Regards,<br>

              <strong>
                Tourism Guide Licensing Portal
              </strong>
            </p>

          `);

      }


      /* =====================================================
         RETURNED EMAIL
      ===================================================== */

      else if (
        decision === "Returned"
      ) {

        subject =
          "Tourism Guide License Application – Action Required";


        emailHTML =
          emailTemplate(`

            <h2
              style="
                color:#d97706;
                margin-top:0;
              "
            >
              Action Required on Your Application
            </h2>


            <p>
              Dear
              <strong>
                ${application.fullName}
              </strong>,
            </p>


            <p>
              This is to inform you that your Tourism Guide
              License application has been returned by the
              authorized officer for correction or additional
              information.
            </p>


            <div
              style="
                background:#fffbeb;
                border:1px solid #fde68a;
                border-radius:8px;
                padding:20px;
                margin:20px 0;
              "
            >

              <div
                style="
                  font-weight:bold;
                  color:#92400e;
                  margin-bottom:10px;
                "
              >
                Application Status
              </div>


              <div
                style="
                  color:#92400e;
                  font-weight:bold;
                "
              >
                Returned
              </div>

            </div>


            <p>
              <strong>Application ID:</strong>
              ${application._id}
            </p>


            <p>
              <strong>Officer Remarks:</strong>
            </p>


            <div
              style="
                background:#f9fafb;
                border-left:4px solid #d97706;
                padding:15px;
                margin:10px 0 20px 0;
              "
            >
              ${
                application.officerRemarks ||
                "No remarks were provided."
              }
            </div>


            <p>
              Please log in to the Tourism Guide Licensing
              Portal and take the necessary action based on
              the officer's remarks.
            </p>


            <p
              style="
                margin-top:25px;
              "
            >
              Regards,<br>

              <strong>
                Tourism Guide Licensing Portal
              </strong>
            </p>

          `);

      }


      /* =====================================================
         SEND DECISION EMAIL
      ===================================================== */

      await sendEmail(
        application.email,
        subject,
        emailHTML
      );


      /* =====================================================
         RESPONSE
      ===================================================== */

      res.status(200).json({

        message:
          `Application ${decision.toLowerCase()} successfully`,

        application

      });


    } catch (error) {

      console.error(
        "Application decision error:",
        error
      );


      res.status(400).json({

        message:
          "Failed to update application decision",

        error:
          error.message

      });

    }

  }
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;