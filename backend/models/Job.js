const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [String],
  responsibilities: [String],
  location: {
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'India' },
    isRemote: { type: Boolean, default: false },
    remoteType: { type: String, enum: ['full-remote', 'hybrid', 'on-site'], default: 'on-site' }
  },
  salary: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' }
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', 'junior', 'mid', 'senior', 'lead'],
    required: true
  },
  category: {
    type: String,
    required: [true, 'Job category is required']
  },
  skills: [String],
  benefits: [String],
  applicationDeadline: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'paused'],
    default: 'published'
  }
}, {
  timestamps: true
});

// Indexes for better search performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ isActive: 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ applicationDeadline: 1 });

// Virtual for application URL
jobSchema.virtual('applicationUrl').get(function() {
  return `/jobs/${this._id}/apply`;
});

// Method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to check if job is expired
jobSchema.methods.isExpired = function() {
  return new Date() > this.applicationDeadline;
};

// Static method to find active jobs
jobSchema.statics.findActiveJobs = function(filters = {}) {
  return this.find({
    isActive: true,
    status: 'published',
    applicationDeadline: { $gte: new Date() },
    ...filters
  });
};

module.exports = mongoose.model('Job', jobSchema);
