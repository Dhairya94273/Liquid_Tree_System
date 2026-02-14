// Configuration for the Environmental Monitoring Application

require("dotenv").config();

module.exports = {
  // OpenWeatherMap API Configuration
  openweathermap: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    baseUrl: "https://api.openweathermap.org/data/2.5",
    endpoints: {
      airPollution: "/air_pollution",
      currentWeather: "/weather"
    }
  },

  // Scheduled Update Configuration
  scheduledUpdates: {
    enabled: process.env.ENABLE_SCHEDULED_UPDATES === "true",
    intervalMinutes: parseInt(process.env.UPDATE_INTERVAL_MINUTES) || 60,
    batchSize: 10,
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
    host: "0.0.0.0",
    environment: process.env.NODE_ENV || "development"
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: "json"
  },

  // Area Type Multipliers
  areaMultipliers: {
    Residential: 1.0,
    Industrial: 1.5,
    Commercial: 1.2,
    "Traffic-heavy": 1.3
  },

  // AQI Categories
  aqiCategories: {
    good: { min: 0, max: 50 },
    moderate: { min: 51, max: 100 },
    unhealthyForSensitive: { min: 101, max: 150 },
    unhealthy: { min: 151, max: 200 },
    veryUnhealthy: { min: 201, max: 300 },
    hazardous: { min: 301, max: 500 }
  }
};
