const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  campusId: { type: String, enum: ["boys", "girls", "kids"], required: true },
  name: { type: String, required: true },
  sections: [{ type: String, uppercase: true }],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// FIXED for mongoose 9.x - remove 'next' parameter
classSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

classSchema.index({ campusId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
