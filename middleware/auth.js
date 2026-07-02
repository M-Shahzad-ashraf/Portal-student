const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

const authorizeStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Student access required",
    });
  }
  next();
};

// Optional: Check if user is accessing their own data
const checkStudentOwnership = (req, res, next) => {
  if (req.user.role === "admin") return next();

  const requestedStudentId = req.params.id || req.params.studentId;
  if (requestedStudentId && req.user.studentId !== requestedStudentId) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeStudent,
  checkStudentOwnership,
};
