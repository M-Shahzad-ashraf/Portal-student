const Class = require("../models/Class");
const Student = require("../models/Student");

// Get all classes by campus
const getAllClasses = async (req, res) => {
  try {
    const { campusId } = req.query;
    let query = {};

    if (campusId) query.campusId = campusId;

    const classes = await Class.find(query).sort({ order: 1, name: 1 });

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error("Get all classes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
    });
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Get student count for this class
    const studentCount = await Student.countDocuments({
      campusId: classDoc.campusId,
      classId: classDoc.id,
      active: true,
    });

    // Get students per section
    const sectionsWithCount = {};
    for (const section of classDoc.sections) {
      sectionsWithCount[section] = await Student.countDocuments({
        campusId: classDoc.campusId,
        classId: classDoc.id,
        section,
        active: true,
      });
    }

    res.json({
      success: true,
      data: {
        ...classDoc.toObject(),
        studentCount,
        sectionsWithCount,
      },
    });
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class",
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const { campusId, name, sections } = req.body;

    // Check if class already exists
    const existingClass = await Class.findOne({ campusId, name });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: "Class already exists in this campus",
      });
    }

    // Generate class ID
    const classes = await Class.find({ campusId });
    const nextNumber = classes.length + 1;
    const id = `${campusId.charAt(0)}${nextNumber}`;

    const classDoc = new Class({
      id,
      campusId,
      name,
      sections: sections || ["A"],
      order: nextNumber,
    });

    await classDoc.save();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: classDoc,
    });
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create class",
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const { name, sections } = req.body;

    if (name) classDoc.name = name;
    if (sections) classDoc.sections = sections;

    await classDoc.save();

    res.json({
      success: true,
      message: "Class updated successfully",
      data: classDoc,
    });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update class",
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if there are students in this class
    const studentCount = await Student.countDocuments({
      campusId: classDoc.campusId,
      classId: classDoc.id,
      active: true,
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class with ${studentCount} students. Move or delete students first.`,
      });
    }

    await Class.deleteOne({ id: req.params.id });

    res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete class",
    });
  }
};

// Add section to class
const addSection = async (req, res) => {
  try {
    const { section } = req.body;
    const classDoc = await Class.findOne({ id: req.params.id });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const sectionUpper = section.toUpperCase();
    if (classDoc.sections.includes(sectionUpper)) {
      return res.status(400).json({
        success: false,
        message: "Section already exists",
      });
    }

    classDoc.sections.push(sectionUpper);
    await classDoc.save();

    res.json({
      success: true,
      message: "Section added successfully",
      data: classDoc,
    });
  } catch (error) {
    console.error("Add section error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add section",
    });
  }
};

// Remove section from class
const removeSection = async (req, res) => {
  try {
    const classDoc = await Class.findOne({ id: req.params.id });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const { section } = req.params;

    // Check if there are students in this section
    const studentCount = await Student.countDocuments({
      campusId: classDoc.campusId,
      classId: classDoc.id,
      section,
      active: true,
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove section with ${studentCount} students`,
      });
    }

    classDoc.sections = classDoc.sections.filter((s) => s !== section);
    await classDoc.save();

    res.json({
      success: true,
      message: "Section removed successfully",
      data: classDoc,
    });
  } catch (error) {
    console.error("Remove section error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove section",
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addSection,
  removeSection,
};
