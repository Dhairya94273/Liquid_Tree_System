// Configuration for the Environmental Monitoring Application

module.exports = {
  // OpenWeatherMap API Configuration
  openweathermap: {
    apiKey: process.env.OPENWEATHER_API_KEY || "YOUR_API_KEY_HERE",
    baseUrl: "https://api.openweathermap.org/data/2.5",
    endpoints: {
      airPollution: "/air_pollution",
      currentWeather: "/weather"
    }
  },

  // Scheduled Update Configuration
  scheduledUpdates: {
    enabled: process.env.ENABLE_SCHEDULED_UPDATES === "true" || false,
    // Update interval in minutes (default: 60 minutes = 1 hour)
    intervalMinutes: parseInt(process.env.UPDATE_INTERVAL_MINUTES) || 60,
    // Batch size for API requests (to avoid rate limiting)
    batchSize: 10,
    // Delay between requests in milliseconds
    requestDelayMs: 1200
  },

  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || "./data/pincodes.json",
    autoBackup: true,
    backupPath: "./data/backups/"
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || "0.0.0.0",
    environment: process.env.NODE_ENV || "development"
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: "json"
  },

  // Area Type Multipliers for AQI Calculation
  areaMultipliers: {
    "Residential": 1.0,
    "Industrial": 1.5,
    "Commercial": 1.2,
    "Traffic-heavy": 1.3
  },

  // AQI Categories for Health Recommendations
  aqiCategories: {
    good: { min: 0, max: 50 },
    moderate: { min: 51, max: 100 },
    unhealthyForSensitive: { min: 101, max: 150 },
    unhealthy: { min: 151, max: 200 },
    veryUnhealthy: { min: 201, max: 300 },
    hazardous: { min: 301, max: 500 }
  }
};
