const jwt = require("jsonwebtoken");

// =====================================================
// VERIFY JWT TOKEN
// =====================================================

const authenticateOfficer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. Authentication required."
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store officer information in request
    req.officer = decoded;

    next();

  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication token"
    });
  }
};


// =====================================================
// CHECK ADMIN ROLE
// =====================================================

const requireAdmin = (req, res, next) => {

  if (!req.officer) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  if (req.officer.role !== "Admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required."
    });
  }

  next();
};


// =====================================================
// CHECK OFFICER OR ADMIN ROLE
// =====================================================

const requireOfficer = (req, res, next) => {

  if (!req.officer) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  if (
    req.officer.role !== "Officer" &&
    req.officer.role !== "Admin"
  ) {
    return res.status(403).json({
      message: "Access denied."
    });
  }

  next();
};


module.exports = {
  authenticateOfficer,
  requireAdmin,
  requireOfficer
};