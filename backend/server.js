const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const applicationRoutes = require("./routes/applicationRoutes");
const renewalRoutes = require("./routes/renewalRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const officerAuthRoutes = require("./routes/officerAuthRoutes");
const adminApplicationRoutes = require("./routes/adminApplicationRoutes");
const adminLicenseRoutes = require("./routes/adminLicenseRoutes");
const adminReportRoutes = require("./routes/adminReportRoutes");
const fileRoutes = require("./routes/fileRoutes");
const profileRoutes = require("./routes/profile");
const tourismRoutes = require("./features/tourism/tourismRoutes");

const app = express();

// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

// =========================
// API ROUTES
// =========================

app.use("/api/files", fileRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/renewals", renewalRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/officer", officerAuthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tourism", tourismRoutes);

// Temporary profile test route
app.get("/api/profile-test", (req, res) => {
  res.json({
    message: "Profile routes are registered"
  });
});

// =========================
// ADMIN APPLICATION ROUTES
// =========================

app.use(
  "/api/admin/applications",
  adminApplicationRoutes
);
app.use("/api/admin/licenses", adminLicenseRoutes);
app.use("/api/admin/reports", adminReportRoutes);

// =========================
// HOME ROUTE
// =========================

app.get("/", (req, res) => {
  res.send("Tourism Guide Portal Backend is running!");
});

// =========================
// DATABASE + SERVER
// =========================

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();