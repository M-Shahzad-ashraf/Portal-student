const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mmhs_db').then(async () => {
  const Student = require('./models/Student');
  
  // Manually added students IDs (added by user - Jun 27 2026 after 5pm)
  const keepIds = ['S5005', 'B1001', 'S1209', 'S1208'];
  
  console.log('Keeping these students:', keepIds);
  
  // Delete all students NOT in keepIds
  const result = await Student.deleteMany({ id: { $nin: keepIds } });
  console.log('Deleted students:', result.deletedCount);
  
  const remaining = await Student.find().select('id name campusId classId section');
  console.log('\nRemaining students:');
  remaining.forEach(s => console.log('  -', s.id, s.name, s.campusId, s.classId, s.section));
  
  mongoose.disconnect();
  console.log('\nDone!');
});
