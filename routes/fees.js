const express = require("express");
const router = express.Router();
const {
  getStudentFeeSummary,
  updateFee,
  getFeeOverview,
  getMonthlyFeeReport,
  generateChallan,
} = require("../controllers/feeController");
const {
  authenticate,
  authorizeAdmin,
  checkStudentOwnership,
} = require("../middleware/auth");
const { feeValidation, validate } = require("../middleware/validation");

// All fee routes require authentication
router.use(authenticate);

// Fee overview (admin only)
router.get("/overview", authorizeAdmin, getFeeOverview);
router.get("/report/monthly", authorizeAdmin, getMonthlyFeeReport);

// Student fee summary (admin or student owner)
router.get(
  "/student/:studentId/summary",
  checkStudentOwnership,
  getStudentFeeSummary,
);

// Update fee (admin only)
router.put(
  "/student/:studentId/month/:month/year/:year",
  authorizeAdmin,
  feeValidation,
  validate,
  updateFee,
);

// Generate challan (admin or student owner)
router.get(
  "/student/:studentId/challan/:month/:year",
  checkStudentOwnership,
  generateChallan,
);

module.exports = router;
