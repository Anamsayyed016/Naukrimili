const express = require('express');
const router = express.Router();

// @desc    Get all locations with job counts
// @route   GET /api/locations
// @access  Public
router.get('/', (req, res) => {
  // This matches your existing frontend API call
  const locations = [
    { city: 'Delhi', jobCount: 5200, isTrending: true },
    { city: 'Mumbai', jobCount: 4100, isTrending: false },
    { city: 'Bangalore', jobCount: 6300, isTrending: true },
    { city: 'Hyderabad', jobCount: 3200, isTrending: false },
    { city: 'Chennai', jobCount: 2900, isTrending: false },
    { city: 'Pune', jobCount: 2800, isTrending: true },
    { city: 'Kolkata', jobCount: 1900, isTrending: false },
    { city: 'Ahmedabad', jobCount: 1500, isTrending: false },
    { city: 'Noida', jobCount: 2200, isTrending: true },
    { city: 'Gurgaon', jobCount: 2400, isTrending: true }
  ];

  res.json(locations);
});

module.exports = router;
