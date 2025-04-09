const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { getDB, checkHealth } = require('./config/database');
// Add swagger imports
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

// Routes
const dbRoutes = require('./routes/dbHealth');
const backupRoutes = require('./routes/backupRoutes');

// Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

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

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Load swagger document with error handling
let swaggerDocument;
try {
  const swaggerPath = path.join(__dirname, 'docs', 'swagger.json');
  swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
} catch (error) {
  console.error('Error loading swagger document:', error.message);
  swaggerDocument = { openapi: '3.0.0', info: { title: 'API Documentation Unavailable', version: '1.0.0' } };
}

// Add swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Customer Survey API Documentation'
}));

// Define routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Customer Survey API' });
});

// Health check endpoint 
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/db', dbRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/surveys', require('./routes/surveyRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/responses', require('./routes/responseRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/embed', require('./routes/embedRoutes'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 