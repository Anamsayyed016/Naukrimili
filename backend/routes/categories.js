const express = require('express');
const router = express.Router();

// @desc    Get all categories with job counts
// @route   GET /api/categories
// @access  Public
router.get('/', (req, res) => {
  // This matches your existing frontend API call
  const categories = {
    popular: [
      { name: 'IT Jobs', icon: '💻', count: 12342 },
      { name: 'Sales Jobs', icon: '📊', count: 8765 },
      { name: 'Marketing Jobs', icon: '🎯', count: 5421 },
      { name: 'Finance Jobs', icon: '💰', count: 4320 },
      { name: 'HR Jobs', icon: '👥', count: 3210 },
      { name: 'Engineering Jobs', icon: '⚙️', count: 6543 }
    ],
    trending: [
      { name: 'Remote Jobs', badge: '🔥 Hot', cta: 'Apply Now' },
      { name: 'Fresher Jobs', badge: '🆕 Fresher', cta: 'Apply Now' },
      { name: 'MNC Jobs', badge: '🌐 MNC', cta: 'Apply Now' },
      { name: 'Work From Home', badge: '🏠 WFH', cta: 'Apply Now' },
      { name: 'AI/ML Jobs', badge: '🤖 AI', cta: 'Apply Now' }
    ],
    locations: [
      { city: 'Delhi', jobCount: 5200, isTrending: true },
      { city: 'Mumbai', jobCount: 4100, isTrending: false },
      { city: 'Bangalore', jobCount: 6300, isTrending: true }
    ]
  };

  res.json(categories);
});

module.exports = router;
