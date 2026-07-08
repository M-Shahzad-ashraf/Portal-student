const mongoose = require("mongoose");

const feeRecordSchema = new mongoose.Schema({
  month: { type: String, required: true },
  year: { type: Number, default: 2026 },
  status: {
    type: String,
    enum: ["Paid", "Partial", "Unpaid"],
    default: "Unpaid",
  },
  amount: { type: Number, required: true, default: 2000 },
  paidAmount: { type: Number, default: 0 },
  paidDate: { type: Date },
  receipt: { type: String },
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  fatherPhone: { type: String },
  campusId: { type: String, enum: ["boys", "girls", "kids"], required: true },
  classId: { type: String, required: true },
  className: { type: String },
  section: { type: String, required: true, uppercase: true },
  rollNo: { type: String, unique: true, sparse: true },
  gender: { type: String, enum: ["M", "F"], required: true },
  dob: { type: Date },
  admissionDate: { type: Date, default: Date.now },
  feeStartMonth: {
    type: String,
    enum: [
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
    ],
  },
  bloodGroup: { type: String },
  bForm: { type: String },
  email: { type: String, lowercase: true },
  address: { type: String },
  monthlyFee: { type: Number, default: 2000 },
  feeRecords: [feeRecordSchema],
  notes: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp - FIXED for mongoose 9.x (remove 'next' parameter)
studentSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

// Generate roll number if not provided - FIXED
studentSchema.pre("save", async function () {
  if (!this.rollNo && this.isNew) {
    const Student = mongoose.model("Student");
    const campusCode = this.campusId.charAt(0).toUpperCase();
    const prefix = `${campusCode}${this.classId}${this.section}`;
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingStudents = await Student.find({
      rollNo: { $regex: `^${escapedPrefix}\\d+$` },
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
    this.rollNo = `${prefix}${String(nextRoll).padStart(2, "0")}`;

    while (await Student.exists({ rollNo: this.rollNo })) {
      nextRoll++;
      this.rollNo = `${prefix}${String(nextRoll).padStart(2, "0")}`;
    }
  }
});

// Virtuals
studentSchema.virtual("totalPaid").get(function () {
  return this.feeRecords.reduce((sum, record) => {
    if (record.status === "Paid") return sum + record.amount;
    if (record.status === "Partial") return sum + (record.paidAmount || 0);
    return sum;
  }, 0);
});

studentSchema.virtual("totalDue").get(function () {
  const monthsPassed = new Date().getMonth() + 1;
  const expectedTotal = monthsPassed * this.monthlyFee;
  return Math.max(0, expectedTotal - this.totalPaid);
});

studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Student", studentSchema);
