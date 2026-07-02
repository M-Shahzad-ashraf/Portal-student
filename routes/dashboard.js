const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivities,
  getClassWiseStats,
} = require("../controllers/dashboardController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// All dashboard routes require authentication
router.use(authenticate);

// Admin dashboard routes
router.get("/stats", authorizeAdmin, getDashboardStats);
router.get("/recent", authorizeAdmin, getRecentActivities);
router.get("/class-wise", authorizeAdmin, getClassWiseStats);

module.exports = router;
