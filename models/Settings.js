const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: "Muslim Model High School Pattoki",
    },
    schoolAddress: {
      type: String,
      default: "Pattoki City, Kasur, Punjab",
    },
    schoolPhone: {
      type: String,
      default: "049-4412345",
    },
    bankDetails: {
      type: String,
      default:
        "Allied Bank Ltd, Pattoki (Branch Code: 0292) A/C No: 0110-38491029-01",
    },
    defaultFee: {
      type: Number,
      default: 2000,
    },
    lateFee: {
      type: Number,
      default: 200,
    },
    dueDateDay: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

// Singleton: always upsert a single settings document
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

settingsSchema.statics.updateSingleton = async function (updates) {
  const doc = await this.findOneAndUpdate(
    {},
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
};

module.exports = mongoose.model("Settings", settingsSchema);
