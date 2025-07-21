const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['jobseeker', 'company', 'admin'],
    default: 'jobseeker'
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    location: {
      city: String,
      state: String,
      country: { type: String, default: 'India' }
    },
    bio: String,
    skills: [String],
    experience: {
      years: { type: Number, default: 0 },
      level: { type: String, enum: ['fresher', 'junior', 'mid', 'senior', 'lead'], default: 'fresher' }
    },
    education: [{
      degree: String,
      institution: String,
      year: Number,
      grade: String
    }],
    resume: {
      filename: String,
      url: String,
      uploadDate: { type: Date, default: Date.now }
    },
    profilePicture: {
      filename: String,
      url: String
    },
    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String
    }
  },
  preferences: {
    jobTypes: [{ type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'] }],
    salaryRange: {
      min: Number,
      max: Number
    },
    preferredLocations: [String],
    industries: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  profileStrength: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for search
userSchema.index({ email: 1 });
userSchema.index({ 'profile.location.city': 1 });
userSchema.index({ 'profile.skills': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Calculate profile strength
userSchema.methods.calculateProfileStrength = function() {
  let strength = 0;
  
  if (this.name) strength += 10;
  if (this.email) strength += 10;
  if (this.profile.phone) strength += 10;
  if (this.profile.bio) strength += 15;
  if (this.profile.skills && this.profile.skills.length > 0) strength += 15;
  if (this.profile.education && this.profile.education.length > 0) strength += 15;
  if (this.profile.resume && this.profile.resume.url) strength += 20;
  if (this.profile.profilePicture && this.profile.profilePicture.url) strength += 5;
  
  this.profileStrength = strength;
  return strength;
};

module.exports = mongoose.model('User', userSchema);
