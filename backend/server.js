
// require('dotenv').config();

// const app = require('./src/app');
// const connectDB = require('./src/config/db');

// const PORT = process.env.PORT || 5000;

// async function startServer() {
//   try {
//     await connectDB();

//     app.listen(PORT, () => {
//       console.log(`Server running at http://localhost:${PORT}`);
//       console.log('API base URL: http://localhost:' + PORT + '/api');
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error.message);
//     process.exit(1);
//   }
// }

// startServer();




require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Bind to 0.0.0.0 so Render can reach the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Catch errors that would otherwise crash the server silently
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

startServer();