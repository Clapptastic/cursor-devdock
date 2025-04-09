/**
 * Microservice server entry point
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { getDB, checkHealth } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { processMainAppJWT } = require('./middleware/authMiddleware');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const processRoutes = require('./routes/processRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Initialize Supabase connection if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Initialize the Supabase client but don't await it
  // This allows the app to start even if there's a temporary DB issue
  getDB();
  
  // Check database health
  checkHealth()
    .then(isHealthy => {
      if (isHealthy) {
        console.log('Successfully connected to Supabase');
      } else {
        console.warn('Database health check failed, but continuing startup');
      }
    })
    .catch(err => {
      console.error('Error connecting to Supabase:', err.message);
    });
}

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Process JWT tokens from main application
app.use(processMainAppJWT);

// Define routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Customer Survey Microservice API',
    service: process.env.SERVICE_NAME || 'microservice',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/health', healthRoutes);
app.use('/api/process', processRoutes);
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Microservice running on port ${PORT}`);
  });
}

module.exports = app; 