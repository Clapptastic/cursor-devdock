/**
 * Notification Controller
 * Handles operations related to user notifications
 */
const asyncHandler = require('../middleware/asyncHandler');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Survey = require('../models/Survey');
const Response = require('../models/Response');

/**
 * Get notifications for the current user
 * @route GET /api/notifications
 * @access Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;

  // Find notifications for the current user
  const count = await Notification.countDocuments({ user: req.user._id });
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  // Mark retrieved notifications as read if requested
  if (req.query.markAsRead === 'true') {
    const notificationIds = notifications.map(n => n._id);
    await Notification.updateMany(
      { _id: { $in: notificationIds }, read: false },
      { read: true }
    );
    
    // Update read status in returned notifications
    notifications.forEach(n => {
      if (!n.read) n.read = true;
    });
  }

  res.json({
    notifications,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    unreadCount: await Notification.countDocuments({ user: req.user._id, read: false })
  });
});

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if notification belongs to the current user
  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this notification');
  }

  // Update the notification
  notification.read = true;
  await notification.save();

  res.json({
    success: true,
    notification
  });
});

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if notification belongs to the current user
  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await notification.remove();

  res.json({
    success: true,
    message: 'Notification removed'
  });
});

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 * @access Private
 */
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * Create a notification for new survey response
 * @param {Object} response - The survey response object
 * @returns {Promise<Object>} Created notification
 */
const createResponseNotification = async (response) => {
  try {
    // Get the survey
    const survey = await Survey.findById(response.survey);
    
    if (!survey) {
      console.error('Survey not found for response notification');
      return null;
    }
    
    // Create notification for the survey owner
    const notification = await Notification.create({
      user: survey.createdBy,
      type: 'response',
      title: 'New Survey Response',
      message: `You received a new response to your survey: ${survey.title}`,
      data: {
        surveyId: survey._id,
        responseId: response._id
      },
      read: false
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating response notification:', error);
    return null;
  }
};

/**
 * Create an announcement notification for users
 * @route POST /api/notifications/announce
 * @access Private/Admin
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  // Only admins can create announcements
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to create announcements');
  }

  const { title, message, targetUsers } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  // Get users to notify
  let users;
  if (targetUsers && targetUsers.length > 0) {
    // Specific users
    users = await User.find({ _id: { $in: targetUsers } }).select('_id');
  } else {
    // All users
    users = await User.find().select('_id');
  }

  // Create notifications for each user
  const notifications = [];
  for (const user of users) {
    const notification = await Notification.create({
      user: user._id,
      type: 'announcement',
      title,
      message,
      read: false
    });
    
    notifications.push(notification);
  }

  res.status(201).json({
    success: true,
    message: `Announcement sent to ${notifications.length} users`,
    count: notifications.length
  });
});

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 * @access Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ 
    user: req.user._id, 
    read: false 
  });

  res.json({ count });
});

module.exports = {
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
  createAnnouncement,
  getUnreadCount,
  createResponseNotification
}; 