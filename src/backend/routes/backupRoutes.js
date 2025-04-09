/**
 * Database backup routes
 */
const express = require('express');
const {
  getBackups,
  createNewBackup,
  restoreFromBackup,
  runScheduled,
  deleteBackup
} = require('../controllers/backupController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All backup routes are protected and admin-only
router.use(protect, admin);

// Get all backups
router.get('/', getBackups);

// Create a new backup
router.post('/', createNewBackup);

// Restore from a backup
router.post('/restore', restoreFromBackup);

// Run a scheduled backup
router.post('/scheduled', runScheduled);

// Delete a backup
router.delete('/:name', deleteBackup);

module.exports = router; 