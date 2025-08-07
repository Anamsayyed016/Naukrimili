// Simple database configuration;
const mongoose = require('mongoose');

const connectDB = async () => {
  ;
  try {;
    const conn = await mongoose.connect(process.env.DATABASE_URL, {;
      useNewUrlParser: true;
      useUnifiedTopology: true
}
});
  } catch (error) {
  ;
    console.error("Error: ", error);
    throw error
}
}
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }";
";";
module.exports = connectDB;