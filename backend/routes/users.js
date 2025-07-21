const express = require('express');
const { body } = require('express-validator');
const {
  updateProfile,
  deleteProfile,
  getUsers,
  uploadResume,
  getUserById,
  updateUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

// Get user status (for frontend compatibility)
router.get('/status', (req, res) => {
  const loggedIn = req.query.loggedIn === 'true';
  if (loggedIn) {
    return res.json({
      isLoggedIn: true,
      location: 'Delhi',
      name: 'John Doe',
      matches: 5,
      profileStrength: 75
    });
  } else {
    return res.json({
      isLoggedIn: false,
      location: 'Delhi',
      name: 'Guest',
      matches: 0,
      profileStrength: 0
    });
  }
});

// Update user profile
router.put('/profile', protect, [
  body('profile.phone').optional().isMobilePhone(),
  body('profile.bio').optional().isLength({ max: 500 }),
  body('profile.skills').optional().isArray(),
  body('profile.experience.years').optional().isNumeric()
], updateProfile);

// Upload resume
router.post('/upload-resume', protect, uploadResume);

// Get all users (Admin only)
router.get('/', protect, authorize('admin'), getUsers);

// Get user by ID
router.get('/:id', protect, getUserById);

// Update user status (Admin only)
router.put('/:id/status', protect, authorize('admin'), updateUserStatus);

// Delete user profile
router.delete('/profile', protect, deleteProfile);

module.exports = router;
