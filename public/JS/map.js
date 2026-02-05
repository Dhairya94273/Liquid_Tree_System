const map = L.map("map").setView([22.6, 78.9], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const cities = [
  { name: "Delhi", lat: 28.61, lon: 77.20, aqi: 220 },
  { name: "Mumbai", lat: 19.07, lon: 72.87, aqi: 110 },
  { name: "Bengaluru", lat: 12.97, lon: 77.59, aqi: 75 },
  { name: "Chennai", lat: 13.08, lon: 80.27, aqi: 90 },
  { name: "Kolkata", lat: 22.57, lon: 88.36, aqi: 160 },
];

function getColor(aqi) {
  if (aqi <= 50) return "green";
  if (aqi <= 100) return "yellow";
  if (aqi <= 200) return "orange";
  return "red";
}

cities.forEach(c => {
  L.circleMarker([c.lat, c.lon], {
    radius: 10,
    color: getColor(c.aqi),
    fillOpacity: 0.8
  }).addTo(map)
    .bindPopup(`<b>${c.name}</b><br>AQI: ${c.aqi}`);
});
