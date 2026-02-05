document.getElementById("aqiForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const aqi = Math.floor(Math.random() * 200) + 30;
  const color =
    aqi <= 50 ? "green" :
    aqi <= 100 ? "yellow" :
    aqi <= 200 ? "orange" : "red";

  document.getElementById("result").innerHTML =
    `<h3 style="color:${color}">AQI Level: ${aqi}</h3>`;
});
