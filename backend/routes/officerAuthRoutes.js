const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Officer = require("../models/Officer");

const router = express.Router();

// =====================================================
// OFFICER / ADMIN LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find officer/admin
    const officer = await Officer.findOne({
      email: normalizedEmail
    });

    if (!officer) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Check account status
    if (officer.status !== "Active") {
      return res.status(403).json({
        message: "This officer account is inactive"
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      officer.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        officerId: officer._id,
        email: officer.email,
        role: officer.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    // Send response
    res.status(200).json({
      message: "Officer login successful",

      token,

      officer: {
        id: officer._id,
        fullName: officer.fullName,
        email: officer.email,
        role: officer.role
      }
    });

  } catch (error) {
    console.error("Officer login error:", error);

    res.status(500).json({
      message: "Server error during officer login"
    });
  }
});

module.exports = router;