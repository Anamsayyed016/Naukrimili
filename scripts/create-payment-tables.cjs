const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get project root directory - try multiple methods
function getProjectRoot() {
  // Method 1: Use __dirname if available
  if (typeof __dirname !== 'undefined') {
    return path.resolve(__dirname, '..');
  }
  // Method 2: Use process.cwd() as fallback
  try {
    return process.cwd();
  } catch (e) {
    // Method 3: Use the script's location
    const scriptPath = require.resolve('./create-payment-tables.cjs');
    return path.dirname(path.dirname(scriptPath));
  }
}

const projectRoot = getProjectRoot();

// Load environment variables from .env.local or .env
try {
  const envLocal = path.join(projectRoot, '.env.local');
  const envFile = path.join(projectRoot, '.env');
  const envPath = fs.existsSync(envLocal) ? envLocal : (fs.existsSync(envFile) ? envFile : null);
  
  if (envPath) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      line = line.trim();
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Loaded environment variables from', path.basename(envPath));
  }
} catch (error) {
  console.warn('⚠️ Could not load .env file:', error.message);
}

async function createPaymentTables() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.log('Please set DATABASE_URL in your .env file or environment variables.');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const pool = new Pool({ connectionString });

  try {
    // Read the SQL file
    const sqlFile = path.join(projectRoot, 'CREATE_PAYMENT_TABLES.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ ERROR: SQL file not found at: ${sqlFile}`);
      console.log('Please make sure CREATE_PAYMENT_TABLES.sql exists in the project root.');
      process.exit(1);
    }
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Payment tables created successfully!');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Payment', 'Subscription', 'UserCredits', 'CreditTransaction')
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating payment tables:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createPaymentTables();

