const Job = require('../models/Job');
// Mock job controller
const getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, location, type, experience } = req.query;
    const query = {};
    if (category) query.category = category;
    if (location) query['location.city'] = location;
    if (type) query.jobType = type;
    if (experience) query.experienceLevel = experience;

    const jobs = await Job.find(query)
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo rating')
      .populate('postedBy', 'name email');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
};

const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    jobData.postedBy = req.user ? req.user._id : null; // If using auth middleware
    const job = await Job.create(jobData);
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

const updateJob = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Job update not implemented yet'
  });
};

const deleteJob = async (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Job deletion not implemented yet'
  });
};

const searchJobs = async (req, res) => {
  try {
    const { q, location, category, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (q) {
      // Using a regex for a more flexible "contains" search vs. text index
      query.title = { $regex: q, $options: 'i' }; 
    }
    if (location) query['location.city'] = { $regex: location, $options: 'i' };
    if (category) query.category = category;

    const jobs = await Job.find(query)
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      query: { q, location, category }
    });

  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching jobs'
    });
  }
};

const getJobStats = async (req, res) => {
  try {
    const stats = {
      totalJobs: 12534,
      activeJobs: 8976,
      companiesHiring: 456,
      newJobsToday: 23,
      popularCategories: [
        { name: 'IT Jobs', count: 3245 },
        { name: 'Sales Jobs', count: 2156 },
        { name: 'Marketing Jobs', count: 1876 }
      ]
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job statistics'
    });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  searchJobs,
  getJobStats
};
