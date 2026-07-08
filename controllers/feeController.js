const Student = require("../models/Student");
const { generateReceiptNumber } = require("../utils/helpers");
const {
  ACADEMIC_FEE_MONTHS,
  CALENDAR_MONTHS,
  getAcademicYearStart,
  getFeeYearForMonth,
  resolveStudentFeeStartMonth,
  getStudentFeeStartIndex,
  isMonthBeforeFeeStart,
} = require("../utils/feeUtils");

// Get fee summary for a student
const getStudentFeeSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.studentId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const currentAcademicIndex = ACADEMIC_FEE_MONTHS.indexOf(
      CALENDAR_MONTHS[new Date().getMonth()],
    );
    const feeStartIndex = getStudentFeeStartIndex(student);
    const academicStartYear = getAcademicYearStart();

    let totalPaid = 0;
    let expectedTotal = 0;
    const monthlyBreakdown = [];

    for (let i = feeStartIndex; i <= currentAcademicIndex; i++) {
      const month = ACADEMIC_FEE_MONTHS[i];
      const recordYear = getFeeYearForMonth(month, academicStartYear);
      const record = student.feeRecords.find(
        (r) => r.month === month && r.year === recordYear,
      );
      const amount = record?.amount || student.monthlyFee || 0;
      expectedTotal += amount;

      if (record) {
        if (record.status === "Paid") {
          totalPaid += amount;
          monthlyBreakdown.push({
            month,
            status: "Paid",
            amount,
            paidAmount: amount,
            paidDate: record.paidDate,
            receipt: record.receipt,
          });
        } else if (record.status === "Partial") {
          const paid = record.paidAmount || 0;
          totalPaid += paid;
          monthlyBreakdown.push({
            month,
            status: "Partial",
            amount,
            paidAmount: paid,
            remaining: Math.max(0, amount - paid),
            paidDate: record.paidDate,
            receipt: record.receipt,
          });
        } else {
          monthlyBreakdown.push({
            month,
            status: "Unpaid",
            amount,
            paidAmount: 0,
          });
        }
      } else {
        monthlyBreakdown.push({
          month,
          status: "Unpaid",
          amount: student.monthlyFee,
          paidAmount: 0,
        });
      }
    }

    res.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: student.name,
        monthlyFee: student.monthlyFee,
        feeStartMonth: resolveStudentFeeStartMonth(student),
        totalPaid,
        totalDue: Math.max(0, expectedTotal - totalPaid),
        expectedTotal,
        outstanding: Math.max(0, expectedTotal - totalPaid),
        monthlyBreakdown,
      },
    });
  } catch (error) {
    console.error("Get fee summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee summary",
    });
  }
};

// Update fee for a specific month
const updateFee = async (req, res) => {
  try {
    const { studentId, month, year = 2026 } = req.params;
    const { status, amount, paidAmount, paidDate, receipt } = req.body;

    const student = await Student.findOne({ id: studentId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (isMonthBeforeFeeStart(student, month)) {
      return res.status(400).json({
        success: false,
        message: `Fee is not applicable before the student's fee start month (${resolveStudentFeeStartMonth(student)})`,
      });
    }

    const feeRecord = student.feeRecords.find(
      (r) => r.month === month && r.year === parseInt(year),
    );

    if (feeRecord) {
      // Update existing record
      feeRecord.status = status;
      feeRecord.amount = amount || student.monthlyFee;
      if (status === "Paid") {
        feeRecord.paidAmount = amount || student.monthlyFee;
        feeRecord.paidDate = paidDate || new Date();
        feeRecord.receipt = receipt || generateReceiptNumber();
      } else if (status === "Partial") {
        feeRecord.paidAmount = paidAmount;
        feeRecord.paidDate = paidDate || new Date();
        feeRecord.receipt = receipt || generateReceiptNumber();
      } else {
        feeRecord.paidAmount = undefined;
        feeRecord.paidDate = undefined;
        feeRecord.receipt = undefined;
      }
      feeRecord.updatedBy = req.user._id;
      feeRecord.updatedAt = new Date();
    } else {
      // Create new record
      const newRecord = {
        month,
        year: parseInt(year),
        status,
        amount: amount || student.monthlyFee,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      };

      if (status === "Paid") {
        newRecord.paidAmount = amount || student.monthlyFee;
        newRecord.paidDate = paidDate || new Date();
        newRecord.receipt = receipt || generateReceiptNumber();
      } else if (status === "Partial") {
        newRecord.paidAmount = paidAmount;
        newRecord.paidDate = paidDate || new Date();
        newRecord.receipt = receipt || generateReceiptNumber();
      }

      student.feeRecords.push(newRecord);
    }

    await student.save();

    res.json({
      success: true,
      message: "Fee record updated successfully",
      data: student.feeRecords.find(
        (r) => r.month === month && r.year === parseInt(year),
      ),
    });
  } catch (error) {
    console.error("Update fee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update fee record",
    });
  }
};

// Get fee overview by campus/class
const getFeeOverview = async (req, res) => {
  try {
    const { campusId, classId, month = "June", year = 2026 } = req.query;

    let query = { active: true };
    if (campusId) query.campusId = campusId;
    if (classId) query.classId = classId;

    const students = await Student.find(query);

    let totalStudents = 0;
    let paid = 0;
    let partial = 0;
    let unpaid = 0;
    let totalCollected = 0;

    students.forEach((student) => {
      if (isMonthBeforeFeeStart(student, month)) return;
      totalStudents++;

      const feeRecord = student.feeRecords.find(
        (r) => r.month === month && r.year === parseInt(year),
      );

      if (feeRecord) {
        if (feeRecord.status === "Paid") {
          paid++;
          totalCollected += feeRecord.amount;
        } else if (feeRecord.status === "Partial") {
          partial++;
          totalCollected += feeRecord.paidAmount || 0;
        } else {
          unpaid++;
        }
      } else {
        unpaid++;
      }
    });

    const expectedTotal = students.reduce((sum, student) => {
      if (isMonthBeforeFeeStart(student, month)) return sum;
      const feeRecord = student.feeRecords.find(
        (r) => r.month === month && r.year === parseInt(year),
      );
      return sum + (feeRecord?.amount || student.monthlyFee || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        month,
        year,
        totalStudents,
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
    console.error("Get fee overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee overview",
    });
  }
};

// Get fee records for a specific month across all students
const getMonthlyFeeReport = async (req, res) => {
  try {
    const { month, year = 2026, campusId } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required",
      });
    }

    let query = { active: true };
    if (campusId) query.campusId = campusId;

    const students = await Student.find(query).populate("classId");

    const report = students.map((student) => {
      if (isMonthBeforeFeeStart(student, month)) {
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
          feeStatus: "N/A",
          paidAmount: 0,
          amount: 0,
          paidDate: null,
          receipt: null,
          feeStartMonth: resolveStudentFeeStartMonth(student),
        };
      }

      const feeRecord = student.feeRecords.find(
        (r) => r.month === month && r.year === parseInt(year),
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
          feeRecord?.paidAmount ||
          (feeRecord?.status === "Paid" ? feeRecord.amount : 0),
        amount: feeRecord?.amount || student.monthlyFee || 0,
        paidDate: feeRecord?.paidDate,
        receipt: feeRecord?.receipt,
        feeStartMonth: resolveStudentFeeStartMonth(student),
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
    console.error("Get monthly fee report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly fee report",
    });
  }
};

// Generate challan for a student
const generateChallan = async (req, res) => {
  try {
    const { studentId, month, year = 2026 } = req.params;

    const student = await Student.findOne({ id: studentId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const targetIndex = ACADEMIC_FEE_MONTHS.indexOf(month);
    const calendarMonthIndex = CALENDAR_MONTHS.indexOf(month);
    const yearInt = parseInt(year);

    if (targetIndex === -1 || calendarMonthIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    const academicStartYear = calendarMonthIndex < 2 ? yearInt - 1 : yearInt;
    const feeStartIndex = getStudentFeeStartIndex(student);

    if (targetIndex < feeStartIndex) {
      return res.status(400).json({
        success: false,
        message: `Fee is not applicable before the student's fee start month (${resolveStudentFeeStartMonth(student)})`,
      });
    }

    // Calculate arrears for previous months
    let arrears = 0;
    for (let i = feeStartIndex; i < targetIndex; i++) {
      const prevMonth = ACADEMIC_FEE_MONTHS[i];
      const prevYear =
        prevMonth === "January" || prevMonth === "February"
          ? academicStartYear + 1
          : academicStartYear;
      const record = student.feeRecords.find(
        (r) => r.month === prevMonth && r.year === prevYear,
      );

      if (!record || record.status === "Unpaid") {
        arrears += student.monthlyFee;
      } else if (record.status === "Partial") {
        arrears +=
          (record.amount || student.monthlyFee) - (record.paidAmount || 0);
      }
    }

    const currentFee = student.monthlyFee;
    const lateSurcharge = 200;
    const totalWithinDue = currentFee + arrears;
    const totalAfterDue = totalWithinDue + lateSurcharge;

    const challanNo = student.id;
    const issueDate = `${year}-${String(calendarMonthIndex + 1).padStart(2, "0")}-01`;
    const dueDate = `${year}-${String(calendarMonthIndex + 1).padStart(2, "0")}-10`;

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
        challanNo,
        issueDate,
        dueDate,
        currentFee,
        arrears,
        totalWithinDue,
        lateSurcharge,
        totalAfterDue,
        feeStatus:
          student.feeRecords.find(
            (r) => r.month === month && r.year === yearInt,
          )?.status || "Unpaid",
      },
    });
  } catch (error) {
    console.error("Generate challan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate challan",
    });
  }
};

module.exports = {
  getStudentFeeSummary,
  updateFee,
  getFeeOverview,
  getMonthlyFeeReport,
  generateChallan,
};
