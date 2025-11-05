const LocationService = require('../services/locationService');

/**
 * Track user location
 */
exports.trackLocation = async (req, res) => {
  try {
    const { action_type, latitude, longitude, accuracy, action_data } = req.body;
    const userId = req.user.id;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Get device info from user agent
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      mobile: req.headers['sec-ch-ua-mobile']
    };

    const locationData = {
      user_id: userId,
      action_type,
      latitude,
      longitude,
      accuracy,
      ip_address: ipAddress,
      device_info: deviceInfo,
      action_data
    };

    const location = await LocationService.logLocation(locationData);

    res.json({
      success: true,
      message: 'Location tracked successfully',
      data: location
    });
  } catch (error) {
    console.error('Track location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track location'
    });
  }
};

/**
 * Get location history for current user
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {
      action_type: req.query.action_type,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const history = await LocationService.getLocationHistory(userId, filters);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location history'
    });
  }
};

/**
 * Get all location logs (admin only)
 */
exports.getAllLogs = async (req, res) => {
  try {
    const filters = {
      action_type: req.query.action_type,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };

    const logs = await LocationService.getAllLocationLogs(filters);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location logs'
    });
  }
};

/**
 * Get location statistics
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.query.user_id || null;
    const stats = await LocationService.getLocationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location statistics'
    });
  }
};
