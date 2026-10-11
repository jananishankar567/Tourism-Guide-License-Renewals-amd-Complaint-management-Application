const nodemailer = require("nodemailer");


// =====================================================
// CREATE EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });


// =====================================================
// VERIFY EMAIL CONFIGURATION
// =====================================================

const verifyEmailConfiguration = async () => {
  try {

    await transporter.verify();

    console.log("Email service connected successfully");

  } catch (error) {

    console.error(
      "Email configuration error:",
      error.message
    );

  }
};


// =====================================================
// PROFESSIONAL EMAIL TEMPLATE
// =====================================================

const emailTemplate = ({
  title,
  greeting,
  message,
  details = [],
  status,
  remarks
}) => {

  const detailRows = details
    .map(
      (detail) => `
        <tr>

          <td style="
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #374151;
            width: 35%;
          ">
            ${escapeHtml(detail.label)}
          </td>

          <td style="
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
          ">
            ${escapeHtml(detail.value)}
          </td>

        </tr>
      `
    )
    .join("");


  return `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>${escapeHtml(title)}</title>

</head>


<body style="
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
  font-family: Arial, Helvetica, sans-serif;
">


  <div style="
    max-width: 680px;
    margin: 30px auto;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
  ">


    <!-- HEADER -->

    <div style="
      background-color: #12355b;
      padding: 24px 30px;
      color: #ffffff;
    ">

      <h1 style="
        margin: 0;
        font-size: 22px;
        font-weight: 600;
      ">
        Tourism Guide Licensing Portal
      </h1>


      <p style="
        margin: 6px 0 0;
        font-size: 13px;
        color: #dbeafe;
      ">
        License Application, Renewal and Complaint Management System
      </p>

    </div>


    <!-- CONTENT -->

    <div style="padding: 30px;">


      <h2 style="
        margin-top: 0;
        color: #1f2937;
        font-size: 20px;
      ">
        ${escapeHtml(title)}
      </h2>


      <p style="
        color: #374151;
        font-size: 15px;
        line-height: 1.6;
      ">
        ${escapeHtml(greeting)}
      </p>


      <p style="
        color: #4b5563;
        font-size: 15px;
        line-height: 1.7;
      ">
        ${escapeHtml(message)}
      </p>


      ${
        status
          ? `
            <div style="
              margin: 22px 0;
              padding: 14px 18px;
              background-color: #f3f4f6;
              border-left: 4px solid #12355b;
            ">

              <strong style="color: #374151;">
                Current Status:
              </strong>

              <span style="
                color: #12355b;
                font-weight: 600;
              ">
                ${escapeHtml(status)}
              </span>

            </div>
          `
          : ""
      }


      ${
        details.length > 0
          ? `
            <table style="
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 14px;
            ">

              ${detailRows}

            </table>
          `
          : ""
      }


      ${
        remarks
          ? `
            <div style="
              margin-top: 20px;
              padding: 16px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
            ">

              <p style="
                margin: 0 0 8px;
                font-weight: 600;
                color: #374151;
              ">
                Officer Remarks
              </p>


              <p style="
                margin: 0;
                color: #4b5563;
                line-height: 1.6;
              ">
                ${escapeHtml(remarks)}
              </p>

            </div>
          `
          : ""
      }


      <p style="
        margin-top: 28px;
        color: #4b5563;
        font-size: 14px;
        line-height: 1.6;
      ">
        Please log in to the Tourism Guide Licensing Portal
        to view the complete details and take any required action.
      </p>


    </div>


    <!-- FOOTER -->

    <div style="
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 20px 30px;
      text-align: center;
    ">

      <p style="
        margin: 0;
        color: #6b7280;
        font-size: 12px;
      ">
        This is an automated email notification.
        Please do not reply to this email.
      </p>


      <p style="
        margin: 8px 0 0;
        color: #9ca3af;
        font-size: 12px;
      ">
        Tourism Guide Licensing Portal
      </p>

    </div>


  </div>

</body>

</html>
`;
};


// =====================================================
// SEND EMAIL
// =====================================================

const sendEmail = async ({
  to,
  subject,
  title,
  greeting,
  message,
  details = [],
  status,
  remarks
}) => {

  try {

    if (!to) {
      throw new Error(
        "Recipient email address is required"
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error(
        "Email service is not configured; set EMAIL_USER and EMAIL_PASS"
      );
    }


    const html = emailTemplate({

      title,
      greeting,
      message,
      details,
      status,
      remarks

    });


    const mailOptions = {

      from:
        `"Tourism Guide Licensing Portal - No Reply" <${process.env.EMAIL_USER}>`,

      to,

      subject,

      html

    };


    const info =
      await transporter.sendMail(mailOptions);


    console.log(
      `Email sent successfully to ${to}`
    );


    console.log(
      `Message ID: ${info.messageId}`
    );


    return {

      success: true,

      messageId: info.messageId

    };

  } catch (error) {

    console.error(
      `Email sending failed to ${to}:`,
      error.message
    );


    return {

      success: false,

      error: error.message

    };

  }
};

const sendEmailInBackground = (emailOptions, eventName) => {
  setImmediate(() => {
    void sendEmail(emailOptions).then((result) => {
      if (!result.success) {
        console.error(`${eventName} email was not sent:`, result.error);
      }
    }).catch((error) => {
      console.error(`${eventName} email dispatch error:`, error);
    });
  });
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

  sendEmail,

  sendEmailInBackground,

  verifyEmailConfiguration

};