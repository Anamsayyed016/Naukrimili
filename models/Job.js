const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  
  // Job Details
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  benefits: [String],
  skills: [String],
  
  // Employment Details
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  level: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  
  // Salary
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Relations
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  
  // Metrics
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  
  // Dates
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes for search and performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ location: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ level: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);