const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all jobs with search and filters
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      location, 
      type, 
      level, 
      remote, 
      page = 1, 
      limit = 10 
    } = req.query;

    // Build search query
    let query = { status: 'active' };

    if (search) {
      query.$text = { $search: search };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    if (level) {
      query.level = level;
    }

    if (remote === 'true') {
      query.remote = true;
    }

    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate('postedBy', 'name company.name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch jobs',
      error: error.message 
    });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name company');

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.json({
      success: true,
      data: { job }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch job',
      error: error.message 
    });
  }
});

// Create new job (employers only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requirements,
      benefits,
      skills,
      type,
      level,
      remote,
      salary
    } = req.body;

    // Basic validation
    if (!title || !company || !location || !description || !type || !level) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: title, company, location, description, type, level' 
      });
    }

    const job = new Job({
      title,
      company,
      location,
      description,
      requirements: requirements || [],
      benefits: benefits || [],
      skills: skills || [],
      type,
      level,
      remote: remote || false,
      salary,
      postedBy: req.user.userId
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: { job }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create job',
      error: error.message 
    });
  }
});

// Update job (job owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this job' 
      });
    }

    // Update job
    Object.assign(job, req.body);
    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update job',
      error: error.message 
    });
  }
});

// Delete job (job owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
    }

    // Check ownership
    if (job.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this job' 
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete job',
      error: error.message 
    });
  }
});

module.exports = router;