const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mmhs_db').then(async () => {
  const Student = require('./models/Student');
  
  // Show all students sorted by createdAt to see manually added ones
  const recent = await Student.find({active:true}).sort({createdAt:-1}).limit(10).select('id name campusId classId section createdAt');
  console.log('Recent 10 students:');
  recent.forEach(s => console.log('  -', s.id, '|', s.name, '| campus:', s.campusId, '| class:', s.classId, '| section:', s.section, '|', new Date(s.createdAt).toLocaleString()));
  
  const total = await Student.countDocuments({active: true});
  console.log('\nTotal active students:', total);
  
  mongoose.disconnect();
});
