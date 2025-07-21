const express = require('express');
const router = express.Router();

// @desc    Get user applications (for jobseeker dashboard)
// @route   GET /api/applications
// @access  Private
router.get('/', (req, res) => {
  // Mock applications data matching the jobseeker dashboard
  const applications = [
    {
      id: '1',
      company: 'Tech Corp',
      jobTitle: 'Frontend Developer',
      appliedDate: '2024-06-01',
      status: 'Interview',
      jobLink: '/jobs/1',
      location: 'San Francisco, CA',
      salary: '$80,000 - $120,000'
    },
    {
      id: '2',
      company: 'InnovateX',
      jobTitle: 'UI/UX Designer',
      appliedDate: '2024-05-28',
      status: 'Submitted',
      jobLink: '/jobs/2',
      location: 'Austin, TX',
      salary: '$70,000 - $100,000'
    },
    {
      id: '3',
      company: 'DataWorks',
      jobTitle: 'Data Analyst',
      appliedDate: '2024-05-25',
      status: 'Rejected',
      jobLink: '/jobs/3',
      location: 'New York, NY',
      salary: '$65,000 - $85,000'
    },
    {
      id: '4',
      company: 'Cloudify',
      jobTitle: 'DevOps Engineer',
      appliedDate: '2024-05-20',
      status: 'Viewed',
      jobLink: '/jobs/4',
      location: 'Seattle, WA',
      salary: '$90,000 - $130,000'
    }
  ];

  res.json({
    success: true,
    applications,
    total: applications.length
  });
});

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private
router.get('/stats', (req, res) => {
  // Mock stats data matching the jobseeker dashboard
  const stats = {
    applied: 12,
    views: 45,
    successRate: 25, // percent
    avgResponseTime: 3.2 // days
  };

  res.json({
    success: true,
    stats
  });
});

// @desc    Get recommendations
// @route   GET /api/applications/recommendations
// @access  Private
router.get('/recommendations', (req, res) => {
  // Mock recommendations data
  const recommendations = [
    {
      title: 'LinkedIn Premium',
      description: 'Boost your profile visibility and connect with top recruiters.',
      link: 'https://linkedin.com/premium',
      icon: '🎓',
    },
    {
      title: 'Resume Review Service',
      description: 'Get expert feedback on your resume and land more interviews.',
      link: 'https://resumereview.com',
      icon: '📝',
    },
    {
      title: 'AI Job Matcher',
      description: 'Try our AI-powered job matching tool for personalized job recommendations.',
      link: '#',
      icon: '🤖',
    },
  ];

  res.json({
    success: true,
    recommendations
  });
});

module.exports = router;
