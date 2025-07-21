const express = require('express');
const { body } = require('express-validator');
const { register, login, getUserProfile } = require('../controllers/authController');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// Register a new user
router.post('/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Please enter a password with 6 or more characters'),
    body('role').isIn(['jobseeker', 'company', 'admin']).withMessage('Invalid user role')
  ],
  register
);

// Login a user
router.post('/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  login
);

// Get User Profile
router.get('/profile', protect, getUserProfile);

module.exports = router;
