const crypto = require("crypto");

// Generate unique student ID
const generateStudentId = async (StudentModel) => {
  const lastStudent = await StudentModel.findOne().sort({ id: -1 });
  let lastNum = 1000;

  if (lastStudent && lastStudent.id) {
    const match = lastStudent.id.match(/S(\d+)/);
    if (match) lastNum = parseInt(match[1]);
  }

  return `S${lastNum + 1}`;
};

// Generate class ID
const generateClassId = (campusId, classIndex) => {
  const prefix = campusId.charAt(0);
  return `${prefix}${classIndex + 1}`;
};

// Parse Excel/CSV date
const parseExcelDate = (value) => {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }
  return null;
};

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

// Format currency
const formatCurrency = (amount) => {
  return `Rs ${amount.toLocaleString()}`;
};

// Calculate fee summary for a student
const calculateFeeSummary = (feeRecords, monthlyFee) => {
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
  const currentMonth = new Date().getMonth();

  let totalPaid = 0;
  let totalDue = 0;

  for (let i = 0; i <= currentMonth; i++) {
    const record = feeRecords.find((r) => r.month === months[i]);
    if (record) {
      if (record.status === "Paid") totalPaid += record.amount;
      else if (record.status === "Partial") totalPaid += record.paidAmount || 0;
      else totalDue += monthlyFee;
    } else {
      totalDue += monthlyFee;
    }
  }

  return {
    totalPaid,
    totalDue,
    outstanding: Math.max(0, totalDue - totalPaid),
  };
};

// Generate receipt number
const generateReceiptNumber = () => {
  return `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// Paginate results
const paginate = (data, page = 1, limit = 50) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit),
      hasNext: endIndex < data.length,
      hasPrev: startIndex > 0,
    },
  };
};

module.exports = {
  generateStudentId,
  generateClassId,
  parseExcelDate,
  getCurrentDate,
  formatCurrency,
  calculateFeeSummary,
  generateReceiptNumber,
  paginate,
};
