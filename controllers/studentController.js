const Student = require("../models/Student");
const Class = require("../models/Class");
const {
  generateStudentId,
  paginate,
  parseExcelDate,
  getCurrentDate,
} = require("../utils/helpers");
const XLSX = require("xlsx");

// Get all students with pagination and filters
const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      campusId,
      campus,
      classId,
      section,
      status,
    } = req.query;

    // Support both param names
    const finalCampusId = campusId || campus;
    const finalClassId = classId || req.query['class'];

    let query = { active: true };

    // Apply filters
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
    console.error("Get all students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get class details
    const classInfo = await Class.findOne({
      id: student.classId,
      campusId: student.campusId,
    });

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        classInfo,
      },
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
};

const createStudent = async (req, res) => {
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

    let studentId = id;
    if (!studentId) {
      // Generate unique student ID
      studentId = await generateStudentId(Student);
    } else {
      const existingStudent = await Student.findOne({ id: studentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already exists",
        });
      }
    }

    // Create fee records for all months of 2026
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

    const feeRecords = months.map((month) => ({
      month,
      year: 2026,
      status: "Unpaid",
      amount: monthlyFee || 2000,
    }));

    const student = new Student({
      id: studentId,
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
      monthlyFee: monthlyFee || 2000,
      bForm,
      email,
      address,
      notes,
      feeRecords,
      admissionDate: getCurrentDate(),
    });

    await student.save();

    // Update class sections if needed
    const classDoc = await Class.findOne({ id: classId, campusId });
    if (classDoc && !classDoc.sections.includes(section)) {
      classDoc.sections.push(section);
      await classDoc.save();
    }

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error("Create student error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate student ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create student",
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const updates = req.body;
    const allowedUpdates = [
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

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        student[field] = updates[field];
      }
    });

    await student.save();

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};

// Delete student (soft delete)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    student.active = false;
    await student.save();

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete student",
    });
  }
};

// Import students from Excel/CSV
const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      return res.status(400).json({
        success: false,
        message: "File contains no data",
      });
    }

    const headers = rows[0].map((h) =>
      String(h || "")
        .trim()
        .toLowerCase(),
    );

    // Map column indices
    const colMap = {
      name: headers.findIndex(
        (h) => h.includes("name") && !h.includes("father"),
      ),
      fatherName: headers.findIndex(
        (h) => h.includes("father") || h.includes("guardian"),
      ),
      fatherPhone: headers.findIndex(
        (h) =>
          h.includes("phone") || h.includes("contact") || h.includes("mobile"),
      ),
      campus: headers.findIndex((h) => h.includes("campus")),
      class: headers.findIndex((h) => h.includes("class")),
      section: headers.findIndex((h) => h.includes("section")),
      gender: headers.findIndex(
        (h) => h.includes("gender") || h.includes("sex"),
      ),
      dob: headers.findIndex((h) => h.includes("dob") || h.includes("birth")),
      fee: headers.findIndex((h) => h.includes("fee") || h.includes("amount")),
      bform: headers.findIndex(
        (h) =>
          h.includes("bform") || h.includes("b-form") || h.includes("cnic"),
      ),
      blood: headers.findIndex((h) => h.includes("blood")),
      email: headers.findIndex((h) => h.includes("email")),
      address: headers.findIndex((h) => h.includes("address")),
    };

    let imported = 0;
    let errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[colMap.name]) continue;

      try {
        const name = String(row[colMap.name] || "").trim();
        const fatherName =
          colMap.fatherName !== -1
            ? String(row[colMap.fatherName] || "").trim()
            : "Guardian Name";
        const fatherPhone =
          colMap.fatherPhone !== -1
            ? String(row[colMap.fatherPhone] || "").trim()
            : "";

        let campusId = "boys";
        const rawCampus =
          colMap.campus !== -1
            ? String(row[colMap.campus] || "").toLowerCase()
            : "";
        if (rawCampus.includes("girl")) campusId = "girls";
        else if (rawCampus.includes("kid")) campusId = "kids";

        const className =
          colMap.class !== -1
            ? String(row[colMap.class] || "").trim()
            : "Class 1";
        let classDoc = await Class.findOne({ name: className, campusId });

        if (!classDoc) {
          // Auto-create class if not exists
          const classId = `${campusId.charAt(0)}${Math.floor(Math.random() * 100)}`;
          classDoc = new Class({
            id: classId,
            campusId,
            name: className,
            sections: ["A"],
          });
          await classDoc.save();
        }

        const section =
          colMap.section !== -1
            ? String(row[colMap.section] || "")
                .trim()
                .toUpperCase()
            : "A";
        const gender =
          colMap.gender !== -1
            ? String(row[colMap.gender] || "")
                .toUpperCase()
                .startsWith("F")
              ? "F"
              : "M"
            : campusId === "girls"
              ? "F"
              : "M";
        const dob = colMap.dob !== -1 ? parseExcelDate(row[colMap.dob]) : null;
        const monthlyFee =
          colMap.fee !== -1 ? parseInt(row[colMap.fee]) || 2000 : 2000;
        const bForm =
          colMap.bform !== -1 ? String(row[colMap.bform] || "").trim() : "";
        const bloodGroup =
          colMap.blood !== -1
            ? String(row[colMap.blood] || "")
                .trim()
                .toUpperCase()
            : "";
        const email =
          colMap.email !== -1 ? String(row[colMap.email] || "").trim() : "";
        const address =
          colMap.address !== -1 ? String(row[colMap.address] || "").trim() : "";

        const studentId = await generateStudentId(Student);
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
        const feeRecords = months.map((month) => ({
          month,
          year: 2026,
          status: "Unpaid",
          amount: monthlyFee,
        }));

        const student = new Student({
          id: studentId,
          name,
          fatherName,
          fatherPhone,
          campusId,
          classId: classDoc.id,
          section,
          gender,
          dob,
          bloodGroup,
          monthlyFee,
          bForm,
          email,
          address,
          feeRecords,
          admissionDate: getCurrentDate(),
        });

        await student.save();
        imported++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${imported} students successfully`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to import students",
    });
  }
};

// Export students to Excel
const exportStudents = async (req, res) => {
  try {
    const { campusId, classId, section } = req.query;
    let query = { active: true };

    if (campusId) query.campusId = campusId;
    if (classId) query.classId = classId;
    if (section) query.section = section;

    const students = await Student.find(query).sort({ name: 1 });

    const exportData = students.map((s) => ({
      "Student ID": s.id,
      "Full Name": s.name,
      "Father Name": s.fatherName,
      "Father Phone": s.fatherPhone,
      Campus: s.campusId,
      Class: s.classId,
      Section: s.section,
      "Roll No": s.rollNo,
      Gender: s.gender === "M" ? "Male" : "Female",
      DOB: s.dob ? s.dob.toISOString().split("T")[0] : "",
      "Blood Group": s.bloodGroup,
      "B-Form/CNIC": s.bForm,
      Email: s.email,
      Address: s.address,
      "Monthly Fee": s.monthlyFee,
      "Admission Date": s.admissionDate
        ? s.admissionDate.toISOString().split("T")[0]
        : "",
      "Total Paid": s.totalPaid,
      Outstanding: s.totalDue,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students_export.xlsx",
    );
    res.send(buffer);
  } catch (error) {
    console.error("Export students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export students",
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  exportStudents,
};
