// Initialize map with India center
const map = L.map("map").setView([22.6, 78.9], 5);

// Add OpenStreetMap tiles with better styling
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19,
  minZoom: 3
}).addTo(map);

// Store all markers and data
let allMarkers = [];
let currentFilter = "all";
let selectedAQICategory = "all";

// AQI Category colors with gradient support
const aqiColors = {
  good: { color: "#22c55e", label: "Good (0-50)", min: 0, max: 50 },
  moderate: { color: "#eab308", label: "Moderate (51-100)", min: 51, max: 100 },
  unhealthy_sensitive: { color: "#f97316", label: "Unhealthy for Sensitive (101-150)", min: 101, max: 150 },
  unhealthy: { color: "#ef4444", label: "Unhealthy (151-200)", min: 151, max: 200 },
  very_unhealthy: { color: "#991b1b", label: "Very Unhealthy (201-300)", min: 201, max: 300 },
  hazardous: { color: "#6b21a8", label: "Hazardous (300+)", min: 300, max: 500 }
};

// Get color based on AQI value
function getAQIColor(aqi) {
  const value = parseInt(aqi);
  if (value <= 50) return aqiColors.good.color;
  if (value <= 100) return aqiColors.moderate.color;
  if (value <= 150) return aqiColors.unhealthy_sensitive.color;
  if (value <= 200) return aqiColors.unhealthy.color;
  if (value <= 300) return aqiColors.very_unhealthy.color;
  return aqiColors.hazardous.color;
}

// Get category label based on AQI value
function getAQICategory(aqi) {
  const value = parseInt(aqi);
  if (value <= 50) return "Good";
  if (value <= 100) return "Moderate";
  if (value <= 150) return "Unhealthy for Sensitive";
  if (value <= 200) return "Unhealthy";
  if (value <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// Get health advice based on AQI
function getHealthAdvice(aqi) {
  const value = parseInt(aqi);
  if (value <= 50) return "Air quality is good. Enjoy outdoor activities!";
  if (value <= 100) return "Air quality is acceptable. You can be outdoors.";
  if (value <= 150) return "Sensitive groups should limit outdoor activities.";
  if (value <= 200) return "Everyone should limit outdoor activities.";
  if (value <= 300) return "Avoid outdoor activities. Health effects are likely.";
  return "Stay indoors and keep activity levels low.";
}

// Create popup content
function createPopupContent(location) {
  return `
    <div style="font-family: 'Poppins', sans-serif; min-width: 250px;">
      <h3 style="margin: 0 0 1rem 0; color: #6ee7b7; font-size: 1.1rem;">${location.city}</h3>
      <div style="background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #cbd5e1;">AQI:</span>
          <span style="color: ${getAQIColor(location.aqi)}; font-weight: 700; font-size: 1.2rem;">${location.aqi}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #cbd5e1;">Category:</span>
          <span style="color: ${getAQIColor(location.aqi)}; font-weight: 600;">${getAQICategory(location.aqi)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: #cbd5e1;">State:</span>
          <span style="color: #f0f9ff;">${location.state}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #cbd5e1;">Area Type:</span>
          <span style="color: #f0f9ff;">${location.area || "N/A"}</span>
        </div>
      </div>
      <div style="background: rgba(56, 189, 248, 0.05); padding: 0.8rem; border-radius: 8px; border-left: 3px solid #38bdff;">
        <p style="margin: 0; color: #cbd5e1; font-size: 0.9rem;">
          <strong>Health Advice:</strong> ${getHealthAdvice(location.aqi)}
        </p>
      </div>
    </div>
  `;
}

// Create circle marker with dynamic size based on AQI
function createMarker(location) {
  const radiusMultiplier = Math.max(8, Math.min(25, location.aqi / 15));
  
  const marker = L.circleMarker([location.lat, location.lon], {
    radius: radiusMultiplier,
    fillColor: getAQIColor(location.aqi),
    color: getAQIColor(location.aqi),
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.7,
    className: 'aqi-marker'
  }).addTo(map);

  // Create popup with detailed information
  const popup = L.popup({
    maxWidth: 300,
    className: 'aqi-popup'
  }).setContent(createPopupContent(location));

  marker.bindPopup(popup);

  // Show city name on hover (tooltip)
  marker.bindTooltip(`${location.city}<br>AQI: ${location.aqi}`, {
    permanent: false,
    direction: 'top',
    offset: [0, -10],
    opacity: 0.9
  });

  // Highlight marker on hover
  marker.on('mouseover', function () {
    this.setStyle({ weight: 4, opacity: 1, fillOpacity: 0.9 });
  });

  marker.on('mouseout', function () {
    this.setStyle({ weight: 2, opacity: 0.8, fillOpacity: 0.7 });
  });

  return marker;
}

// Fetch and display AQI data
async function fetchAndDisplayAQI() {
  try {
    const response = await fetch('/api/aqi');
    const result = await response.json();

    if (!result.success) {
      console.error("Error fetching AQI data:", result.error);
      return;
    }

    // Clear existing markers
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = [];

    // Add new markers
    result.data.forEach(location => {
      const marker = createMarker(location);
      allMarkers.push({ marker, data: location });
    });

    // Update statistics
    updateStatistics(result.data);

    // Store data for filtering
    window.allAQIData = result.data;

    console.log(`✅ Loaded ${result.data.length} locations with real AQI data`);
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    loadFallbackData();
  }
}

// Load fallback data if API fails
function loadFallbackData() {
  console.log("Loading fallback data...");
  const fallbackData = [
    { name: "Delhi", city: "Delhi", lat: 28.61, lon: 77.20, aqi: 285, state: "Delhi", area: "Commercial", region: "North" },
    { name: "Mumbai", city: "Mumbai", lat: 19.07, lon: 72.87, aqi: 110, state: "Maharashtra", area: "Residential", region: "West" },
    { name: "Bengaluru", city: "Bengaluru", lat: 12.97, lon: 77.59, aqi: 75, state: "Karnataka", area: "Commercial", region: "South" },
    { name: "Chennai", city: "Chennai", lat: 13.08, lon: 80.27, aqi: 90, state: "Tamil Nadu", area: "Residential", region: "South" },
    { name: "Kolkata", city: "Kolkata", lat: 22.57, lon: 88.36, aqi: 160, state: "West Bengal", area: "Industrial", region: "East" },
    { name: "Hyderabad", city: "Hyderabad", lat: 17.36, lon: 78.47, aqi: 95, state: "Telangana", area: "Commercial", region: "South" },
    { name: "Pune", city: "Pune", lat: 18.52, lon: 73.85, aqi: 85, state: "Maharashtra", area: "Urban", region: "West" }
  ];

  allMarkers = [];
  fallbackData.forEach(location => {
    const marker = createMarker(location);
    allMarkers.push({ marker, data: location });
  });

  updateStatistics(fallbackData);
  window.allAQIData = fallbackData;
}

// Update AQI statistics display
function updateStatistics(data) {
  if (!data || data.length === 0) return;

  const aqiValues = data.map(d => parseInt(d.aqi));
  const avgAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
  const maxAQI = Math.max(...aqiValues);
  const minAQI = Math.min(...aqiValues);

  // Update stats in the page if elements exist
  const statsElement = document.querySelector('.aqi-info');
  if (statsElement) {
    statsElement.innerHTML = `
      <div class="aqi-card">
        <h3>Average AQI</h3>
        <div class="aqi-value">${avgAQI}</div>
        <div class="aqi-category">${getAQICategory(avgAQI)}</div>
      </div>
      <div class="aqi-card">
        <h3>Highest AQI</h3>
        <div class="aqi-value">${maxAQI}</div>
        <div class="aqi-category">${getAQICategory(maxAQI)}</div>
      </div>
      <div class="aqi-card">
        <h3>Lowest AQI</h3>
        <div class="aqi-value">${minAQI}</div>
        <div class="aqi-category">${getAQICategory(minAQI)}</div>
      </div>
      <div class="aqi-card">
        <h3>Locations</h3>
        <div class="aqi-value">${data.length}</div>
        <div class="aqi-category">Monitored</div>
      </div>
    `;
  }
}

// Filter markers by AQI category
function filterByCategory(category) {
  selectedAQICategory = category;
  allMarkers.forEach(({ marker, data }) => {
    if (category === "all") {
      marker.setStyle({ opacity: 0.8, fillOpacity: 0.7 });
    } else {
      const dataCategory = getAQICategory(data.aqi).toLowerCase().replace(/\s+/g, "_");
      if (dataCategory === category) {
        marker.setStyle({ opacity: 0.8, fillOpacity: 0.7 });
      } else {
        marker.setStyle({ opacity: 0.3, fillOpacity: 0.3 });
      }
    }
  });
}

// Search for city
function searchCity(cityName) {
  if (!cityName) {
    allMarkers.forEach(({ marker }) => marker.setStyle({ opacity: 0.8, fillOpacity: 0.7 }));
    return;
  }

  const searchTerm = cityName.toLowerCase();
  allMarkers.forEach(({ marker, data }) => {
    if (data.city.toLowerCase().includes(searchTerm)) {
      marker.setStyle({ opacity: 0.8, fillOpacity: 0.7, weight: 3 });
      marker.openPopup();
    } else {
      marker.setStyle({ opacity: 0.3, fillOpacity: 0.3, weight: 2 });
    }
  });
}

// Add legend to map
function addLegend() {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'info');
    div.style.background = 'rgba(10, 14, 39, 0.95)';
    div.style.padding = '1rem';
    div.style.borderRadius = '8px';
    div.style.border = '1px solid rgba(16, 185, 129, 0.1)';
    div.style.color = '#f0f9ff';
    div.style.fontSize = '0.85rem';
    div.style.fontFamily = "'Inter', sans-serif";
    div.style.backdropFilter = 'blur(10px)';

    let html = '<h4 style="margin: 0 0 1rem 0; color: #6ee7b7; font-weight: 700;">AQI Legend</h4>';

    Object.entries(aqiColors).forEach(([key, { color, label }]) => {
      html += `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="width: 20px; height: 20px; background-color: ${color}; border-radius: 50%; border: 2px solid ${color};"></span>
          <span>${label}</span>
        </div>
      `;
    });

    div.innerHTML = html;
    return div;
  };

  legend.addTo(map);
}

// Initialize map with data on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplayAQI();
  addLegend();

  // Add event listeners for controls if they exist
  const searchInput = document.querySelector('.map-controls input[type="text"]');
  if (searchInput) {
    searchInput.addEventListener('change', (e) => searchCity(e.target.value));
  }

  const filterSelect = document.querySelector('.map-controls select');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => filterByCategory(e.target.value));
  }
});

// Refresh data every 5 minutes (optional)
setInterval(() => {
  console.log("Refreshing AQI data...");
  fetchAndDisplayAQI();
}, 5 * 60 * 1000);
