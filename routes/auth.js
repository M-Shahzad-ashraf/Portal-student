const express = require("express");
const router = express.Router();
const {
  adminLogin,
  studentLogin,
  studentSignup,
  getMe,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  loginValidation,
  signupValidation,
  validate,
} = require("../middleware/validation");

// Public routes
router.post("/admin/login", loginValidation, validate, adminLogin);
router.post("/student/login", loginValidation, validate, studentLogin);
router.post("/student/signup", signupValidation, validate, studentSignup);

// Protected routes
router.get("/me", authenticate, getMe);

module.exports = router;
