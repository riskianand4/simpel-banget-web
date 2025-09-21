// Environment variable validation utility
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'NODE_ENV'
];

const optionalEnvVars = {
  'PORT': '3001',
  'JWT_EXPIRE': '7d',
  'BCRYPT_ROUNDS': '12',
  'CORS_ORIGIN': 'http://localhost:8080,https://yourdomain.com'
};

const validateEnvironment = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Set defaults for optional variables
  Object.entries(optionalEnvVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`${varName} not set, using default: ${defaultValue}`);
    }
  });

  // Critical security checks
  if (process.env.JWT_SECRET === 'fallback-secret' || 
      process.env.JWT_SECRET === 'your-secret-key' ||
      (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32)) {
    missing.push('JWT_SECRET (must be at least 32 characters and secure)');
  }

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nApplication cannot start safely without these variables.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }

  // Security validation
  if (process.env.NODE_ENV === 'production') {
    if (process.env.CORS_ORIGIN === '*') {
      console.error('❌ CRITICAL: CORS_ORIGIN cannot be "*" in production');
      process.exit(1);
    }
  }

  console.log('✅ Environment validation passed');
};

module.exports = { validateEnvironment };