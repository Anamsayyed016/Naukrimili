const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required']
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5001+'],
    required: true
  },
  founded: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  headquarters: {
    address: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'India' },
    zipCode: String
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+\..+/, 'Please enter a valid website URL']
  },
  email: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: String,
  logo: {
    filename: String,
    url: String
  },
  coverImage: {
    filename: String,
    url: String
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  benefits: [String],
  culture: {
    values: [String],
    workEnvironment: String,
    perks: [String]
  },
  locations: [{
    city: String,
    state: String,
    country: String,
    isHeadquarters: { type: Boolean, default: false }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    overall: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    workLifeBalance: { type: Number, default: 0, min: 0, max: 5 },
    salary: { type: Number, default: 0, min: 0, max: 5 },
    culture: { type: Number, default: 0, min: 0, max: 5 },
    management: { type: Number, default: 0, min: 0, max: 5 }
  },
  followers: {
    type: Number,
    default: 0
  },
  activeJobs: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ 'headquarters.city': 1 });
companySchema.index({ size: 1 });
companySchema.index({ isActive: 1, isVerified: 1 });
companySchema.index({ createdAt: -1 });

// Virtual for company URL
companySchema.virtual('companyUrl').get(function() {
  return `/companies/${this._id}`;
});

// Method to calculate average rating
companySchema.methods.calculateAverageRating = function() {
  if (this.rating.reviews === 0) return 0;
  
  const totalRating = this.rating.workLifeBalance + 
                     this.rating.salary + 
                     this.rating.culture + 
                     this.rating.management;
  
  this.rating.overall = totalRating / 4;
  return this.rating.overall;
};

// Static method to find active companies
companySchema.statics.findActiveCompanies = function(filters = {}) {
  return this.find({
    isActive: true,
    ...filters
  });
};

module.exports = mongoose.model('Company', companySchema);
