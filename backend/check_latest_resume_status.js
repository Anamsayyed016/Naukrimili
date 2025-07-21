// check_latest_resume_status.js
require('dotenv').config();
const mongoose = require('mongoose');
const Resume = require('./models/Resume');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const latest = await Resume.findOne().sort({ createdAt: -1 });
  if (!latest) {
    console.log('No resumes found.');
    process.exit(0);
  }
  console.log('Latest resume _id:', latest._id.toString());
  console.log('processing.status:', latest.processing?.status);
  if (latest.processing?.errorMessage) {
    console.log('processing.errorMessage:', latest.processing.errorMessage);
  }
  mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 