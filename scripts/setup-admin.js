const mongoose = require('mongoose');

async function testAdminConnection() {
  try {
    await mongoose.connect("mongodb+srv://copilot_admin:JobPortal2025@naukrimili.lb6ad5e.mongodb.net/jobportal", {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });// Create a test admin user in MongoDB
    const db = mongoose.connection.db;
    await db.addUser(
      "copilot_admin",
      "JobPortal2025",
      {
        roles: [
          { role: "readWrite", db: "jobportal" },
          { role: "dbAdmin", db: "jobportal" }
        ]
      }
    );process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAdminConnection();
