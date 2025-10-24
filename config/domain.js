// Domain Configuration for naukrimili.com
const domainConfig = {
  production: {
    domain: 'naukrimili.com',
    baseUrl: 'https://naukrimili.com',
    apiUrl: 'https://naukrimili.com/api',
    cdnUrl: 'https://naukrimili.com',
    emailDomain: 'naukrimili.com',
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
    domain: 'staging.naukrimili.com',
    baseUrl: 'https://staging.naukrimili.com',
    apiUrl: 'https://staging.naukrimili.com/api',
    cdnUrl: 'https://staging.naukrimili.com',
    emailDomain: 'staging.naukrimili.com',
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
