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

const getCurrentMonthName = () => CALENDAR_MONTHS[new Date().getMonth()];

const getDefaultFeeStartMonth = (date = new Date()) =>
  CALENDAR_MONTHS[date.getMonth()];

const resolveStudentFeeStartMonth = (student) => {
  if (student.feeStartMonth) return student.feeStartMonth;
  if (student.admissionDate) {
    return CALENDAR_MONTHS[new Date(student.admissionDate).getMonth()];
  }
  return ACADEMIC_FEE_MONTHS[0];
};

const getStudentFeeStartIndex = (student) => {
  const feeStartMonth = resolveStudentFeeStartMonth(student);
  const index = ACADEMIC_FEE_MONTHS.indexOf(feeStartMonth);
  return index === -1 ? 0 : index;
};

const isMonthBeforeFeeStart = (student, month) => {
  const monthIndex = ACADEMIC_FEE_MONTHS.indexOf(month);
  if (monthIndex === -1) return false;
  return monthIndex < getStudentFeeStartIndex(student);
};

const validateFeeStartMonth = (feeStartMonth) => {
  const index = ACADEMIC_FEE_MONTHS.indexOf(feeStartMonth);
  if (index === -1) {
    return { valid: false, message: "Invalid fee start month" };
  }
  if (index < 0) {
    return {
      valid: false,
      message: "Fee start month cannot be before the academic session start (March)",
    };
  }
  return { valid: true };
};

const createFeeRecordsFromStartMonth = (
  monthlyFee,
  feeStartMonth,
  academicStartYear = getAcademicYearStart(),
) => {
  const startIndex = ACADEMIC_FEE_MONTHS.indexOf(feeStartMonth);
  if (startIndex === -1) return [];

  return ACADEMIC_FEE_MONTHS.slice(startIndex).map((month) => ({
    month,
    year: getFeeYearForMonth(month, academicStartYear),
    status: "Unpaid",
    amount: monthlyFee || 2000,
  }));
};

const syncFeeRecordAmounts = (student, monthlyFee) => {
  const nextAmount = Number(monthlyFee);
  if (!Number.isFinite(nextAmount) || nextAmount <= 0) return;
  if (!Array.isArray(student.feeRecords)) return;

  student.feeRecords.forEach((record) => {
    if (record.status === "Paid") return;
    record.amount = nextAmount;
  });
};

module.exports = {
  ACADEMIC_FEE_MONTHS,
  CALENDAR_MONTHS,
  getAcademicYearStart,
  getFeeYearForMonth,
  getCurrentMonthName,
  getDefaultFeeStartMonth,
  resolveStudentFeeStartMonth,
  getStudentFeeStartIndex,
  isMonthBeforeFeeStart,
  validateFeeStartMonth,
  createFeeRecordsFromStartMonth,
  syncFeeRecordAmounts,
};
