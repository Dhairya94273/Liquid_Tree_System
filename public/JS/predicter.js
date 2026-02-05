function predict() {
  const aqi = Number(document.getElementById("currentAQI").value);
  const trees = Number(document.getElementById("trees").value);

  const improvement = trees * 2;
  const newAQI = Math.max(aqi - improvement, 20);

  document.getElementById("output").innerText =
    `Predicted AQI After Installation: ${newAQI}`;
}
