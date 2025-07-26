const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Relations
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Application Data
  resume: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  coverLetter: String,
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  
  // Notes from employer
  notes: String,
  
  // Interview Details
  interview: {
    scheduled: Boolean,
    date: Date,
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person']
    },
    notes: String
  }
}, {
  timestamps: true
});

// Prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);