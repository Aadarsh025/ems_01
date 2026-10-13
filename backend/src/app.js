// const path = require('path');
// const express = require('express');
// const cors = require('cors');
// const authRoutes = require('./routes/authRoutes');
// const employeeRoutes = require('./routes/employeeRoutes');
// const errorHandler = require('./middleware/errorHandler');

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// app.use('/api/auth', authRoutes);
// app.use('/api/employees', employeeRoutes);

// // Unknown API route
// app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// // Serve the frontend from the same server (no CORS issues)
// app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// app.use(errorHandler);

// module.exports = app;










const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Allowed origins: set CLIENT_URL in Render (comma-separated for multiple)
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
].map((o) => o.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, Postman, same-server requests)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health checks
app.get('/api', (req, res) => res.json({ message: 'API is running' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Unknown API route
app.use('/api', (req, res) =>
  res.status(404).json({ message: 'API route not found' })
);

// Serve the frontend only if the folder exists (it won't on Render if the
// frontend is deployed separately on Vercel)
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

app.use(errorHandler);

module.exports = app;