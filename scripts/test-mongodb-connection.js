const mongoose = require('mongoose');

const uri = "mongodb+srv://naukrimili123:naukrimili123@naukrimili.lb6ad5e.mongodb.net/jobportal";

async function testConnection() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });// Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();process.exit(0);
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  }
}

testConnection();
