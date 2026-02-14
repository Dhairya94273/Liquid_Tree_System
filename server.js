// ===============================
// SERVER.JS - AQI EXPRESS APP
// ===============================

require("dotenv").config(); // MUST be at the very top
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

// Load pincode database
const pincodeDB = JSON.parse(fs.readFileSync(path.join(__dirname, "data/pincodes.json"), "utf-8"));

// ========================================
// AQI CALCULATION FUNCTION (Indian Scale 0-500)
// ========================================
function calculateAQI(components) {

  const pm25 = components.pm2_5 || 0;
  const pm10 = components.pm10 || 0;
  const no2 = components.no2 || 0;
  const o3 = components.o3 || 0;
  const so2 = components.so2 || 0;
  const co = components.co || 0;

  const aqiValues = [];

  // PM2.5
  if (pm25 <= 30) aqiValues.push(pm25 * 50 / 30);
  else if (pm25 <= 60) aqiValues.push(50 + (pm25 - 30) * 50 / 30);
  else if (pm25 <= 90) aqiValues.push(100 + (pm25 - 60) * 50 / 30);
  else if (pm25 <= 120) aqiValues.push(150 + (pm25 - 90) * 50 / 30);
  else if (pm25 <= 250) aqiValues.push(200 + (pm25 - 120) * 100 / 130);
  else aqiValues.push(300 + (pm25 - 250) * 100 / 250);

  // PM10
  if (pm10 <= 50) aqiValues.push(pm10 * 50 / 50);
  else if (pm10 <= 100) aqiValues.push(50 + (pm10 - 50) * 50 / 50);
  else if (pm10 <= 250) aqiValues.push(100 + (pm10 - 100) * 50 / 150);
  else if (pm10 <= 350) aqiValues.push(150 + (pm10 - 250) * 50 / 100);
  else if (pm10 <= 430) aqiValues.push(200 + (pm10 - 350) * 100 / 80);
  else aqiValues.push(300 + (pm10 - 430) * 100 / 320);

  // NO2
  if (no2 <= 40) aqiValues.push(no2 * 50 / 40);
  else if (no2 <= 80) aqiValues.push(50 + (no2 - 40) * 50 / 40);
  else if (no2 <= 180) aqiValues.push(100 + (no2 - 80) * 50 / 100);
  else if (no2 <= 280) aqiValues.push(150 + (no2 - 180) * 50 / 100);
  else if (no2 <= 400) aqiValues.push(200 + (no2 - 280) * 100 / 120);
  else aqiValues.push(300 + (no2 - 400) * 100 / 200);

  // O3
  if (o3 <= 50) aqiValues.push(o3 * 50 / 50);
  else if (o3 <= 100) aqiValues.push(50 + (o3 - 50) * 50 / 50);
  else if (o3 <= 168) aqiValues.push(100 + (o3 - 100) * 50 / 68);
  else if (o3 <= 208) aqiValues.push(150 + (o3 - 168) * 50 / 40);
  else if (o3 <= 748) aqiValues.push(200 + (o3 - 208) * 100 / 540);
  else aqiValues.push(300 + (o3 - 748) * 100 / 1000);

  const finalAQI = Math.round(Math.max(...aqiValues));
  return Math.min(finalAQI, 500);
}

// -------------------------------
// EJS + Static
// -------------------------------
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// -------------------------------
// ROUTES
// -------------------------------
const pageRoutes = require("./routes/pages");
app.use("/", pageRoutes);

// ========================================
// REAL AQI API (Optimized Version)
// ========================================
app.get("/api/real-aqi/:pincode", async (req, res) => {

  try {

    const pincode = req.params.pincode;

    // Validate pincode
    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        error: "Enter valid 6-digit pincode"
      });
    }

    if (!process.env.OPENWEATHER_KEY) {
      return res.status(500).json({
        success: false,
        error: "Server missing OpenWeather API key"
      });
    }

    // 1️⃣ Convert PIN → Lat/Lon using ZIP API
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/zip?zip=${pincode},IN&appid=${process.env.OPENWEATHER_KEY}`,
      { timeout: 5000 }
    );

    const { lat, lon, name } = geoResponse.data;

    if (!lat || !lon) {
      return res.status(404).json({
        success: false,
        error: "Location not found"
      });
    }

    // Get pincode data from database
    const pincodeData = pincodeDB[pincode];
    const city = pincodeData?.city || name || "Unknown";
    const state = pincodeData?.state || "Unknown";
    const village = pincodeData?.area || "Unknown";

    // 2️⃣ Get Air Pollution Data
    const aqiResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}`,
      { timeout: 5000 }
    );

    const components = aqiResponse.data.list[0].components;
    const aqi = calculateAQI(components);

    // AQI Category
    let level = "Unknown";
    let color = "gray";

    if (aqi <= 50) { level = "Good"; color = "green"; }
    else if (aqi <= 100) { level = "Satisfactory"; color = "yellow"; }
    else if (aqi <= 200) { level = "Moderately Polluted"; color = "orange"; }
    else if (aqi <= 300) { level = "Poor"; color = "red"; }
    else if (aqi <= 400) { level = "Very Poor"; color = "darkred"; }
    else { level = "Severe"; color = "maroon"; }

    return res.json({
      success: true,
      pincode,
      city,
      state,
      village,
      aqi,
      level,
      color
    });

  } catch (error) {

    console.error("AQI Fetch Error FULL DEBUG:");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: "Invalid OpenWeather API Key"
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server error fetching AQI"
    });
  }
});

// -------------------------------
// SERVER LISTENER
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Make sure your .env contains OPENWEATHER_KEY");
});
