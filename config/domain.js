// Domain Configuration for aftionix.in
const domainConfig = {
  production: {
    domain: 'aftionix.in',
    baseUrl: 'https://aftionix.in',
    apiUrl: 'https://aftionix.in/api',
    cdnUrl: 'https://aftionix.in',
    emailDomain: 'aftionix.in',
    ssl: true,
    www: true,
  },
  development: {
    domain: 'localhost',
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api',
    cdnUrl: 'http://localhost:3000',
    emailDomain: 'localhost',
    ssl: false,
    www: false,
  },
  staging: {
    domain: 'staging.aftionix.in',
    baseUrl: 'https://staging.aftionix.in',
    apiUrl: 'https://staging.aftionix.in/api',
    cdnUrl: 'https://staging.aftionix.in',
    emailDomain: 'staging.aftionix.in',
    ssl: true,
    www: false,
  }
};

// Get current environment
const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return domainConfig[env] || domainConfig.development;
};

// Export configuration
module.exports = {
  domainConfig,
  getCurrentConfig,
  current: getCurrentConfig()
};
