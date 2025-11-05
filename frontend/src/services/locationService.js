/**
 * Location Tracking Service
 * Handles geolocation tracking with user privacy controls
 */

import api from './api';

class LocationService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.enabled = false;
    this.permissionStatus = 'prompt'; // 'granted', 'denied', 'prompt'
  }

  /**
   * Initialize location service
   */
  async init() {
    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by this browser');
      return false;
    }

    // Check user preference from localStorage
    const userPreference = localStorage.getItem('location_enabled');
    this.enabled = userPreference === 'true';

    // Check browser permission status
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionStatus = permission.state;

        // Listen for permission changes
        permission.addEventListener('change', () => {
          this.permissionStatus = permission.state;
          console.log('Location permission changed:', permission.state);
        });
      } catch (error) {
        console.warn('Could not query geolocation permission:', error);
      }
    }

    return true;
  }

  /**
   * Request location permission from user
   */
  async requestPermission() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.permissionStatus = 'granted';
          this.currentPosition = this.formatPosition(position);
          this.enabled = true;
          localStorage.setItem('location_enabled', 'true');
          resolve(true);
        },
        (error) => {
          console.error('Location permission denied:', error);
          this.permissionStatus = 'denied';
          this.enabled = false;
          localStorage.setItem('location_enabled', 'false');
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Get current position
   */
  async getCurrentPosition() {
    if (!this.enabled) {
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = this.formatPosition(position);
          resolve(this.currentPosition);
        },
        (error) => {
          console.error('Failed to get location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      );
    });
  }

  /**
   * Format position object
   */
  formatPosition(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp).toISOString()
    };
  }

  /**
   * Start watching position (continuous tracking)
   */
  startWatching(callback) {
    if (!this.enabled) {
      return null;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = this.formatPosition(position);
        if (callback) {
          callback(this.currentPosition);
        }
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return this.watchId;
  }

  /**
   * Stop watching position
   */
  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Track user action with location
   */
  async trackAction(actionType, actionData = {}) {
    if (!this.enabled) {
      console.log('Location tracking is disabled');
      return null;
    }

    try {
      const position = await this.getCurrentPosition();

      const locationData = {
        action_type: actionType,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: position.timestamp,
        action_data: actionData
      };

      // Send to backend
      const response = await api.post('/location/track', locationData);
      return response.data;
    } catch (error) {
      console.error('Failed to track action:', error);
      // Don't throw error - location tracking should not break the app
      return null;
    }
  }

  /**
   * Track login location
   */
  async trackLogin() {
    return this.trackAction('LOGIN');
  }

  /**
   * Track employee action
   */
  async trackEmployeeAction(action, employeeId) {
    return this.trackAction(`EMPLOYEE_${action}`, { employee_id: employeeId });
  }

  /**
   * Track salary action
   */
  async trackSalaryAction(action, paymentMonth) {
    return this.trackAction(`SALARY_${action}`, { payment_month: paymentMonth });
  }

  /**
   * Get location history for current user
   */
  async getLocationHistory(filters = {}) {
    try {
      const response = await api.get('/location/history', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to get location history:', error);
      throw error;
    }
  }

  /**
   * Enable location tracking
   */
  async enable() {
    try {
      await this.requestPermission();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disable location tracking
   */
  disable() {
    this.enabled = false;
    this.stopWatching();
    localStorage.setItem('location_enabled', 'false');
  }

  /**
   * Check if location tracking is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get permission status
   */
  getPermissionStatus() {
    return this.permissionStatus;
  }

  /**
   * Get last known position
   */
  getLastPosition() {
    return this.currentPosition;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat, lon) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';

    return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lon).toFixed(6)}°${lonDir}`;
  }

  /**
   * Get Google Maps URL for coordinates
   */
  getMapUrl(lat, lon) {
    return `https://www.google.com/maps?q=${lat},${lon}`;
  }
}

// Singleton instance
let instance = null;

export const getLocationService = () => {
  if (!instance) {
    instance = new LocationService();
  }
  return instance;
};

export default LocationService;
