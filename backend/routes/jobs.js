const express = require('express');
const { body } = require('express-validator');
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
  getJobStats
} = require('../controllers/jobController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', getJobs);

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
router.get('/search', searchJobs);

// @desc    Get job statistics
// @route   GET /api/jobs/stats
// @access  Public
router.get('/stats', getJobStats);

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', getJobById);

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Company/Admin)
router.post('/', protect, authorize('company', 'admin'), [
  body('title').notEmpty().withMessage('Job title is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('location.city').notEmpty().withMessage('City is required'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number'),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary']).withMessage('Invalid job type'),
  body('experienceLevel').isIn(['fresher', 'junior', 'mid', 'senior', 'lead']).withMessage('Invalid experience level'),
  body('category').notEmpty().withMessage('Job category is required'),
  body('applicationDeadline').isISO8601().withMessage('Invalid application deadline')
], createJob);

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Company/Admin)
router.put('/:id', protect, authorize('company', 'admin'), updateJob);

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Company/Admin)
router.delete('/:id', protect, authorize('company', 'admin'), deleteJob);

module.exports = router;
