const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Allow PDF and DOC files for resume
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed for resume'), false);
    }
  } else {
    cb(new Error('Unknown field'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      name,
      profile: {
        firstName,
        lastName,
        phone,
        location,
        bio,
        skills,
        experience,
        education,
        socialLinks
      } = {},
      preferences
    } = req.body;

    // Update basic info
    if (name) user.name = name;

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone) user.profile.phone = phone;
    if (location) user.profile.location = { ...user.profile.location, ...location };
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skills;
    if (experience) user.profile.experience = { ...user.profile.experience, ...experience };
    if (education) user.profile.education = education;
    if (socialLinks) user.profile.socialLinks = { ...user.profile.socialLinks, ...socialLinks };

    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    // Recalculate profile strength
    user.calculateProfileStrength();

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating profile'
    });
  }
});

// @desc    Delete user profile
// @route   DELETE /api/users/profile
// @access  Private
const deleteProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete associated files if they exist
    if (user.profile.resume && user.profile.resume.filename) {
      const resumePath = path.join(__dirname, '../uploads/resumes', user.profile.resume.filename);
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting profile'
    });
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      role,
      isActive,
      location,
      skills,
      search
    } = req.query;

    // Build query
    let query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (location) query['profile.location.city'] = new RegExp(location, 'i');
    if (skills) query['profile.skills'] = { $in: skills.split(',') };
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { 'profile.firstName': new RegExp(search, 'i') },
        { 'profile.lastName': new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching users'
    });
  }
});

// @desc    Upload resume
// @route   POST /api/users/upload-resume
// @access  Private
const uploadResume = [
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete old resume file if exists
      if (user.profile.resume && user.profile.resume.filename) {
        const oldResumePath = path.join(__dirname, '../uploads/resumes', user.profile.resume.filename);
        if (fs.existsSync(oldResumePath)) {
          fs.unlinkSync(oldResumePath);
        }
      }

      // Update user with new resume info
      user.profile.resume = {
        filename: req.file.filename,
        url: `/uploads/resumes/${req.file.filename}`,
        uploadDate: new Date()
      };

      // Recalculate profile strength
      user.calculateProfileStrength();

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: {
          resume: user.profile.resume,
          profileStrength: user.profileStrength
        }
      });
    } catch (error) {
      console.error('Upload resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error occurred while uploading resume'
      });
    }
  })
];

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching user'
    });
  }
});

// @desc    Update user status (admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: userResponse
    });
  } catch (error) {
    console.error('Update user status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating user status'
    });
  }
});

module.exports = {
  updateProfile,
  deleteProfile,
  getUsers,
  uploadResume,
  getUserById,
  updateUserStatus
};
