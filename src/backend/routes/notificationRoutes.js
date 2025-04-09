const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
  createAnnouncement,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User notification routes
router.route('/')
  .get(getUserNotifications);

router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllNotificationsRead);

// Admin only route
router.post('/announce', admin, createAnnouncement);

// Individual notification routes
router.route('/:id')
  .delete(deleteNotification);

router.put('/:id/read', markNotificationRead);

module.exports = router; 