const express = require("express");
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addSection,
  removeSection,
} = require("../controllers/classController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// All class routes require authentication
router.use(authenticate);

// Public (authenticated) routes
router.get("/", getAllClasses);
router.get("/:id", getClassById);

// Admin only routes
router.post("/", authorizeAdmin, createClass);
router.put("/:id", authorizeAdmin, updateClass);
router.delete("/:id", authorizeAdmin, deleteClass);
router.post("/:id/sections", authorizeAdmin, addSection);
router.delete("/:id/sections/:section", authorizeAdmin, removeSection);

module.exports = router;
