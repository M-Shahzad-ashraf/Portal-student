const Student = require("../models/Student");
const Class = require("../models/Class");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ active: true });
    const totalClasses = await Class.countDocuments();

    // Campus wise counts
    const boysCount = await Student.countDocuments({
      campusId: "boys",
      active: true,
    });
    const girlsCount = await Student.countDocuments({
      campusId: "girls",
      active: true,
    });
    const kidsCount = await Student.countDocuments({
      campusId: "kids",
      active: true,
    });

    // Fee statistics for current month (June)
    const currentMonth = "June";
    const currentYear = 2026;

    const students = await Student.find({ active: true });

    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let totalCollected = 0;

    students.forEach((student) => {
      const feeRecord = student.feeRecords.find(
        (r) => r.month === currentMonth && r.year === currentYear,
      );

      if (feeRecord) {
        if (feeRecord.status === "Paid") {
          paidCount++;
          totalCollected += feeRecord.amount;
        } else if (feeRecord.status === "Partial") {
          partialCount++;
          totalCollected += feeRecord.paidAmount || 0;
        } else {
          unpaidCount++;
        }
      } else {
        unpaidCount++;
      }
    });

    // Campus wise fee statistics
    const campusFeeStats = {};
    for (const campus of ["boys", "girls", "kids"]) {
      const campusStudents = students.filter((s) => s.campusId === campus);
      let campusPaid = 0;
      let campusPartial = 0;
      let campusUnpaid = 0;
      let campusCollected = 0;

      campusStudents.forEach((student) => {
        const feeRecord = student.feeRecords.find(
          (r) => r.month === currentMonth && r.year === currentYear,
        );
        if (feeRecord) {
          if (feeRecord.status === "Paid") {
            campusPaid++;
            campusCollected += feeRecord.amount;
          } else if (feeRecord.status === "Partial") {
            campusPartial++;
            campusCollected += feeRecord.paidAmount || 0;
          } else {
            campusUnpaid++;
          }
        } else {
          campusUnpaid++;
        }
      });

      campusFeeStats[campus] = {
        total: campusStudents.length,
        paid: campusPaid,
        partial: campusPartial,
        unpaid: campusUnpaid,
        collected: campusCollected,
      };
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        campuses: {
          boys: boysCount,
          girls: girlsCount,
          kids: kidsCount,
        },
        feeStats: {
          month: currentMonth,
          year: currentYear,
          paid: paidCount,
          partial: partialCount,
          unpaid: unpaidCount,
          totalCollected,
          collectionRate:
            totalStudents > 0
              ? (((paidCount + partialCount) / totalStudents) * 100).toFixed(2)
              : 0,
        },
        campusFeeStats,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

// Get recent activities (for dashboard)
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent fee updates
    const students = await Student.find({ active: true })
      .sort({ updatedAt: -1 })
      .limit(limit);

    const recentFeeUpdates = [];

    students.forEach((student) => {
      const recentFeeRecords = student.feeRecords
        .filter((r) => r.updatedAt)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 2);

      recentFeeRecords.forEach((record) => {
        recentFeeUpdates.push({
          studentId: student.id,
          studentName: student.name,
          campusId: student.campusId,
          month: record.month,
          status: record.status,
          amount: record.paidAmount || record.amount,
          updatedAt: record.updatedAt,
          receipt: record.receipt,
        });
      });
    });

    // Sort by date and limit
    recentFeeUpdates.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    res.json({
      success: true,
      data: recentFeeUpdates.slice(0, limit),
    });
  } catch (error) {
    console.error("Get recent activities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
    });
  }
};

// Get class-wise student count
const getClassWiseStats = async (req, res) => {
  try {
    const classes = await Class.find();
    const stats = [];

    for (const classDoc of classes) {
      const studentCount = await Student.countDocuments({
        campusId: classDoc.campusId,
        classId: classDoc.id,
        active: true,
      });

      const sectionStats = {};
      for (const section of classDoc.sections) {
        sectionStats[section] = await Student.countDocuments({
          campusId: classDoc.campusId,
          classId: classDoc.id,
          section,
          active: true,
        });
      }

      stats.push({
        classId: classDoc.id,
        className: classDoc.name,
        campusId: classDoc.campusId,
        sections: classDoc.sections,
        totalStudents: studentCount,
        sectionStats,
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get class wise stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class wise statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getClassWiseStats,
};





