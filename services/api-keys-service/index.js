const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const dotenv = require('dotenv');
const apiKeyRoutes = require('./routes/apiKeys');
const db = require('./models');

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api-keys-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'api-keys.log' })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8010;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(morgan('combined')); // HTTP request logging
app.use(express.json()); // JSON parsing

// Routes
app.use('/api/keys', apiKeyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Sync database and start server
(async () => {
  try {
    // Sync all models with database
    await db.sequelize.sync();
    logger.info('Database synchronized successfully');
    
    // Set up admin API key if not present
    if (!process.env.ADMIN_API_KEY) {
      const adminKey = require('crypto').randomBytes(16).toString('hex');
      process.env.ADMIN_API_KEY = adminKey;
      logger.info(`ADMIN_API_KEY not found in environment. Generated new key: ${adminKey}`);
      logger.info('Make sure to set this in your environment variables for production use');
    }
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`API Keys Service running on port ${PORT}`);
      console.log(`API Keys Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})(); 