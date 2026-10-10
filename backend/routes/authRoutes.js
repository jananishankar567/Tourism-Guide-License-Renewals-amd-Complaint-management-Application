const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Applicant = require("../models/Applicant");

const {
  sendEmail
} = require("../utils/emailService");

const router = express.Router();


// =====================================================
// APPLICANT REGISTRATION
// =====================================================

router.post("/register", async (req, res) => {

  try {

    const {
      fullName,
      email,
      mobile,
      password
    } = req.body;


    // Check required fields

    if (
      !fullName ||
      !email ||
      !mobile ||
      !password
    ) {

      return res.status(400).json({

        message:
          "All fields are required"

      });

    }


    // Normalize email

    const normalizedEmail =
      email.toLowerCase().trim();


    // Check existing email

    const existingEmail =
      await Applicant.findOne({

        email: normalizedEmail

      });


    if (existingEmail) {

      return res.status(409).json({

        message:
          "An account with this email already exists"

      });

    }


    // Check existing mobile

    const existingMobile =
      await Applicant.findOne({

        mobile: mobile

      });


    if (existingMobile) {

      return res.status(409).json({

        message:
          "An account with this mobile number already exists"

      });

    }


    // Hash password

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    // Create applicant

    const applicant =
      new Applicant({

        fullName,

        email: normalizedEmail,

        mobile,

        password: hashedPassword

      });


    // Save applicant

    await applicant.save();


    // =================================================
    // SEND SIGNUP EMAIL
    // =================================================

    await sendEmail({

      to: applicant.email,

      subject:
        "Welcome to Tourism Guide Licensing Portal",

      title:
        "Account Registration Successful",

      greeting:
        `Dear ${applicant.fullName},`,

      message:
        "Your applicant account has been successfully created in the Tourism Guide Licensing Portal. You can now log in and access the available licensing services.",

      details: [

        {
          label:
            "Applicant Name",

          value:
            applicant.fullName
        },

        {
          label:
            "Registered Email",

          value:
            applicant.email
        },

        {
          label:
            "Mobile Number",

          value:
            applicant.mobile
        },

        {
          label:
            "Account Status",

          value:
            "Active"
        }

      ],

      status:
        "Account Created"

    });


    // Send response

    res.status(201).json({

      message:
        "Applicant account created successfully",

      applicant: {

        id:
          applicant._id,

        fullName:
          applicant.fullName,

        email:
          applicant.email,

        mobile:
          applicant.mobile

      }

    });

  }

  catch (error) {

    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({

      message:
        "Server error while creating applicant account"

    });

  }

});


// =====================================================
// APPLICANT LOGIN
// =====================================================

router.post("/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    // Check required fields

    if (
      !email ||
      !password
    ) {

      return res.status(400).json({

        message:
          "Email and password are required"

      });

    }


    // Normalize email

    const normalizedEmail =
      email.toLowerCase().trim();


    // Find applicant

    const applicant =
      await Applicant.findOne({

        email: normalizedEmail

      });


    // Check applicant

    if (!applicant) {

      return res.status(401).json({

        message:
          "Invalid email or password"

      });

    }


    // Check password

    const passwordMatch =
      await bcrypt.compare(

        password,

        applicant.password

      );


    if (!passwordMatch) {

      return res.status(401).json({

        message:
          "Invalid email or password"

      });

    }


    // =================================================
    // CREATE JWT TOKEN
    // =================================================

    const token =
      jwt.sign(

        {

          applicantId:
            applicant._id,

          email:
            applicant.email,

          accountType:
            applicant.accountType || "Guide"

        },

        process.env.JWT_SECRET,

        {

          expiresIn:
            "1d"

        }

      );


    // =================================================
    // SEND LOGIN EMAIL
    // =================================================

    await sendEmail({

      to:
        applicant.email,

      subject:
        "Successful Login - Tourism Guide Licensing Portal",

      title:
        "Login Successful",

      greeting:
        `Dear ${applicant.fullName},`,

      message:
        "A successful login to your Tourism Guide Licensing Portal account has been detected.",

      details: [

        {

          label:
            "Applicant Name",

          value:
            applicant.fullName

        },

        {

          label:
            "Registered Email",

          value:
            applicant.email

        },

        {

          label:
            "Login Status",

          value:
            "Successful"

        }

      ],

      status:
        "Login Successful"

    });


    // =================================================
    // SEND LOGIN RESPONSE
    // =================================================

    res.status(200).json({

      message:
        "Login successful",

      token,

      applicant: {

        id:
          applicant._id,

        fullName:
          applicant.fullName,

        email:
          applicant.email,

        mobile:
          applicant.mobile,

        accountType:
          applicant.accountType || "Guide"

      }

    });

  }

  catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({

      message:
        "Server error during login"

    });

  }

});


module.exports = router;