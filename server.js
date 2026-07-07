const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
require("dotenv").config();

// Import Models
const Student = require("./models/Student");
const Class = require("./models/Class");
const User = require("./models/User");
const Expense = require("./models/Expense");
const Settings = require("./models/Settings");

// Auth middleware
const { authenticate } = require("./middleware/auth");

// Multer config — memory storage for xlsx/csv import
const upload = multer({ storage: multer.memoryStorage() });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();

  try {
    await initializeDatabase();
    next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable. Please try again shortly.",
    });
  }
});

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI;
let isDatabaseReady = false;
let databaseInitPromise = null;

async function initializeDatabase() {
  if (isDatabaseReady) return;
  if (databaseInitPromise) return databaseInitPromise;

  databaseInitPromise = (async () => {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    });

    console.log("✅ MongoDB Connected successfully");

    await ensureDefaultAdmin();

    const classesCount = await Class.countDocuments();
    if (classesCount === 0) {
      await seedDefaultClasses();
      console.log("✅ Default classes created");
    }

    isDatabaseReady = true;
    console.log("🎉 Server ready to use!");
  })();

  try {
    await databaseInitPromise;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    databaseInitPromise = null;
    throw error;
  }
}

// ==================== DEFAULT ADMIN ====================
async function ensureDefaultAdmin() {
  let admin = await User.findOne({ username: "admin", role: "admin" });
  if (!admin) {
    admin = await User.findOne({ role: "admin" });
  }

  if (!admin) {
    admin = new User({
      username: "admin",
      password: "admin123",
      role: "admin",
    });
    await admin.save();
    console.log(
      "✅ Default admin user created (username: admin, password: admin123)",
    );
    return admin;
  }

  // Fix admin saved without bcrypt hashing
  if (admin.password && !admin.password.startsWith("$2")) {
    admin.password = "admin123";
    await admin.save();
    console.log("✅ Admin password fixed (re-hashed)");
  }

  return admin;
}

initializeDatabase().catch((err) => {
  console.error("❌ MongoDB Connection error:", err.message);
  console.log("\n💡 Troubleshooting:");
  console.log("   1. Make sure MongoDB is installed");
  console.log("   2. Start MongoDB:");
  console.log("      - Windows: net start MongoDB");
  console.log("      - Mac: brew services start mongodb-community");
  console.log("      - Linux: sudo systemctl start mongod");
  console.log("   3. Or use MongoDB Atlas (cloud)");
});

// ==================== SEED FUNCTIONS ====================
async function seedDefaultClasses() {
  const defaultClasses = [
    // Boys Campus
    {
      id: "b1",
      campusId: "boys",
      name: "Class 1",
      sections: ["A", "B", "C"],
      order: 1,
    },
    {
      id: "b2",
      campusId: "boys",
      name: "Class 2",
      sections: ["A", "B", "C"],
      order: 2,
    },
    {
      id: "b3",
      campusId: "boys",
      name: "Class 3",
      sections: ["A", "B"],
      order: 3,
    },
    {
      id: "b4",
      campusId: "boys",
      name: "Class 4",
      sections: ["A", "B"],
      order: 4,
    },
    {
      id: "b5",
      campusId: "boys",
      name: "Class 5",
      sections: ["A", "B", "C"],
      order: 5,
    },
    {
      id: "b6",
      campusId: "boys",
      name: "Class 6",
      sections: ["A", "B"],
      order: 6,
    },
    {
      id: "b7",
      campusId: "boys",
      name: "Class 7",
      sections: ["A", "B"],
      order: 7,
    },
    {
      id: "b8",
      campusId: "boys",
      name: "Class 8",
      sections: ["A", "B"],
      order: 8,
    },
    {
      id: "b9",
      campusId: "boys",
      name: "Class 9",
      sections: ["A", "B"],
      order: 9,
    },
    {
      id: "b10",
      campusId: "boys",
      name: "Class 10",
      sections: ["A", "B", "C"],
      order: 10,
    },
    // Girls Campus
    {
      id: "g1",
      campusId: "girls",
      name: "Class 1",
      sections: ["A", "B"],
      order: 1,
    },
    {
      id: "g2",
      campusId: "girls",
      name: "Class 2",
      sections: ["A", "B"],
      order: 2,
    },
    {
      id: "g3",
      campusId: "girls",
      name: "Class 3",
      sections: ["A", "B"],
      order: 3,
    },
    {
      id: "g4",
      campusId: "girls",
      name: "Class 4",
      sections: ["A", "B"],
      order: 4,
    },
    {
      id: "g5",
      campusId: "girls",
      name: "Class 5",
      sections: ["A", "B"],
      order: 5,
    },
    {
      id: "g6",
      campusId: "girls",
      name: "Class 6",
      sections: ["A", "B"],
      order: 6,
    },
    {
      id: "g7",
      campusId: "girls",
      name: "Class 7",
      sections: ["A", "B"],
      order: 7,
    },
    {
      id: "g8",
      campusId: "girls",
      name: "Class 8",
      sections: ["A", "B"],
      order: 8,
    },
    {
      id: "g9",
      campusId: "girls",
      name: "Class 9",
      sections: ["A", "B"],
      order: 9,
    },
    {
      id: "g10",
      campusId: "girls",
      name: "Class 10",
      sections: ["A", "B"],
      order: 10,
    },
    // Kids Campus
    {
      id: "k1",
      campusId: "kids",
      name: "Nursery",
      sections: ["A", "B"],
      order: 1,
    },
    {
      id: "k2",
      campusId: "kids",
      name: "Prep",
      sections: ["A", "B"],
      order: 2,
    },
    {
      id: "k3",
      campusId: "kids",
      name: "Class 1",
      sections: ["A", "B"],
      order: 3,
    },
    {
      id: "k4",
      campusId: "kids",
      name: "Class 2",
      sections: ["A", "B"],
      order: 4,
    },
    {
      id: "k5",
      campusId: "kids",
      name: "Class 3",
      sections: ["A", "B"],
      order: 5,
    },
  ];

  for (const cls of defaultClasses) {
    const classDoc = new Class(cls);
    await classDoc.save();
  }
}

async function seedSampleStudents() {
  const classes = await Class.find();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let studentIdCounter = 1001;

  for (const cls of classes) {
    for (const section of cls.sections) {
      const studentCount = cls.campusId === "kids" ? 3 : 4;

      for (let i = 0; i < studentCount; i++) {
        const gender =
          cls.campusId === "girls"
            ? "F"
            : cls.campusId === "boys"
              ? "M"
              : i % 2 === 0
                ? "M"
                : "F";
        const studentName =
          gender === "M"
            ? ["Ahmed Ali", "Muhammad Usman", "Abdullah Khan", "Hamza Raza"][
                i % 4
              ]
            : ["Fatima Bibi", "Sana Malik", "Ayesha Noor", "Zainab Javed"][
                i % 4
              ];

        // Create fee records
        const feeRecords = [];
        for (let m = 0; m < months.length; m++) {
          const random = Math.random();
          let status, paidAmount;
          if (random < 0.6) {
            status = "Paid";
            paidAmount = 2000;
          } else if (random < 0.8) {
            status = "Partial";
            paidAmount = 1000;
          } else {
            status = "Unpaid";
            paidAmount = 0;
          }

          feeRecords.push({
            month: months[m],
            year: 2026,
            status,
            amount: 2000,
            paidAmount: status !== "Unpaid" ? paidAmount : undefined,
            paidDate: status !== "Unpaid" ? new Date(2026, m, 5) : undefined,
            receipt:
              status !== "Unpaid"
                ? `RCP${Math.floor(10000 + Math.random() * 89999)}`
                : undefined,
          });
        }

        const student = new Student({
          id: `S${studentIdCounter++}`,
          name: studentName,
          fatherName: ["Mian Ali", "Ch. Riaz", "Haji Usman", "Mr. Malik"][
            i % 4
          ],
          fatherPhone: `0300${Math.floor(10000000 + Math.random() * 89999999)}`,
          campusId: cls.campusId,
          classId: cls.id,
          section: section,
          rollNo: `${cls.campusId.charAt(0).toUpperCase()}${cls.id}${section}${String(i + 1).padStart(2, "0")}`,
          gender: gender,
          dob: new Date(2015, i, 15),
          bloodGroup: ["A+", "B+", "O+", "AB+"][i % 4],
          bForm: `35201${Math.floor(1000000 + Math.random() * 8999999)}`,
          email: `${studentName.toLowerCase().replace(" ", ".")}@example.com`,
          address: ["Pattoki City", "Mustafabad", "Chunian Road", "Ali Town"][
            i % 4
          ],
          monthlyFee: 2000,
          feeRecords: feeRecords,
          active: true,
        });

        await student.save();
      }
    }
  }
}

// ==================== HEALTH CHECK ====================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running!",
    timestamp: new Date(),
  });
});

// ==================== AUTH ROUTES ====================
app.post("/api/auth/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username, role: "admin" });

    if (!user && username === "admin") {
      user = new User({
        username: "admin",
        password: "admin123",
        role: "admin",
      });
      await user.save();
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Recover from plain-text password stored in DB
    if (user.password && !user.password.startsWith("$2")) {
      user.password = password;
      await user.save();
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/auth/student/login", async (req, res) => {
  const { studentId, password } = req.body;

  try {
    const user = await User.findOne({ studentId, role: "student" });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const student = await Student.findOne({ id: studentId });
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, studentId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
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
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/auth/student/signup", async (req, res) => {
  const { studentId, name, password } = req.body;

  try {
    const student = await Student.findOne({ id: studentId });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student ID not found" });
    }

    if (student.name.toLowerCase() !== name.toLowerCase()) {
      return res
        .status(400)
        .json({ success: false, message: "Name does not match records" });
    }

    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Account already exists" });
    }

    const user = new User({
      username: studentId,
      password,
      role: "student",
      studentId,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: "student", studentId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    res.json({
      success: true,
      message: "Account created successfully",
      token,
      user: { studentId: student.id, name: student.name, role: "student" },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role,
        studentId: req.user.studentId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get user" });
  }
});

// ==================== DASHBOARD ROUTES (protected) ====================
app.get("/api/dashboard/stats", authenticate, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ active: true });
    const totalClasses = await Class.countDocuments();

    // Get current month fee statistics
    const currentMonth = getCurrentMonthName();
    const students = await Student.find({ active: true });
    let paid = 0,
      partial = 0,
      unpaid = 0,
      totalCollected = 0;

    students.forEach((student) => {
      const monthRecord = student.feeRecords.find(
        (r) => r.month === currentMonth,
      );
      if (monthRecord) {
        if (monthRecord.status === "Paid") {
          paid++;
          totalCollected += monthRecord.amount;
        } else if (monthRecord.status === "Partial") {
          partial++;
          totalCollected += monthRecord.paidAmount || 0;
        } else {
          unpaid++;
        }
      } else {
        unpaid++;
      }
    });

    const allExpenses = await Expense.find();
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const campusesList = ["boys", "girls", "kids"];
    const campusStats = {};

    for (const campusId of campusesList) {
      const campusStudents = students.filter((s) => s.campusId === campusId);
      const campusClassesCount = await Class.countDocuments({ campusId });

      let campusPaid = 0;
      campusStudents.forEach((student) => {
        const monthRecord = student.feeRecords.find(
          (r) => r.month === currentMonth,
        );
        if (monthRecord && monthRecord.status === "Paid") {
          campusPaid++;
        }
      });

      campusStats[campusId] = {
        students: campusStudents.length,
        classes: campusClassesCount,
        paidStudents: campusPaid,
      };
    }

    res.json({
      success: true,
      totalStudents,
      feeCollection: totalCollected,
      paidStudents: paid,
      pendingStudents: unpaid + partial,
      totalExpenses,
      netBalance: totalCollected - totalExpenses,
      campusStats,
      data: {
        totalStudents,
        totalClasses,
        campuses: {
          boys: campusStats.boys.students,
          girls: campusStats.girls.students,
          kids: campusStats.kids.students,
        },
        feeStats: {
          month: getCurrentMonthName(),
          year: new Date().getFullYear(),
          paid,
          partial,
          unpaid,
          totalCollected,
          collectionRate:
            totalStudents > 0
              ? (((paid + partial) / totalStudents) * 100).toFixed(2)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

app.get("/api/dashboard/recent", authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentStudents = await Student.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(limit);

    const activities = recentStudents.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      campusId: s.campusId,
      type: "student",
      updatedAt: s.createdAt,
    }));

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error("Recent activities error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch activities" });
  }
});

// ==================== STUDENT ROUTES (protected) ====================
// Export route MUST come before /:id to avoid route conflict
app.get("/api/students/export", authenticate, async (req, res) => {
  try {
    const { format = "xlsx", campusId, campus, classId, section } = req.query;
    let query = { active: true };
    const finalCampusId = campusId || campus;
    if (finalCampusId) query.campusId = finalCampusId;
    if (classId) query.classId = classId;
    if (section) query.section = section;

    const students = await Student.find(query).sort({
      campusId: 1,
      classId: 1,
      section: 1,
      name: 1,
    });

    const rows = students.map((s, i) => ({
      "#": i + 1,
      "Student ID": s.id,
      "Full Name": s.name,
      "Father Name": s.fatherName,
      "Father Phone": s.fatherPhone || "",
      Campus: getCampusLabel(s.campusId),
      Class: s.className || s.classId,
      Section: s.section,
      "Roll No": s.rollNo || "",
      Gender: s.gender || "",
      DOB: s.dob ? new Date(s.dob).toISOString().split("T")[0] : "",
      "B-Form/CNIC": s.bForm || "",
      Address: s.address || "",
      "Monthly Fee": s.monthlyFee || 2000,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=students_${Date.now()}.csv`,
      );
      return res.send(csv);
    }

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=students_${Date.now()}.xlsx`,
    );
    res.send(buf);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, message: "Export failed" });
  }
});

const normalizeImportHeader = (header) =>
  String(header || "")
    .replace(/^\ufeff/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const buildImportColumnMap = (headerRow) => {
  const headers = headerRow.map(normalizeImportHeader);
  const findCol = (...matchers) => {
    for (const matcher of matchers) {
      const idx = headers.findIndex(matcher);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  return {
    studentId: findCol(
      (h) => h === "student id" || h === "studentid",
      (h) => h === "id",
    ),
    name: findCol(
      (h) => h === "full name" || h === "fullname",
      (h) =>
        h.includes("name") && !h.includes("father") && !h.includes("student"),
    ),
    fatherName: findCol(
      (h) => h === "father name" || h === "fathername",
      (h) => h.includes("father") && h.includes("name"),
      (h) => h.includes("guardian"),
    ),
    fatherPhone: findCol(
      (h) => h.includes("father") && h.includes("phone"),
      (h) =>
        h.includes("phone") || h.includes("mobile") || h.includes("contact"),
    ),
    campus: findCol((h) => h === "campus" || h.includes("campus")),
    class: findCol(
      (h) => h === "class" || h === "class id" || h === "classid",
    ),
    section: findCol((h) => h === "section"),
    gender: findCol((h) => h === "gender" || h === "sex"),
    dob: findCol((h) => h === "dob" || h.includes("birth")),
    monthlyFee: findCol((h) => h.includes("fee") || h.includes("amount")),
    bForm: findCol(
      (h) => h.includes("b-form") || h.includes("bform") || h.includes("cnic"),
    ),
    address: findCol((h) => h === "address"),
  };
};

const CAMPUS_LABELS = {
  boys: "Badar Colony Campus",
  girls: "Mega Road Campus",
  kids: "Abbas Park Campus",
};

const getCampusLabel = (campusId) =>
  CAMPUS_LABELS[campusId] || campusId || "";

const resolveImportCampusId = (input) => {
  const normalized = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const campusLabelToId = {
    "badar colony campus": "boys",
    "mega road campus": "girls",
    "abbas park campus": "kids",
    "badar colony": "boys",
    "mega road": "girls",
    "abbas park": "kids",
  };

  if (campusLabelToId[normalized]) return campusLabelToId[normalized];
  if (normalized.includes("badar")) return "boys";
  if (normalized.includes("mega road") || normalized.includes("mega"))
    return "girls";
  if (normalized.includes("abbas")) return "kids";
  if (["boys", "girls", "kids"].includes(normalized)) return normalized;
  if (normalized.startsWith("boy")) return "boys";
  if (normalized.startsWith("girl")) return "girls";
  if (normalized.startsWith("kid")) return "kids";
  return "";
};

const resolveImportClass = async (campusId, classInput) => {
  const escaped = classInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let classDoc = await Class.findOne({
    campusId,
    $or: [
      { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
      { id: classInput.toLowerCase() },
    ],
  });

  if (!classDoc) {
    const count = await Class.countDocuments({ campusId });
    const prefix =
      campusId === "boys" ? "b" : campusId === "girls" ? "g" : "k";
    classDoc = new Class({
      id: `${prefix}${count + 1}`,
      campusId,
      name: classInput,
      sections: ["A", "B", "C"],
      order: count + 1,
    });
    await classDoc.save();
  }

  return classDoc;
};

// Import students from xlsx/csv
app.post(
  "/api/students/import",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (rawRows.length < 2) {
        return res
          .status(400)
          .json({ success: false, message: "File has no data rows" });
      }

      const colMap = buildImportColumnMap(rawRows[0]);
      const getCell = (row, key) => {
        const idx = colMap[key];
        if (idx === undefined || idx < 0) return "";
        return String(row[idx] ?? "").trim();
      };

      const missingColumns = [];
      if (colMap.name < 0) missingColumns.push("Full Name");
      if (colMap.fatherName < 0) missingColumns.push("Father Name");
      if (colMap.campus < 0) missingColumns.push("Campus");
      if (colMap.class < 0) missingColumns.push("Class");
      if (colMap.section < 0) missingColumns.push("Section");

      if (missingColumns.length) {
        return res.status(400).json({
          success: false,
          message: `Missing columns: ${missingColumns.join(", ")}. Please download and use the Template.`,
        });
      }

      const results = { created: 0, skipped: 0, errors: [] };
      let nextStudentIdNumber = await getNextStudentIdNumber();
      const seenIdsInFile = new Set();

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNum = i + 1;

        if (!row || row.every((cell) => !String(cell ?? "").trim())) {
          continue;
        }

        try {
          const name = getCell(row, "name");
          const fatherName = getCell(row, "fatherName");
          const campusInput = getCell(row, "campus");
          const campusId = resolveImportCampusId(campusInput);
          const classInput = getCell(row, "class");
          const section = getCell(row, "section").toUpperCase();

          if (!name || !fatherName || !campusId || !classInput || !section) {
            const emptyFields = [];
            if (!name) emptyFields.push("Full Name");
            if (!fatherName) emptyFields.push("Father Name");
            if (!campusId) {
              emptyFields.push(
                campusInput
                  ? `Campus (invalid: "${campusInput}" — use Badar Colony Campus, Mega Road Campus, or Abbas Park Campus)`
                  : "Campus",
              );
            }
            if (!classInput) emptyFields.push("Class");
            if (!section) emptyFields.push("Section");
            results.errors.push(
              `Row ${rowNum} skipped — empty fields: ${emptyFields.join(", ")}`,
            );
            results.skipped++;
            continue;
          }

          let studentId = getCell(row, "studentId");
          if (studentId) {
            const idKey = studentId.toLowerCase();
            if (seenIdsInFile.has(idKey)) {
              results.errors.push(
                `Row ${rowNum} skipped — Duplicate Student ID "${studentId}" in file: ${name}`,
              );
              results.skipped++;
              continue;
            }
            const existingStudent = await Student.findOne({ id: studentId });
            if (existingStudent) {
              results.errors.push(
                `Row ${rowNum} skipped — Student ID "${studentId}" already exists: ${name}`,
              );
              results.skipped++;
              continue;
            }
            seenIdsInFile.add(idKey);
          } else {
            studentId = `S${nextStudentIdNumber++}`;
            while (
              (await Student.exists({ id: studentId })) ||
              seenIdsInFile.has(studentId.toLowerCase())
            ) {
              studentId = `S${nextStudentIdNumber++}`;
            }
            seenIdsInFile.add(studentId.toLowerCase());
          }

          const classDoc = await resolveImportClass(campusId, classInput);
          const rollNo = await generateUniqueRollNo(
            campusId,
            classDoc.id,
            section,
          );

          const monthlyFee = parseInt(getCell(row, "monthlyFee")) || 2000;
          const now = new Date();
          const academicStartYear =
            now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
          const academicMonths = [
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
            "January",
            "February",
          ];
          const feeRecords = academicMonths.map((month) => ({
            month,
            year:
              month === "January" || month === "February"
                ? academicStartYear + 1
                : academicStartYear,
            status: "Unpaid",
            amount: monthlyFee,
          }));

          const genderInput = getCell(row, "gender").toUpperCase();
          const gender = genderInput.startsWith("M")
            ? "M"
            : genderInput.startsWith("F")
              ? "F"
              : campusId === "girls"
                ? "F"
                : "M";

          const student = new Student({
            id: studentId,
            name,
            fatherName,
            fatherPhone: getCell(row, "fatherPhone"),
            campusId,
            classId: classDoc.id,
            className: classDoc.name,
            section,
            rollNo,
            gender,
            dob: getCell(row, "dob") || null,
            monthlyFee,
            bForm: getCell(row, "bForm"),
            address: getCell(row, "address"),
            feeRecords,
            admissionDate: new Date(),
            active: true,
          });

          await student.save();
          results.created++;
        } catch (rowErr) {
          if (rowErr.code === 11000) {
            results.errors.push(
              `Row ${rowNum} skipped — Duplicate Student ID in database`,
            );
          } else {
            results.errors.push(`Row ${rowNum} error: ${rowErr.message}`);
          }
          results.skipped++;
        }
      }

      res.json({
        success: true,
        message: `Import complete: ${results.created} students created, ${results.skipped} skipped`,
        data: results,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({
        success: false,
        message: "Import failed",
        error: error.message,
      });
    }
  },
);

app.get("/api/students", authenticate, async (req, res) => {
  try {
    const {
      search,
      campusId,
      campus,
      classId,
      section,
      page = 1,
      limit = 50,
    } = req.query;

    // Support both param names: campusId OR campus, classId OR class
    const finalCampusId = campusId || campus;
    const finalClassId = classId || req.query["class"];

    let query = { active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
      ];
    }
    if (finalCampusId) query.campusId = finalCampusId;
    if (finalClassId) query.classId = finalClassId;
    if (section) query.section = section;

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch students" });
  }
});

app.get("/api/students/:id", authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch student" });
  }
});

// POST - ADD NEW STUDENT (SAVES TO MONGODB)
app.post("/api/students", authenticate, async (req, res) => {
  try {
    const {
      id,
      name,
      fatherName,
      fatherPhone,
      campusId,
      classId,
      className,
      section,
      gender,
      dob,
      bloodGroup,
      monthlyFee,
      bForm,
      email,
      address,
      notes,
    } = req.body;

    // Validation
    if (!name || !fatherName || !campusId || !classId || !section) {
      return res.status(400).json({
        success: false,
        message: "Name, Father Name, Campus, Class, and Section are required",
      });
    }

    let studentId = String(id || "").trim();
    if (!studentId) {
      studentId = await generateUniqueStudentId();
    } else {
      // Check if exists
      const existingStudent = await Student.findOne({ id: studentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already exists",
        });
      }
    }

    const normalizedSection = section.toUpperCase();
    const rollNo = await generateUniqueRollNo(
      campusId,
      classId,
      normalizedSection,
    );

    // Create fee records for academic year (March - February)
    const academicMonths = [
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
    ];
    const now = new Date();
    const academicStartYear =
      now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
    const feeRecords = academicMonths.map((month) => ({
      month,
      year:
        month === "January" || month === "February"
          ? academicStartYear + 1
          : academicStartYear,
      status: "Unpaid",
      amount: monthlyFee || 2000,
    }));

    // Create new student
    const student = new Student({
      id: studentId,
      name,
      fatherName,
      fatherPhone: fatherPhone || "",
      campusId,
      classId,
      className,
      section: normalizedSection,
      rollNo,
      gender: gender || (campusId === "girls" ? "F" : "M"),
      dob: dob || null,
      bloodGroup: bloodGroup || "",
      monthlyFee: monthlyFee || 2000,
      bForm: bForm || "",
      email: email || "",
      address: address || "",
      notes: notes || "",
      feeRecords,
      admissionDate: new Date(),
      active: true,
    });

    await student.save();

    console.log(`✅ Student added to MongoDB: ${studentId} - ${name}`);

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: student,
    });
  } catch (error) {
    console.error("Add student error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "record";
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. Please try again.`,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to add student",
      error: error.message,
    });
  }
});

app.put("/api/students/:id", authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const updates = [
      "name",
      "fatherName",
      "fatherPhone",
      "campusId",
      "classId",
      "section",
      "gender",
      "dob",
      "bloodGroup",
      "monthlyFee",
      "bForm",
      "email",
      "address",
      "notes",
    ];

    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    student.updatedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update student" });
  }
});

app.delete("/api/students/:id", authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    student.active = false;
    await student.save();

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete student" });
  }
});

// ==================== CLASS ROUTES (protected) ====================
app.get("/api/classes", authenticate, async (req, res) => {
  try {
    const { campusId } = req.query;
    let query = {};
    if (campusId) query.campusId = campusId;

    const classes = await Class.find(query).sort({ order: 1 });
    res.json({ success: true, data: classes });
  } catch (error) {
    console.error("Get classes error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch classes" });
  }
});

app.get("/api/classes/:id", authenticate, async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });
    if (!classDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    const studentCount = await Student.countDocuments({
      classId: classDoc.id,
      campusId: classDoc.campusId,
      active: true,
    });

    res.json({ success: true, data: { ...classDoc.toObject(), studentCount } });
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch class" });
  }
});

app.post("/api/classes", authenticate, async (req, res) => {
  try {
    const { campusId, name, sections } = req.body;

    const existingClass = await Class.findOne({ campusId, name });
    if (existingClass) {
      return res
        .status(400)
        .json({ success: false, message: "Class already exists" });
    }

    const classCount = await Class.countDocuments({ campusId });
    const prefix = campusId.charAt(0);
    const newId = `${prefix}${classCount + 1}`;

    const newClass = new Class({
      id: newId,
      campusId,
      name,
      sections: sections || ["A"],
      order: classCount + 1,
    });

    await newClass.save();
    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ success: false, message: "Failed to create class" });
  }
});

app.put("/api/classes/:id", authenticate, async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });
    if (!classDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    if (req.body.name) classDoc.name = req.body.name;
    if (req.body.sections) classDoc.sections = req.body.sections;

    await classDoc.save();
    res.json({ success: true, data: classDoc });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({ success: false, message: "Failed to update class" });
  }
});

app.delete("/api/classes/:id", authenticate, async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });
    if (!classDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    const studentCount = await Student.countDocuments({
      classId: classDoc.id,
      campusId: classDoc.campusId,
      active: true,
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class with ${studentCount} students`,
      });
    }

    await Class.deleteOne({ id: req.params.id });
    res.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({ success: false, message: "Failed to delete class" });
  }
});

// ==================== FEE ROUTES ====================
const ACADEMIC_FEE_MONTHS = [
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
];
const CALENDAR_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getAcademicYearStart = (date = new Date()) => {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month < 2 ? year - 1 : year;
};

const getFeeYearForMonth = (
  month,
  academicStartYear = getAcademicYearStart(),
) => {
  if (month === "January" || month === "February") return academicStartYear + 1;
  return academicStartYear;
};

const formatChallanDate = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getFeeRecordDetails = (student, feeMonth, feeYear) => {
  const record = student.feeRecords.find(
    (r) => r.month === feeMonth && r.year === feeYear,
  );
  const amount = record?.amount ?? student.monthlyFee;
  const status = record?.status || "Unpaid";
  let due = 0;

  if (status === "Paid") {
    due = 0;
  } else if (status === "Partial") {
    due = Math.max(0, amount - (record?.paidAmount || 0));
  } else {
    due = amount;
  }

  return { record, amount, status, due };
};

const buildChallanFeeBreakdown = (student, month, yearInt) => {
  const targetIndex = ACADEMIC_FEE_MONTHS.indexOf(month);
  const calendarMonthIndex = CALENDAR_MONTHS.indexOf(month);

  if (targetIndex === -1 || calendarMonthIndex === -1) {
    return null;
  }

  const academicStartYear = getAcademicYearStart(
    new Date(yearInt, calendarMonthIndex, 1),
  );

  const previousMonths = [];
  let totalUnpaid = 0;

  for (let i = 0; i < targetIndex; i++) {
    const feeMonth = ACADEMIC_FEE_MONTHS[i];
    const feeYear = getFeeYearForMonth(feeMonth, academicStartYear);
    const details = getFeeRecordDetails(student, feeMonth, feeYear);

    previousMonths.push({
      month: feeMonth,
      year: feeYear,
      label: `${feeMonth} ${feeYear}`,
      status: details.status,
      due: details.due,
    });
    totalUnpaid += details.due;
  }

  const currentFeeYear = getFeeYearForMonth(month, academicStartYear);
  const currentDetails = getFeeRecordDetails(student, month, currentFeeYear);
  const currentMonth = {
    month,
    year: currentFeeYear,
    label: `${month} ${currentFeeYear}`,
    status: currentDetails.status,
    due: currentDetails.due,
  };
  totalUnpaid += currentDetails.due;

  return {
    targetIndex,
    calendarMonthIndex,
    academicStartYear,
    previousMonths,
    currentMonth,
    totalUnpaid,
    dueDate: formatChallanDate(),
    challanNo: `CH-${student.id.substring(1)}-${String(calendarMonthIndex + 1).padStart(2, "0")}${yearInt.toString().slice(-2)}`,
  };
};

const buildChallanDescriptionRows = (breakdown, lateFee = 0) => {
  const rows = [];

  breakdown.previousMonths
    .filter((entry) => entry.due > 0)
    .forEach((entry) => {
      rows.push([
        `${entry.label} — ${entry.status}`,
        `Rs. ${entry.due.toLocaleString()}`,
      ]);
    });

  rows.push([
    `${breakdown.currentMonth.label} — ${breakdown.currentMonth.status}`,
    breakdown.currentMonth.due > 0
      ? `Rs. ${breakdown.currentMonth.due.toLocaleString()}`
      : "—",
  ]);

  rows.push([
    "Total Unpaid Dues",
    `Rs. ${breakdown.totalUnpaid.toLocaleString()}`,
  ]);

  if (lateFee > 0 && breakdown.totalUnpaid > 0) {
    rows.push(["Late Fee (after due date)", `Rs. ${lateFee.toLocaleString()}`]);
    rows.push([
      "Grand Total (with late fee)",
      `Rs. ${(breakdown.totalUnpaid + lateFee).toLocaleString()}`,
    ]);
  }

  return rows;
};

const getCurrentMonthName = () => CALENDAR_MONTHS[new Date().getMonth()];

const getNextStudentIdNumber = async () => {
  const students = await Student.find({ id: /^S\d+$/ })
    .select("id")
    .lean();
  return (
    students.reduce((max, student) => {
      const match = student.id.match(/^S(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 1000) + 1
  );
};

const generateUniqueStudentId = async () => {
  let nextNumber = await getNextStudentIdNumber();
  let studentId = `S${nextNumber}`;

  while (await Student.exists({ id: studentId })) {
    nextNumber++;
    studentId = `S${nextNumber}`;
  }

  return studentId;
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateUniqueRollNo = async (campusId, classId, section) => {
  const normalizedSection = String(section || "").toUpperCase();
  const prefix = `${campusId.charAt(0).toUpperCase()}${classId}${normalizedSection}`;
  const existingStudents = await Student.find({
    rollNo: { $regex: `^${escapeRegex(prefix)}\\d+$` },
  })
    .select("rollNo")
    .lean();

  let maxRoll = 0;
  existingStudents.forEach((student) => {
    const suffix = student.rollNo.slice(prefix.length);
    const number = parseInt(suffix, 10);
    if (!Number.isNaN(number)) maxRoll = Math.max(maxRoll, number);
  });

  let nextRoll = maxRoll + 1;
  let rollNo = `${prefix}${String(nextRoll).padStart(2, "0")}`;

  while (await Student.exists({ rollNo })) {
    nextRoll++;
    rollNo = `${prefix}${String(nextRoll).padStart(2, "0")}`;
  }

  return rollNo;
};

const buildMonthlyRecordsMap = (
  feeRecords,
  academicStartYear = getAcademicYearStart(),
) => {
  const map = {};
  ACADEMIC_FEE_MONTHS.forEach((month) => {
    const year = getFeeYearForMonth(month, academicStartYear);
    map[month] =
      feeRecords.find((r) => r.month === month && r.year === year) ||
      feeRecords.find((r) => r.month === month) ||
      null;
  });
  return map;
};

app.get("/api/fees/overview", authenticate, async (req, res) => {
  try {
    const { campusId, month = getCurrentMonthName(), year } = req.query;
    const feeYear = year ? parseInt(year) : getFeeYearForMonth(month);
    let query = { active: true };
    if (campusId) query.campusId = campusId;

    const students = await Student.find(query);

    let paid = 0,
      partial = 0,
      unpaid = 0,
      totalCollected = 0,
      expectedTotal = 0;
    students.forEach((student) => {
      const record = student.feeRecords.find(
        (r) => r.month === month && r.year === feeYear,
      );
      const expectedAmount = record?.amount || student.monthlyFee || 0;
      expectedTotal += expectedAmount;
      if (record) {
        if (record.status === "Paid") {
          paid++;
          totalCollected += record.amount || expectedAmount;
        } else if (record.status === "Partial") {
          partial++;
          totalCollected += record.paidAmount || 0;
        } else {
          unpaid++;
        }
      } else {
        unpaid++;
      }
    });

    res.json({
      success: true,
      data: {
        month,
        year: feeYear,
        totalStudents: students.length,
        paid,
        partial,
        unpaid,
        totalCollected,
        expectedTotal,
        collectionRate:
          expectedTotal > 0
            ? ((totalCollected / expectedTotal) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error("Fee overview error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch fee overview" });
  }
});

app.get("/api/fees/report/monthly", authenticate, async (req, res) => {
  try {
    const { month = getCurrentMonthName(), year, campusId } = req.query;
    const feeYear = year ? parseInt(year) : getFeeYearForMonth(month);
    let query = { active: true };
    if (campusId) query.campusId = campusId;

    const students = await Student.find(query);

    const report = students.map((student) => {
      const feeRecord = student.feeRecords.find(
        (r) => r.month === month && r.year === feeYear,
      );
      return {
        studentId: student.id,
        studentName: student.name,
        campusId: student.campusId,
        classId: student.classId,
        section: student.section,
        rollNo: student.rollNo,
        fatherName: student.fatherName,
        fatherPhone: student.fatherPhone,
        monthlyFee: student.monthlyFee,
        feeStatus: feeRecord ? feeRecord.status : "Unpaid",
        paidAmount:
          feeRecord?.status === "Paid"
            ? feeRecord.amount || student.monthlyFee || 0
            : feeRecord?.paidAmount || 0,
        amount: feeRecord?.amount || student.monthlyFee || 0,
        paidDate: feeRecord?.paidDate,
        receipt: feeRecord?.receipt,
      };
    });

    res.json({
      success: true,
      data: report,
      summary: {
        total: report.length,
        paid: report.filter((r) => r.feeStatus === "Paid").length,
        partial: report.filter((r) => r.feeStatus === "Partial").length,
        unpaid: report.filter((r) => r.feeStatus === "Unpaid").length,
        totalCollected: report.reduce((sum, r) => sum + (r.paidAmount || 0), 0),
      },
    });
  } catch (error) {
    console.error("Monthly report error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
});

app.get(
  "/api/fees/student/:studentId/summary",
  authenticate,
  async (req, res) => {
    try {
      const student = await Student.findOne({ id: req.params.studentId });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      const academicStartYear = getAcademicYearStart();
      const currentMonth = getCurrentMonthName();
      const monthlyRecords = buildMonthlyRecordsMap(
        student.feeRecords,
        academicStartYear,
      );

      let expectedTotal = 0;
      let totalPaid = 0;
      for (const month of ACADEMIC_FEE_MONTHS) {
        const year = getFeeYearForMonth(month, academicStartYear);
        const record =
          student.feeRecords.find(
            (r) => r.month === month && r.year === year,
          ) || student.feeRecords.find((r) => r.month === month);
        const amount = record?.amount || student.monthlyFee || 0;
        expectedTotal += amount;
        if (record?.status === "Paid") totalPaid += amount;
        else if (record?.status === "Partial") {
          totalPaid += Math.min(record.paidAmount || 0, amount);
        }
        if (month === currentMonth) break;
      }
      const outstanding = Math.max(0, expectedTotal - totalPaid);

      res.json({
        success: true,
        data: {
          studentId: student.id,
          studentName: student.name,
          monthlyFee: student.monthlyFee,
          totalPaid,
          totalDue: outstanding,
          expectedTotal,
          outstanding,
          currentMonth,
          academicYear: `${academicStartYear}-${academicStartYear + 1}`,
          monthlyRecords,
          monthlyBreakdown: student.feeRecords,
        },
      });
    } catch (error) {
      console.error("Student fee summary error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch fee summary" });
    }
  },
);

app.put(
  "/api/fees/student/:studentId/month/:month/year/:year",
  async (req, res) => {
    try {
      const { studentId, month, year } = req.params;
      const { status, amount, paidAmount, paidDate, receipt } = req.body;

      const student = await Student.findOne({ id: studentId });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      let feeRecord = student.feeRecords.find(
        (r) => r.month === month && r.year === parseInt(year),
      );

      if (feeRecord) {
        feeRecord.status = status;
        feeRecord.amount = amount || student.monthlyFee;
        if (status === "Paid") {
          feeRecord.paidAmount = amount || student.monthlyFee;
          feeRecord.paidDate = paidDate || new Date();
          feeRecord.receipt = receipt || `RCP${Date.now()}`;
        } else if (status === "Partial") {
          feeRecord.paidAmount = paidAmount;
          feeRecord.paidDate = paidDate || new Date();
          feeRecord.receipt = receipt || `RCP${Date.now()}`;
        } else {
          feeRecord.paidAmount = undefined;
          feeRecord.paidDate = undefined;
          feeRecord.receipt = undefined;
        }
      } else {
        const newRecord = {
          month,
          year: parseInt(year),
          status,
          amount: amount || student.monthlyFee,
        };
        if (status === "Paid") {
          newRecord.paidAmount = amount || student.monthlyFee;
          newRecord.paidDate = paidDate || new Date();
          newRecord.receipt = receipt || `RCP${Date.now()}`;
        } else if (status === "Partial") {
          newRecord.paidAmount = paidAmount;
          newRecord.paidDate = paidDate || new Date();
          newRecord.receipt = receipt || `RCP${Date.now()}`;
        }
        student.feeRecords.push(newRecord);
      }

      await student.save();
      res.json({ success: true, message: "Fee record updated successfully" });
    } catch (error) {
      console.error("Update fee error:", error);
      res.status(500).json({ success: false, message: "Failed to update fee" });
    }
  },
);

app.get(
  "/api/fees/student/:studentId/challan/:month/:year",
  authenticate,
  async (req, res) => {
    try {
      const { studentId, month, year } = req.params;
      const student = await Student.findOne({ id: studentId });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      const yearInt = parseInt(year);

      const breakdown = buildChallanFeeBreakdown(student, month, yearInt);
      if (!breakdown) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid month" });
      }

      const settingsDoc = await Settings.getSingleton();
      const lateFee = settingsDoc.lateFee || 200;

      res.json({
        success: true,
        data: {
          student: {
            id: student.id,
            name: student.name,
            fatherName: student.fatherName,
            rollNo: student.rollNo,
            classId: student.classId,
            section: student.section,
            campusId: student.campusId,
          },
          month,
          year: yearInt,
          challanNo: breakdown.challanNo,
          issueDate: breakdown.dueDate,
          dueDate: breakdown.dueDate,
          previousMonths: breakdown.previousMonths,
          currentMonth: breakdown.currentMonth,
          totalUnpaid: breakdown.totalUnpaid,
          lateSurcharge: lateFee,
          totalAfterDue: breakdown.totalUnpaid + lateFee,
          feeStatus: breakdown.currentMonth.status,
          descriptionRows: buildChallanDescriptionRows(breakdown, lateFee),
        },
      });
    } catch (error) {
      console.error("Generate challan error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to generate challan" });
    }
  },
);

// ==================== EXPENSES ROUTES (MongoDB) ====================

// GET /api/expenses/categories — must be before /:id
app.get("/api/expenses/categories", authenticate, (req, res) => {
  const categories = [
    "Salaries",
    "Supplies",
    "Utilities",
    "Maintenance",
    "Equipment",
    "Transport",
    "Events",
    "Other",
  ];
  res.json({ success: true, data: categories });
});

app.get("/api/expenses", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    let query = {};
    if (category && category !== "all") query.category = category;
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];

    const total = await Expense.countDocuments(query);
    const expenseDocs = await Expense.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Compute total amount from all matching docs
    const aggResult = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);
    const totalAmount = aggResult[0]?.totalAmount || 0;

    // Map to frontend-expected shape: expense.id (not _id), expense.date as string
    const expenses = expenseDocs.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date ? new Date(e.date).toISOString().split("T")[0] : "",
      description: e.description || "",
      paymentMethod: e.paymentMethod || "",
      receipt: e.receipt || "",
      createdBy: e.createdBy || "admin",
      createdAt: e.createdAt,
    }));

    res.json({
      success: true,
      expenses,
      total: totalAmount,
      data: {
        expenses,
        total: totalAmount,
        count: total,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch expenses" });
  }
});

app.get("/api/expenses/:id", authenticate, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    res.json({ success: true, data: expense });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch expense" });
  }
});

app.post("/api/expenses", authenticate, async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      description,
      paymentMethod,
      receipt,
    } = req.body;
    if (!category || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Category and amount are required" });
    }
    const expense = new Expense({
      title: title || description || category,
      category,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      description: description || "",
      paymentMethod: paymentMethod || "Cash",
      receipt: receipt || `RCP${Date.now()}`,
      createdBy: req.user?.username || "admin",
    });
    await expense.save();
    const saved = {
      id: expense._id.toString(),
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date
        ? new Date(expense.date).toISOString().split("T")[0]
        : "",
      description: expense.description,
      paymentMethod: expense.paymentMethod,
      receipt: expense.receipt,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt,
    };
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Create expense error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create expense" });
  }
});

app.put("/api/expenses/:id", authenticate, async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      description,
      paymentMethod,
      receipt,
    } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (date !== undefined) updates.date = new Date(date);
    if (description !== undefined) updates.description = description;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (receipt !== undefined) updates.receipt = receipt;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true },
    );
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    res.json({ success: true, data: expense });
  } catch (error) {
    console.error("Update expense error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update expense" });
  }
});

app.delete("/api/expenses/:id", authenticate, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete expense error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete expense" });
  }
});

// ==================== SETTINGS ROUTES (DB-persisted) ====================
const DEFAULT_SETTINGS_VALUES = {
  schoolName: "Muslim Model High School Pattoki",
  schoolAddress: "Pattoki City, Kasur, Punjab",
  schoolPhone: "049-4412345",
  bankDetails:
    "Allied Bank Ltd, Pattoki (Branch Code: 0292) A/C No: 0110-38491029-01",
  defaultFee: 2000,
  lateFee: 200,
  dueDateDay: 10,
};

async function getAdminInfo() {
  const admin = await User.findOne({ role: "admin" });
  return { username: admin?.username || "admin" };
}

app.get("/api/settings", authenticate, async (req, res) => {
  try {
    const settingsDoc = await Settings.getSingleton();
    const admin = await getAdminInfo();
    res.json({
      success: true,
      data: {
        settings: {
          schoolName: settingsDoc.schoolName,
          schoolAddress: settingsDoc.schoolAddress,
          schoolPhone: settingsDoc.schoolPhone,
          bankDetails: settingsDoc.bankDetails,
          defaultFee: settingsDoc.defaultFee,
          lateFee: settingsDoc.lateFee,
          dueDateDay: settingsDoc.dueDateDay,
        },
        admin,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load settings" });
  }
});

app.put("/api/settings", authenticate, async (req, res) => {
  try {
    const { settings: newSettings, admin: adminData } = req.body;

    if (newSettings) {
      await Settings.updateSingleton(newSettings);
    }

    if (adminData) {
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        if (adminData.username?.trim())
          admin.username = adminData.username.trim();
        if (adminData.password?.trim())
          admin.password = adminData.password.trim();
        await admin.save();
      } else {
        const newAdmin = new User({
          username: adminData.username?.trim() || "admin",
          password: adminData.password?.trim() || "admin123",
          role: "admin",
        });
        await newAdmin.save();
      }
    }

    const updatedSettings = await Settings.getSingleton();
    const admin = await getAdminInfo();
    res.json({
      success: true,
      message: "Settings saved successfully",
      data: {
        settings: {
          schoolName: updatedSettings.schoolName,
          schoolAddress: updatedSettings.schoolAddress,
          schoolPhone: updatedSettings.schoolPhone,
          bankDetails: updatedSettings.bankDetails,
          defaultFee: updatedSettings.defaultFee,
          lateFee: updatedSettings.lateFee,
          dueDateDay: updatedSettings.dueDateDay,
        },
        admin,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to save settings" });
  }
});

app.post("/api/settings/reset", authenticate, async (req, res) => {
  try {
    await Settings.updateSingleton(DEFAULT_SETTINGS_VALUES);
    const settingsDoc = await Settings.getSingleton();
    res.json({
      success: true,
      message: "Settings reset to default",
      data: settingsDoc,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to reset settings" });
  }
});

// ==================== CHALLAN PDF ROUTE ====================
app.get(
  "/api/fees/student/:studentId/challan/:month/:year/pdf",
  authenticate,
  async (req, res) => {
    try {
      const { studentId, month, year } = req.params;
      const student = await Student.findOne({ id: studentId });
      if (!student)
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });

      const settingsDoc = await Settings.getSingleton();
      const schoolName =
        settingsDoc.schoolName || "Muslim Model High School Pattoki";
      const schoolAddress =
        settingsDoc.schoolAddress || "Pattoki City, Kasur, Punjab";
      const schoolPhone = settingsDoc.schoolPhone || "";
      const bankDetails = settingsDoc.bankDetails || "";
      const lateFee = settingsDoc.lateFee || 200;

      const yearInt = parseInt(year);
      const breakdown = buildChallanFeeBreakdown(student, month, yearInt);
      if (!breakdown) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid month" });
      }

      const { challanNo, dueDate, currentMonth } = breakdown;
      const descriptionRows = buildChallanDescriptionRows(breakdown, lateFee);
      const currentStatus = currentMonth.status;

      const campusLabel = getCampusLabel(student.campusId);

      // --- PDF Generation (A4, 3-copy family style) ---
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=challan_${studentId}_${month}_${year}.pdf`,
      );
      doc.pipe(res);

      const pageW = 595.28;
      const pageH = 841.89;
      const copyH = pageH / 3; // ~280px per copy
      const copyLabels = ["Bank Copy", "School Copy", "Student Copy"];
      const themeColor = "#1a56a0";
      const accentColor = "#e63946";

      copyLabels.forEach((copyLabel, idx) => {
        const yBase = idx * copyH;
        const pad = 18;
        const innerW = pageW - pad * 2;

        // Background stripe at top
        doc.rect(0, yBase, pageW, 38).fill(themeColor);

        // School name
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(schoolName, pad, yBase + 7, {
            width: innerW - 80,
            align: "left",
          });

        // Copy label badge
        doc.rect(pageW - 90, yBase + 8, 75, 20).fill(accentColor);
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(8)
          .text(copyLabel, pageW - 90, yBase + 13, {
            width: 75,
            align: "center",
          });

        // Address and phone
        doc
          .fillColor("#ccddff")
          .font("Helvetica")
          .fontSize(7)
          .text(`${schoolAddress}  |  ${schoolPhone}`, pad, yBase + 22, {
            width: innerW - 80,
          });

        // Challan title
        doc
          .fillColor("#1a56a0")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text("FEE CHALLAN", 0, yBase + 42, {
            width: pageW,
            align: "center",
          });

        // Divider
        doc
          .moveTo(pad, yBase + 54)
          .lineTo(pageW - pad, yBase + 54)
          .strokeColor("#c0cfe0")
          .lineWidth(0.5)
          .stroke();

        // Two-column info
        const leftX = pad;
        const rightX = pageW / 2 + 10;
        const infoY = yBase + 58;
        const lineH = 13;

        const drawField = (label, value, x, y, w) => {
          doc
            .fillColor("#666666")
            .font("Helvetica")
            .fontSize(6.5)
            .text(label.toUpperCase(), x, y, { width: w });
          doc
            .fillColor("#111111")
            .font("Helvetica-Bold")
            .fontSize(7.5)
            .text(value || "—", x, y + 7, { width: w });
        };

        drawField("Student Name", student.name, leftX, infoY, 145);
        drawField("Challan No", challanNo, rightX, infoY, 145);

        drawField(
          "Father Name",
          student.fatherName,
          leftX,
          infoY + lineH * 1.5,
          145,
        );
        drawField(
          "Month / Year",
          `${month} ${year}`,
          rightX,
          infoY + lineH * 1.5,
          145,
        );

        drawField(
          "Class / Section",
          `${student.classId} - ${student.section}`,
          leftX,
          infoY + lineH * 3,
          145,
        );
        drawField("Due Date", dueDate, rightX, infoY + lineH * 3, 145);

        drawField(
          "Roll No",
          student.rollNo || "—",
          leftX,
          infoY + lineH * 4.5,
          145,
        );
        drawField("Campus", campusLabel, rightX, infoY + lineH * 4.5, 145);

        // Fee table
        const tableY = yBase + 148;
        const headerH = 14;
        const rowH = 11;
        const cols = { label: pad, amount: pageW - 90 };
        const tableW = innerW;

        // Table header
        doc.rect(pad, tableY, tableW, headerH).fill("#e8f0fc");
        doc
          .fillColor("#1a56a0")
          .font("Helvetica-Bold")
          .fontSize(6.5)
          .text("DESCRIPTION", cols.label + 4, tableY + 3, { width: 260 })
          .text("AMOUNT (Rs)", cols.amount - 10, tableY + 3, {
            width: 80,
            align: "right",
          });

        descriptionRows.forEach(([label, amount], i) => {
          const rowY = tableY + headerH + i * rowH;
          if (i % 2 === 1) doc.rect(pad, rowY, tableW, rowH).fill("#f7faff");
          const isBold =
            label.includes("Total") ||
            label.includes("Grand") ||
            label.includes("Late Fee");
          doc
            .fillColor(isBold ? "#1a56a0" : "#222222")
            .font(isBold ? "Helvetica-Bold" : "Helvetica")
            .fontSize(6.5)
            .text(label, cols.label + 4, rowY + 2, { width: 260 })
            .text(amount, cols.amount - 10, rowY + 2, {
              width: 80,
              align: "right",
            });
        });

        const tableBottom = tableY + headerH + descriptionRows.length * rowH + 4;

        // Status badge (current month)
        const statusColor =
          currentStatus === "Paid"
            ? "#1a8c5b"
            : currentStatus === "Partial"
              ? "#c47a00"
              : "#c0392b";
        doc.rect(pad, tableBottom, 72, 12).fill(statusColor);
        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(6.5)
          .text(
            `CURRENT: ${currentStatus.toUpperCase()}`,
            pad + 2,
            tableBottom + 3,
            { width: 68, align: "center" },
          );

        // Bank details
        doc
          .fillColor("#555555")
          .font("Helvetica")
          .fontSize(6.5)
          .text(`Bank: ${bankDetails}`, rightX, tableBottom + 2, {
            width: innerW / 2,
          });

        // Divider between copies
        if (idx < 2) {
          doc.save();
          doc.dash(4, { space: 3 });
          doc
            .moveTo(0, (idx + 1) * copyH)
            .lineTo(pageW, (idx + 1) * copyH)
            .strokeColor("#aaaaaa")
            .lineWidth(0.7)
            .stroke();
          doc.restore();
          // Scissors icon
          doc
            .fillColor("#aaaaaa")
            .font("Helvetica")
            .fontSize(8)
            .text("✂", pageW / 2 - 4, (idx + 1) * copyH - 6);
        }
      });

      doc.end();
    } catch (error) {
      console.error("Challan PDF error:", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ success: false, message: "Failed to generate PDF" });
      }
    }
  },
);

// ==================== CLASS SECTIONS ROUTES ====================
app.post("/api/classes/:id/sections", authenticate, async (req, res) => {
  try {
    const { section } = req.body;
    const classDoc = await Class.findOne({ id: req.params.id });
    if (!classDoc)
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });

    const sectionUpper = section.toUpperCase();
    if (classDoc.sections.includes(sectionUpper)) {
      return res
        .status(400)
        .json({ success: false, message: "Section already exists" });
    }

    classDoc.sections.push(sectionUpper);
    await classDoc.save();
    res.json({
      success: true,
      message: "Section added successfully",
      data: classDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add section" });
  }
});

app.delete(
  "/api/classes/:id/sections/:section",
  authenticate,
  async (req, res) => {
    try {
      const classDoc = await Class.findOne({ id: req.params.id });
      if (!classDoc)
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });

      const studentCount = await Student.countDocuments({
        classId: classDoc.id,
        campusId: classDoc.campusId,
        section: req.params.section,
        active: true,
      });

      if (studentCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove section with ${studentCount} students`,
        });
      }

      classDoc.sections = classDoc.sections.filter(
        (s) => s !== req.params.section,
      );
      await classDoc.save();
      res.json({
        success: true,
        message: "Section removed successfully",
        data: classDoc,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to remove section" });
    }
  },
);

// ==================== SERVER START ====================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB Connected`);
  });
}

module.exports = app;
