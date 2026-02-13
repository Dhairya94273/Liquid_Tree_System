// ===============================
// SERVER.JS - AQI EXPRESS APP
// ===============================

const express = require("express");
const axios = require("axios");
require("dotenv").config(); // MUST be at the very top

const app = express();

// ========================================
// AQI CALCULATION FUNCTION
// ========================================
function calculateAQI(components) {
  // Convert pollutant levels to 0-500 AQI scale
  // Based on Indian AQI standards
  
  const pm25 = components.pm2_5 || 0; // PM2.5 in μg/m³
  const pm10 = components.pm10 || 0; // PM10 in μg/m³
  const no2 = components.no2 || 0;   // NO2 in μg/m³
  const o3 = components.o3 || 0;     // O3 in μg/m³
  const so2 = components.so2 || 0;   // SO2 in μg/m³
  const co = components.co || 0;     // CO in μg/m³
  
  // Standard AQI breakpoints (Indian standards)
  const aqiValues = [];
  
  // PM2.5 breakpoints (μg/m³)
  if (pm25 <= 30) aqiValues.push(pm25 * 50 / 30);
  else if (pm25 <= 60) aqiValues.push(50 + (pm25 - 30) * 50 / 30);
  else if (pm25 <= 90) aqiValues.push(100 + (pm25 - 60) * 50 / 30);
  else if (pm25 <= 120) aqiValues.push(150 + (pm25 - 90) * 50 / 30);
  else if (pm25 <= 250) aqiValues.push(200 + (pm25 - 120) * 100 / 130);
  else aqiValues.push(300 + (pm25 - 250) * 100 / 250);
  
  // PM10 breakpoints (μg/m³)
  if (pm10 <= 50) aqiValues.push(pm10 * 50 / 50);
  else if (pm10 <= 100) aqiValues.push(50 + (pm10 - 50) * 50 / 50);
  else if (pm10 <= 250) aqiValues.push(100 + (pm10 - 100) * 50 / 150);
  else if (pm10 <= 350) aqiValues.push(150 + (pm10 - 250) * 50 / 100);
  else if (pm10 <= 430) aqiValues.push(200 + (pm10 - 350) * 100 / 80);
  else aqiValues.push(300 + (pm10 - 430) * 100 / 320);
  
  // NO2 breakpoints (μg/m³)
  if (no2 <= 40) aqiValues.push(no2 * 50 / 40);
  else if (no2 <= 80) aqiValues.push(50 + (no2 - 40) * 50 / 40);
  else if (no2 <= 180) aqiValues.push(100 + (no2 - 80) * 50 / 100);
  else if (no2 <= 280) aqiValues.push(150 + (no2 - 180) * 50 / 100);
  else if (no2 <= 400) aqiValues.push(200 + (no2 - 280) * 100 / 120);
  else aqiValues.push(300 + (no2 - 400) * 100 / 200);
  
  // O3 breakpoints (μg/m³)
  if (o3 <= 50) aqiValues.push(o3 * 50 / 50);
  else if (o3 <= 100) aqiValues.push(50 + (o3 - 50) * 50 / 50);
  else if (o3 <= 168) aqiValues.push(100 + (o3 - 100) * 50 / 68);
  else if (o3 <= 208) aqiValues.push(150 + (o3 - 168) * 50 / 40);
  else if (o3 <= 748) aqiValues.push(200 + (o3 - 208) * 100 / 540);
  else aqiValues.push(300 + (o3 - 748) * 100 / 1000);
  
  // Return the maximum AQI (most pollutant determines overall AQI)
  const finalAQI = Math.round(Math.max(...aqiValues));
  return Math.min(finalAQI, 500); // Cap at 500
}

// -------------------------------
// EJS and Static Files
// -------------------------------
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// -------------------------------
// ROUTES
// -------------------------------
const pageRoutes = require("./routes/pages");
app.use("/", pageRoutes);

// -------------------------------
// REAL AQI API (NEW)
// -------------------------------
app.get("/api/real-aqi/:pincode", async (req, res) => {
  try {
    const pincode = req.params.pincode;

    // Validate pincode
    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, error: "Enter valid 6-digit pincode" });
    }

    // Check if OpenWeather Key exists
    if (!process.env.OPENWEATHER_KEY) {
      return res.status(500).json({ success: false, error: "Server missing OpenWeather API key" });
    }

    // 1️⃣ Get location from India Post API
    const pinResponse = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    if (!pinResponse.data || pinResponse.data[0].Status !== "Success") {
      return res.status(404).json({ success: false, error: "Invalid Pincode" });
    }

    const postOffice = pinResponse.data[0].PostOffice[0];
    const village = postOffice.Name;  // Postal office/village name - more specific than district
    const city = postOffice.District;
    const state = postOffice.State;

    // 2️⃣ Get lat/lon from OpenWeather Geocoding API using POSTAL OFFICE NAME (village-level)
    // This gives different coordinates for different pincodes even in same city
    const geoResponse = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${village},${state},IN&limit=1&appid=${process.env.OPENWEATHER_KEY}`
    );

    if (!geoResponse.data || geoResponse.data.length === 0) {
      // Fallback to city/district if village not found
      const geoFallback = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct?q=${city},${state},IN&limit=1&appid=${process.env.OPENWEATHER_KEY}`
      );
      
      if (!geoFallback.data || geoFallback.data.length === 0) {
        return res.status(404).json({ success: false, error: "Location not found" });
      }
      
      var { lat, lon } = geoFallback.data[0];
    } else {
      var { lat, lon } = geoResponse.data[0];
    }

    // 3️⃣ Get AQI from OpenWeather Air Pollution API
    const aqiResponse = await axios.get(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}`
    );

    // If API responds with 401
    if (aqiResponse.status === 401) {
      return res.status(401).json({ success: false, error: "Invalid OpenWeather API Key" });
    }

    // Get pollutant data and calculate real AQI (0-500 scale)
    const components = aqiResponse.data.list[0].components;
    const aqi = calculateAQI(components);
    
    // Determine AQI level and color based on calculated AQI
    let level = "Unknown";
    let color = "gray";
    
    if (aqi <= 50) { level = "Good"; color = "green"; }
    else if (aqi <= 100) { level = "Satisfactory"; color = "yellow"; }
    else if (aqi <= 200) { level = "Moderately Polluted"; color = "orange"; }
    else if (aqi <= 300) { level = "Poor"; color = "red"; }
    else if (aqi <= 400) { level = "Very Poor"; color = "darkred"; }
    else { level = "Severe"; color = "maroon"; }

    res.json({
      success: true,
      pincode,
      village,
      city,
      state,
      aqi,
      level,
      color
    });

  } catch (error) {
    console.error("AQI Fetch Error:", error.response?.data || error.message);
    
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ success: false, error: "OpenWeather API Key is invalid" });
    }

    res.status(500).json({ success: false, error: "Server error fetching AQI" });
  }
});

// -------------------------------
// OLD STATIC JSON AQI ROUTES
// -------------------------------
const pincodeData = require("./data/pincodes.json");

// All Locations (Top 50)
app.get("/api/aqi", (req, res) => {
  try {
    const locations = Object.values(pincodeData)
      .reduce((acc, entry) => {
        const existing = acc.find(loc => loc.city === entry.city);
        if (!existing) {
          acc.push({
            pincode: entry.pincode,
            city: entry.city,
            state: entry.state,
            lat: parseFloat(entry.lat),
            lon: parseFloat(entry.lon),
            aqi: entry.aqi,
            category: entry.category,
            area: entry.area,
            region: entry.region,
            pollutantLevel: entry.pollutantLevel
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.aqi - a.aqi)
      .slice(0, 50);

    res.json({ success: true, data: locations });
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// By Pincode (Old JSON)
app.get("/api/aqi/pincode/:pincode", (req, res) => {
  try {
    const data = pincodeData[req.params.pincode];
    if (!data) {
      return res.status(404).json({ success: false, error: "Pincode not found" });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching pincode data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// By City
app.get("/api/aqi/city/:city", (req, res) => {
  try {
    const results = Object.values(pincodeData).filter(
      entry => entry.city.toLowerCase() === req.params.city.toLowerCase()
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "City not found" });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching city data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// By Region
app.get("/api/aqi/region/:region", (req, res) => {
  try {
    const results = Object.values(pincodeData).filter(
      entry => entry.region.toLowerCase() === req.params.region.toLowerCase()
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "Region not found" });
    }

    const unique = results.reduce((acc, entry) => {
      const existing = acc.find(loc => loc.city === entry.city);
      if (!existing) acc.push(entry);
      return acc;
    }, []);

    res.json({ success: true, data: unique });
  } catch (error) {
    console.error("Error fetching region data:", error);
    res.status(500).json({ success: false, error: error.message });
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
