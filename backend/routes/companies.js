const express = require('express');
const router = express.Router();

const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const { registerCompany } = require('../controllers/companyController');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
router.get('/', (req, res) => {
  // Mock companies data
  const companies = [
    {
      id: '1',
      name: 'Tech Corp',
      industry: 'Information Technology',
      size: '201-1000',
      location: 'San Francisco, CA',
      logo: '/company-logos/tech-corp.png',
      rating: 4.2,
      activeJobs: 25,
      description: 'Leading technology company focused on innovation and digital transformation.'
    },
    {
      id: '2',
      name: 'InnovateX',
      industry: 'Software Development',
      size: '51-200',
      location: 'Austin, TX',
      logo: '/company-logos/innovatex.png',
      rating: 4.5,
      activeJobs: 15,
      description: 'Fast-growing startup specializing in AI and machine learning solutions.'
    },
    {
      id: '3',
      name: 'DataWorks',
      industry: 'Data Analytics',
      size: '11-50',
      location: 'New York, NY',
      logo: '/company-logos/dataworks.png',
      rating: 4.0,
      activeJobs: 8,
      description: 'Data analytics company helping businesses make data-driven decisions.'
    }
  ];

  res.json({
    success: true,
    companies,
    total: companies.length
  });
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
router.get('/:id', (req, res) => {
  // Mock single company data
  const company = {
    id: req.params.id,
    name: 'Tech Corp',
    industry: 'Information Technology',
    size: '201-1000',
    founded: 2010,
    headquarters: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    },
    website: 'https://techcorp.com',
    logo: '/company-logos/tech-corp.png',
    rating: {
      overall: 4.2,
      workLifeBalance: 4.0,
      salary: 4.3,
      culture: 4.1,
      management: 4.0,
      reviews: 234
    },
    activeJobs: 25,
    description: 'Leading technology company focused on innovation and digital transformation. We build cutting-edge solutions that help businesses scale and succeed in the digital age.',
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      'Vision Insurance',
      '401(k) Match',
      'Flexible PTO',
      'Remote Work Options',
      'Professional Development Budget'
    ],
    culture: {
      values: ['Innovation', 'Collaboration', 'Excellence', 'Integrity'],
      workEnvironment: 'Collaborative and fast-paced environment with focus on innovation and continuous learning.',
      perks: ['Free meals', 'Gym membership', 'Flexible hours', 'Stock options']
    }
  };

  res.json({
    success: true,
    company
  });
});

// @desc    Register a new company
// @route   POST /api/companies/register
// @access  Public
router.post('/register', uploadMiddleware.array('documents', 5), registerCompany);

module.exports = router;
