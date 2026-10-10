const jwt = require("jsonwebtoken");

function authenticateApplicant(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in to continue."
    });
  }

  try {
    const decoded = jwt.verify(
      authorization.slice("Bearer ".length),
      process.env.JWT_SECRET
    );

    if (!decoded.applicantId || !decoded.email) {
      return res.status(403).json({
        message: "Applicant access is required."
      });
    }

    if (decoded.accountType === "Tourist") {
      return res.status(403).json({
        message: "A guide account is required to access this service."
      });
    }

    req.applicant = {
      applicantId: decoded.applicantId,
      email: decoded.email.toLowerCase(),
      accountType: decoded.accountType || "Guide"
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired applicant session."
    });
  }
}

module.exports = authenticateApplicant;
