const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false // Optional: If tied to specific application
  },
  originalFile: {
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    hash: {
      type: String,
      required: true // For version control and duplicate detection
    }
  },
  aiData: {
    // STRUCTURED EXTRACTION
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      location: {
        city: String,
        state: String,
        country: String
      },
      linkedin: String,
      github: String,
      portfolio: String
    },
    skills: [String],
    experience: [{
      title: String,
      company: String,
      location: String,
      startDate: String,
      endDate: String,
      duration: String,
      description: String,
      summary: String, // GPT-generated summary
      keyAchievements: [String]
    }],
    education: [{
      degree: String,
      institution: String,
      location: String,
      graduationYear: String,
      gpa: String,
      major: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: String,
      expiryDate: String,
      credentialId: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      duration: String
    }],
    languages: [{
      language: String,
      proficiency: { type: String, enum: ['basic', 'intermediate', 'advanced', 'native'] }
    }],
    // CONFIDENCE SCORES (0-1)
    confidenceScores: {
      personalInfo: { type: Number, default: 0, min: 0, max: 1 },
      skills: { type: Number, default: 0, min: 0, max: 1 },
      experience: { type: Number, default: 0, min: 0, max: 1 },
      education: { type: Number, default: 0, min: 0, max: 1 },
      overall: { type: Number, default: 0, min: 0, max: 1 }
    }
  },
  userEdits: {
    // TRACK MANUAL OVERRIDES
    modifiedPersonalInfo: {
      name: String,
      email: String,
      phone: String,
      location: {
        city: String,
        state: String,
        country: String
      }
    },
    modifiedSkills: [String],
    modifiedExperience: [{
      title: String,
      company: String,
      location: String,
      startDate: String,
      endDate: String,
      description: String,
      isUserModified: { type: Boolean, default: true }
    }],
    modifiedEducation: [{
      degree: String,
      institution: String,
      graduationYear: String,
      isUserModified: { type: Boolean, default: true }
    }],
    lastModifiedAt: { type: Date, default: Date.now }
  },
  atsScore: {
    overall: { type: Number, default: 0, min: 0, max: 100 },
    breakdown: {
      formatting: { type: Number, default: 0, min: 0, max: 100 },
      keywords: { type: Number, default: 0, min: 0, max: 100 },
      structure: { type: Number, default: 0, min: 0, max: 100 },
      readability: { type: Number, default: 0, min: 0, max: 100 }
    },
    recommendations: [String],
    lastCalculated: { type: Date, default: Date.now }
  },
  processing: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    aiExtractionComplete: { type: Boolean, default: false },
    atsAnalysisComplete: { type: Boolean, default: false },
    errorMessage: String,
    processingStarted: Date,
    processingCompleted: Date
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String], // User-defined tags for organization
  visibility: {
    type: String,
    enum: ['private', 'public', 'employers'],
    default: 'private'
  }
}, {
  timestamps: true
});

// Indexes for better performance
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ 'originalFile.hash': 1 });
resumeSchema.index({ jobId: 1 });
resumeSchema.index({ 'processing.status': 1 });
resumeSchema.index({ 'aiData.skills': 1 });
resumeSchema.index({ isActive: 1 });

// Virtual for getting final data (AI + user edits)
resumeSchema.virtual('finalData').get(function() {
  return {
    personalInfo: { ...this.aiData.personalInfo, ...this.userEdits.modifiedPersonalInfo },
    skills: this.userEdits.modifiedSkills.length > 0 ? this.userEdits.modifiedSkills : this.aiData.skills,
    experience: this.userEdits.modifiedExperience.length > 0 ? this.userEdits.modifiedExperience : this.aiData.experience,
    education: this.userEdits.modifiedEducation.length > 0 ? this.userEdits.modifiedEducation : this.aiData.education,
    certifications: this.aiData.certifications,
    projects: this.aiData.projects,
    languages: this.aiData.languages
  };
});

// Method to calculate ATS score
resumeSchema.methods.calculateATSScore = function() {
  let formattingScore = 85; // Base formatting score
  let keywordsScore = 70;   // Base keywords score
  let structureScore = 80;  // Base structure score
  let readabilityScore = 75; // Base readability score

  // Improve scores based on content completeness
  if (this.aiData.skills && this.aiData.skills.length > 5) keywordsScore += 10;
  if (this.aiData.experience && this.aiData.experience.length > 0) structureScore += 10;
  if (this.aiData.education && this.aiData.education.length > 0) structureScore += 5;
  if (this.aiData.personalInfo.email && this.aiData.personalInfo.phone) formattingScore += 10;

  // Cap scores at 100
  formattingScore = Math.min(formattingScore, 100);
  keywordsScore = Math.min(keywordsScore, 100);
  structureScore = Math.min(structureScore, 100);
  readabilityScore = Math.min(readabilityScore, 100);

  this.atsScore.breakdown = {
    formatting: formattingScore,
    keywords: keywordsScore,
    structure: structureScore,
    readability: readabilityScore
  };

  this.atsScore.overall = Math.round((formattingScore + keywordsScore + structureScore + readabilityScore) / 4);
  this.atsScore.lastCalculated = new Date();

  return this.atsScore.overall;
};

// Method to generate ATS recommendations
resumeSchema.methods.generateATSRecommendations = function() {
  const recommendations = [];

  if (this.atsScore.breakdown.keywords < 80) {
    recommendations.push("Add more relevant keywords from the job description");
  }
  if (this.atsScore.breakdown.formatting < 80) {
    recommendations.push("Improve resume formatting for better ATS readability");
  }
  if (this.atsScore.breakdown.structure < 80) {
    recommendations.push("Enhance resume structure with clear sections");
  }
  if (!this.aiData.personalInfo.linkedin) {
    recommendations.push("Add LinkedIn profile URL");
  }
  if (this.aiData.skills.length < 5) {
    recommendations.push("Include more relevant technical skills");
  }

  this.atsScore.recommendations = recommendations;
  return recommendations;
};

// Static method to find resumes by user
resumeSchema.statics.findByUser = function(userId, options = {}) {
  return this.find({
    userId,
    isActive: true,
    ...options
  }).sort({ createdAt: -1 });
};

// Static method to find duplicate resumes by hash
resumeSchema.statics.findDuplicateByHash = function(hash, userId) {
  return this.findOne({
    'originalFile.hash': hash,
    userId,
    isActive: true
  });
};

module.exports = mongoose.model('Resume', resumeSchema);
