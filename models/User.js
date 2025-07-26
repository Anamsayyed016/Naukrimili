const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer', 'admin'],
    default: 'jobseeker'
  },
  
  // Profile
  avatar: String,
  bio: String,
  location: String,
  phone: String,
  
  // Job Seeker Fields
  skills: [String],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  
  // Employer Fields
  company: {
    name: String,
    website: String,
    industry: String,
    size: String
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'skills': 1 });

module.exports = mongoose.model('User', userSchema);