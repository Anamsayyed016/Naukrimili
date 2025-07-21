const Company = require('../models/Company');
const User = require('../models/User');
// const sendVerificationEmail = require('../services/emailService'); // Placeholder for email

// @desc    Register a new company
// @route   POST /api/companies/register
// @access  Public
const registerCompany = async (req, res) => {
  try {
    // Parse form data
    const companyData = req.body.company ? JSON.parse(req.body.company) : req.body['company[name]'] ? {
      name: req.body['company[name]'],
      industry: req.body['company[industry]'],
      size: req.body['company[size]'],
      location: req.body['company[location]'],
      website: req.body['company[website]'],
      description: req.body['company[description]'],
    } : {};
    const userData = req.body.user ? JSON.parse(req.body.user) : req.body['user[name]'] ? {
      name: req.body['user[name]'],
      email: req.body['user[email]'],
      password: req.body['user[password]'],
      role: 'company',
    } : {};

    // Validate required fields
    if (!companyData.name || !companyData.industry || !companyData.size || !companyData.location || !userData.name || !userData.email || !userData.password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user (company admin/HR)
    const user = await User.create({ ...userData, isEmailVerified: false });

    // Handle document uploads
    const documents = (req.files || []).map(file => ({
      filename: file.originalname,
      url: file.path,
      mimetype: file.mimetype,
      size: file.size,
    }));

    // Create company (status: pending)
    const company = await Company.create({
      ...companyData,
      documents,
      status: 'pending',
      isVerified: false,
      adminNotes: '',
      createdBy: user._id,
    });

    // Optionally, link user to company (if your schema supports it)
    // user.company = company._id;
    // await user.save();

    // TODO: Send verification email to user
    // await sendVerificationEmail(user.email, ...);

    res.status(201).json({
      success: true,
      message: 'Company registration submitted. Please verify your email.',
      companyId: company._id,
      userId: user._id,
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

module.exports = { registerCompany }; 