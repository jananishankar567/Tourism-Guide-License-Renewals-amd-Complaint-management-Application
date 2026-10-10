const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Officer = require("./models/Officer");

async function createAdmin() {
  try {
    const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME } =
      process.env;

    if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_FULL_NAME) {
      throw new Error(
        "Set MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_FULL_NAME before creating an admin."
      );
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const email = ADMIN_EMAIL.trim().toLowerCase();

    // Check whether admin already exists
    const existingAdmin = await Officer.findOne({ email });

    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin
    const admin = new Officer({
      fullName: ADMIN_FULL_NAME.trim(),
      email,
      password: hashedPassword,
      role: "Admin",
      status: "Active"
    });

    await admin.save();

    console.log("=================================");
    console.log("Admin account created successfully");
    console.log("Email:", email);
    console.log("Role:", admin.role);
    console.log("=================================");

  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();