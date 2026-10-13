require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');

let dbPromise = null;

module.exports = async (req, res) => {
  try {
    // Reuse the same connection across warm invocations
    if (!dbPromise) dbPromise = connectDB();
    await dbPromise;
  } catch (error) {
    dbPromise = null; // allow retry on next request
    console.error('DB connection failed:', error.message);
    return res.status(500).json({ message: 'Database connection failed' });
  }

  return app(req, res);
};