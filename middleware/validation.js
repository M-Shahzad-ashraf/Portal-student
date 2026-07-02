const { body, param, query, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Student validation rules
const studentValidation = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  body("fatherName").notEmpty().withMessage("Father name is required").trim(),
  body("campusId")
    .isIn(["boys", "girls", "kids"])
    .withMessage("Invalid campus"),
  body("classId").notEmpty().withMessage("Class ID is required"),
  body("section")
    .notEmpty()
    .withMessage("Section is required")
    .trim()
    .isLength({ min: 1, max: 2 }),
  body("gender").isIn(["M", "F"]).withMessage("Invalid gender"),
  body("monthlyFee")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Monthly fee must be a positive number"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
];

// Fee update validation
const feeValidation = [
  body("month").notEmpty().withMessage("Month is required"),
  body("year").optional().isInt({ min: 2000, max: 2100 }),
  body("status")
    .isIn(["Paid", "Partial", "Unpaid"])
    .withMessage("Invalid status"),
  body("amount").isInt({ min: 0 }).withMessage("Amount must be positive"),
  body("paidAmount").optional().isInt({ min: 0 }),
  body("receipt").optional().trim(),
];

// Login validation
const loginValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Signup validation
const signupValidation = [
  body("studentId").notEmpty().withMessage("Student ID is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

// Pagination validation
const paginationValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  validate,
  studentValidation,
  feeValidation,
  loginValidation,
  signupValidation,
  paginationValidation,
};
