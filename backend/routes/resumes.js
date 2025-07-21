const express = require('express');
const { body } = require('express-validator');
const {
  uploadResume,
  getResumes,
  getResumeById,
  updateResumeData,
  deleteResume,
  analyzeResumeForJob,
  getATSScore,
  processAIExtraction,
  downloadResume
} = require('../controllers/resumeController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const router = express.Router();

// @desc    Upload a new resume
// @route   POST /api/resumes/upload
// @access  Private
router.post('/upload', protect, uploadMiddleware.single('resume'), uploadResume);

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
router.get('/', protect, getResumes);

// @desc    Get single resume by ID
// @route   GET /api/resumes/:id
// @access  Private
router.get('/:id', protect, getResumeById);

// @desc    Update resume data (user edits)
// @route   PUT /api/resumes/:id
// @access  Private
router.put('/:id', protect, [
  body('userEdits.modifiedSkills').optional().isArray(),
  body('userEdits.modifiedPersonalInfo.email').optional().isEmail(),
  body('userEdits.modifiedPersonalInfo.phone').optional().isMobilePhone()
], updateResumeData);

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
router.delete('/:id', protect, deleteResume);

// @desc    Analyze resume for specific job
// @route   POST /api/resumes/:id/analyze/:jobId
// @access  Private
router.post('/:id/analyze/:jobId', protect, analyzeResumeForJob);

// @desc    Get ATS score for resume
// @route   GET /api/resumes/:id/ats-score
// @access  Private
router.get('/:id/ats-score', protect, getATSScore);

// @desc    Process AI extraction (manual trigger)
// @route   POST /api/resumes/:id/process-ai
// @access  Private
router.post('/:id/process-ai', protect, processAIExtraction);

// @desc    Download resume file
// @route   GET /api/resumes/:id/download
// @access  Private
router.get('/:id/download', protect, downloadResume);

module.exports = router;
