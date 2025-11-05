const pool = require('../config/database');

/**
 * Location Tracking Service
 * Handles location logging and queries
 */

class LocationService {
  /**
   * Log a location event
   */
  static async logLocation(locationData) {
    const {
      user_id,
      action_type,
      latitude,
      longitude,
      accuracy,
      ip_address,
      device_info,
      action_data
    } = locationData;

    try {
      const result = await pool.query(
        `INSERT INTO location_logs
        (user_id, action_type, latitude, longitude, accuracy, ip_address, device_info, action_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          user_id,
          action_type,
          latitude,
          longitude,
          accuracy,
          ip_address,
          device_info ? JSON.stringify(device_info) : null,
          action_data ? JSON.stringify(action_data) : null
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error logging location:', error);
      throw error;
    }
  }

  /**
   * Get location history for a user
   */
  static async getLocationHistory(userId, filters = {}) {
    const { action_type, start_date, end_date, limit = 50, offset = 0 } = filters;

    let query = 'SELECT * FROM location_logs WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (action_type) {
      query += ` AND action_type = $${paramIndex}`;
      params.push(action_type);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting location history:', error);
      throw error;
    }
  }

  /**
   * Get all location logs (admin only)
   */
  static async getAllLocationLogs(filters = {}) {
    const { action_type, start_date, end_date, limit = 100, offset = 0 } = filters;

    let query = 'SELECT l.*, u.username, u.full_name FROM location_logs l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (action_type) {
      query += ` AND l.action_type = $${paramIndex}`;
      params.push(action_type);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND l.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND l.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting all location logs:', error);
      throw error;
    }
  }

  /**
   * Get location statistics
   */
  static async getLocationStats(userId = null) {
    let query = `
      SELECT
        action_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM location_logs
    `;

    const params = [];
    if (userId) {
      query += ' WHERE user_id = $1';
      params.push(userId);
    }

    query += ' GROUP BY action_type, DATE(created_at) ORDER BY date DESC';

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting location stats:', error);
      throw error;
    }
  }

  /**
   * Delete old location logs (cleanup)
   */
  static async deleteOldLogs(daysOld = 90) {
    try {
      const result = await pool.query(
        'DELETE FROM location_logs WHERE created_at < NOW() - INTERVAL \'$1 days\' RETURNING id',
        [daysOld]
      );

      return result.rowCount;
    } catch (error) {
      console.error('Error deleting old logs:', error);
      throw error;
    }
  }
}

module.exports = LocationService;
