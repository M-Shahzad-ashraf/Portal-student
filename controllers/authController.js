const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if admin exists
    let admin = await User.findOne({ username, role: "admin" });

    // Create default admin if not exists (for first time setup)
    if (!admin) {
      admin = new User({
        username: "admin",
        password: "admin123",
        role: "admin",
      });
      await admin.save();
    }

    // Verify password
    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Student login
const studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // Find student user account
    const user = await User.findOne({
      studentId,
      role: "student",
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid student ID or password",
      });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid student ID or password",
      });
    }

    // Get student details
    const student = await Student.findOne({ id: studentId });
    if (!student || !student.active) {
      return res.status(401).json({
        success: false,
        message: "Student record not found or inactive",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, studentId: student.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        studentId: student.id,
        name: student.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Student signup (create account)
const studentSignup = async (req, res) => {
  try {
    const { studentId, name, password } = req.body;

    // Check if student exists in database
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student ID not found in school records",
      });
    }

    // Verify name matches
    if (student.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Name does not match school records",
      });
    }

    // Check if user account already exists
    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please login.",
      });
    }

    // Create new user account
    const user = new User({
      username: studentId,
      password,
      role: "student",
      studentId,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, studentId: student.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        studentId: student.id,
        name: student.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Student signup error:", error);
    res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
};

// Get current user info
const getMe = async (req, res) => {
  try {
    const user = req.user;
    const response = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    if (user.role === "student" && user.studentId) {
      const student = await Student.findOne({ id: user.studentId });
      if (student) {
        response.name = student.name;
        response.studentId = student.id;
        response.campusId = student.campusId;
      }
    }

    res.json({
      success: true,
      user: response,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user info",
    });
  }
};

module.exports = {
  adminLogin,
  studentLogin,
  studentSignup,
  getMe,
};
