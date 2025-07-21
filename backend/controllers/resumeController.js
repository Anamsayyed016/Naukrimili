const { validationResult } = require('express-validator');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const { generateFileHash } = require('../middlewares/uploadMiddleware');
const { extractResumeData } = require('../services/aiExtractionService');
const { analyzeATSCompatibility } = require('../services/atsService');
const fs = require('fs');
const path = require('path');

// @desc    Upload a new resume
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    console.log('[UPLOAD] Uploading new resume...');
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { jobId, tags, visibility } = req.body;
    
    // Generate file hash for duplicate detection
    const fileHash = await generateFileHash(req.file.path);
    console.log(`[UPLOAD] File hash generated: ${fileHash}`);
    
    // Check for duplicate resumes
    const existingResume = await Resume.findDuplicateByHash(fileHash, req.user.id);
    if (existingResume) {
      // Delete the uploaded file since it's a duplicate
      fs.unlinkSync(req.file.path);
      console.log('[UPLOAD] Duplicate resume detected, upload aborted.');
      
      return res.status(400).json({
        success: false,
        message: 'This resume has already been uploaded',
        existingResumeId: existingResume._id
      });
    }

    // Create resume record
    const resume = await Resume.create({
      userId: req.user.id,
      jobId: jobId || null,
      originalFile: {
        url: req.file.path,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        hash: fileHash
      },
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      visibility: visibility || 'private',
      processing: {
        status: 'pending',
        processingStarted: new Date()
      }
    });
    console.log(`[UPLOAD] Resume DB record created: ${resume._id}`);

    // Start AI processing asynchronously
    processResumeAI(resume._id).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        filename: resume.originalFile.filename,
        status: resume.processing.status,
        uploadedAt: resume.createdAt
      }
    });

  } catch (error) {
    console.error('[UPLOAD] Resume upload error:', error);
    
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading resume'
    });
  }
};

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tags } = req.query;
    
    const filters = { userId: req.user.id, isActive: true };
    
    if (status) filters['processing.status'] = status;
    if (tags) filters.tags = { $in: tags.split(',') };

    const resumes = await Resume.find(filters)
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Resume.countDocuments(filters);

    res.json({
      success: true,
      resumes: resumes.map(resume => ({
        id: resume._id,
        filename: resume.originalFile.filename,
        status: resume.processing.status,
        atsScore: resume.atsScore.overall,
        tags: resume.tags,
        visibility: resume.visibility,
        uploadedAt: resume.createdAt,
        job: resume.jobId
      })),
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resumes'
    });
  }
};

// @desc    Get single resume by ID
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    }).populate('jobId', 'title company description requirements');

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      resume: {
        id: resume._id,
        originalFile: {
          filename: resume.originalFile.filename,
          size: resume.originalFile.size,
          mimetype: resume.originalFile.mimetype
        },
        aiData: resume.aiData,
        userEdits: resume.userEdits,
        atsScore: resume.atsScore,
        processing: resume.processing,
        tags: resume.tags,
        visibility: resume.visibility,
        finalData: resume.finalData,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        job: resume.jobId
      }
    });

  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resume'
    });
  }
};

// @desc    Update resume data (user edits)
// @route   PUT /api/resumes/:id
// @access  Private
const updateResumeData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const { userEdits, tags, visibility } = req.body;

    // Update user edits
    if (userEdits) {
      resume.userEdits = {
        ...resume.userEdits,
        ...userEdits,
        lastModifiedAt: new Date()
      };
    }

    // Update tags and visibility
    if (tags) resume.tags = tags;
    if (visibility) resume.visibility = visibility;

    // Recalculate ATS score after user edits
    resume.calculateATSScore();
    resume.generateATSRecommendations();

    await resume.save();

    res.json({
      success: true,
      message: 'Resume updated successfully',
      resume: {
        id: resume._id,
        userEdits: resume.userEdits,
        atsScore: resume.atsScore,
        finalData: resume.finalData
      }
    });

  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resume'
    });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Soft delete
    resume.isActive = false;
    await resume.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resume'
    });
  }
};

// @desc    Analyze resume for specific job
// @route   POST /api/resumes/:id/analyze/:jobId
// @access  Private
const analyzeResumeForJob = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    const job = await Job.findById(req.params.jobId);

    if (!resume || !job) {
      return res.status(404).json({
        success: false,
        message: 'Resume or job not found'
      });
    }

    // Perform job-specific analysis
    const analysis = await analyzeATSCompatibility(resume, job);

    res.json({
      success: true,
      analysis: {
        matchScore: analysis.matchScore,
        keywordMatches: analysis.keywordMatches,
        missingKeywords: analysis.missingKeywords,
        recommendations: analysis.recommendations,
        skillsAlignment: analysis.skillsAlignment
      }
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing resume'
    });
  }
};

// @desc    Get ATS score for resume
// @route   GET /api/resumes/:id/ats-score
// @access  Private
const getATSScore = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Recalculate ATS score
    const score = resume.calculateATSScore();
    const recommendations = resume.generateATSRecommendations();
    
    await resume.save();

    res.json({
      success: true,
      atsScore: {
        overall: score,
        breakdown: resume.atsScore.breakdown,
        recommendations: recommendations,
        lastCalculated: resume.atsScore.lastCalculated
      }
    });

  } catch (error) {
    console.error('ATS score error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating ATS score'
    });
  }
};

// @desc    Process AI extraction (manual trigger)
// @route   POST /api/resumes/:id/process-ai
// @access  Private
const processAIExtraction = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Start AI processing
    processResumeAI(resume._id).catch(console.error);

    res.json({
      success: true,
      message: 'AI processing started',
      status: 'processing'
    });

  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting AI processing'
    });
  }
};

// @desc    Download resume file
// @route   GET /api/resumes/:id/download
// @access  Private
const downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const filePath = resume.originalFile.url;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath, resume.originalFile.filename);

  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading resume'
    });
  }
};

// Helper function to process resume with AI
const processResumeAI = async (resumeId) => {
  try {
    console.log(`[AI] Starting AI processing for resume: ${resumeId}`);
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      console.log(`[AI] Resume not found: ${resumeId}`);
      return;
    }

    // Update status to processing
    resume.processing.status = 'processing';
    resume.processing.processingStarted = new Date();
    await resume.save();
    console.log(`[AI] Status set to 'processing' for resume: ${resumeId}`);

    // Extract data using AI service
    const extractedData = await extractResumeData(resume.originalFile.url);
    console.log(`[AI] AI extraction complete for resume: ${resumeId}`);
    
    // Update resume with AI data
    resume.aiData = extractedData;
    resume.processing.aiExtractionComplete = true;

    // Calculate ATS score
    resume.calculateATSScore();
    resume.generateATSRecommendations();
    resume.processing.atsAnalysisComplete = true;
    console.log(`[AI] ATS scoring and recommendations complete for resume: ${resumeId}`);

    // Mark as completed
    resume.processing.status = 'completed';
    resume.processing.processingCompleted = new Date();

    await resume.save();
    console.log(`[AI] AI processing completed and saved for resume: ${resumeId}`);

  } catch (error) {
    console.error('[AI] AI processing error:', error);
    
    // Update status to failed
    const resume = await Resume.findById(resumeId);
    if (resume) {
      resume.processing.status = 'failed';
      resume.processing.errorMessage = error.message;
      await resume.save();
      console.log(`[AI] Status set to 'failed' for resume: ${resumeId}`);
    }
  }
};

module.exports = {
  uploadResume,
  getResumes,
  getResumeById,
  updateResumeData,
  deleteResume,
  analyzeResumeForJob,
  getATSScore,
  processAIExtraction,
  downloadResume
};
