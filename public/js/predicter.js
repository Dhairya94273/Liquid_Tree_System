// ========================================
// PREDICTOR FORM HANDLER
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('predictorForm');
  if (form) {
    form.addEventListener('submit', handlePrediction);
  }
});

function handlePrediction(e) {
  e.preventDefault();
  
  // Get form values
  const currentAQI = parseFloat(document.getElementById('currentAQI').value);
  const treeCount = parseInt(document.getElementById('trees').value);
  const areaType = document.getElementById('areaType').value || 'residential';
  const timeline = parseInt(document.getElementById('timeline').value);
  
  // Validate inputs
  if (!validateInputs(currentAQI, treeCount, timeline)) {
    return;
  }
  
  // Calculate impact
  const results = calculateAQIImpact(currentAQI, treeCount, areaType, timeline);
  
  // Display results
  displayResults(results, currentAQI, treeCount, areaType, timeline);
}

function validateInputs(aqi, trees, timeline) {
  if (aqi < 0 || aqi > 500) {
    displayError('AQI must be between 0 and 500');
    return false;
  }
  if (trees < 1 || trees > 10000) {
    displayError('Tree count must be between 1 and 10,000');
    return false;
  }
  if (timeline < 1 || timeline > 10) {
    displayError('Timeline must be between 1 and 10 years');
    return false;
  }
  return true;
}

function calculateAQIImpact(currentAQI, treeCount, areaType, timeline) {
  // Base improvement rate (per tree per year)
  const baseImprovement = 0.5;
  
  // Area type multiplier
  const areaMultipliers = {
    'residential': 1.0,
    'commercial': 1.3,
    'industrial': 1.8,
    'traffic-heavy': 1.5,
    'rural': 0.7
  };
  
  const areaMultiplier = areaMultipliers[areaType] || 1.0;
  
  // Calculate cumulative improvement over timeline
  let totalImprovement = 0;
  for (let year = 1; year <= timeline; year++) {
    const yearImprovement = (baseImprovement * treeCount * areaMultiplier) * (0.95 ** (year - 1));
    totalImprovement += yearImprovement;
  }
  
  // Calculate new AQI (minimum 20)
  const newAQI = Math.max(Math.round(currentAQI - totalImprovement), 20);
  
  // Calculate individual metrics (based on research)
  // Each liquid tree: 300kg CO2/year, 230kg O2/year, 900L water/year
  const co2PerTree = 300;
  const o2PerTree = 230;
  const waterPerTree = 900;
  const aqiReductionPerTree = baseImprovement;
  
  const totalCO2 = co2PerTree * treeCount * timeline;
  const totalO2 = o2PerTree * treeCount * timeline;
  const totalWater = waterPerTree * treeCount * timeline;
  const aqiReduction = Math.min(currentAQI - newAQI, currentAQI);
  
  // Determine AQI category
  const newCategory = getAQICategory(newAQI);
  const currentCategory = getAQICategory(currentAQI);
  
  // Calculate cost savings (based on health costs)
  const healthBenefit = (aqiReduction / currentAQI) * 100000 * treeCount; // Simplified
  
  return {
    currentAQI,
    newAQI,
    aqiReduction,
    aqiReductionPercent: Math.round((aqiReduction / currentAQI) * 100),
    totalCO2: Math.round(totalCO2),
    totalO2: Math.round(totalO2),
    totalWater: Math.round(totalWater),
    co2PerYear: Math.round(co2PerTree * treeCount),
    o2PerYear: Math.round(o2PerTree * treeCount),
    waterPerYear: Math.round(waterPerTree * treeCount),
    currentCategory,
    newCategory,
    healthBenefit: Math.round(healthBenefit),
    areaType,
    timeline,
    treeCount,
    improvementPerYear: Math.round(totalImprovement / timeline)
  };
}

function getAQICategory(aqi) {
  if (aqi <= 50) return { name: 'Good', status: 'good', color: '#10b981' };
  if (aqi <= 100) return { name: 'Satisfactory', status: 'moderate', color: '#f59e0b' };
  if (aqi <= 150) return { name: 'Moderately Polluted', status: 'moderate', color: '#f59e0b' };
  if (aqi <= 200) return { name: 'Poor', status: 'poor', color: '#ef4444' };
  if (aqi <= 300) return { name: 'Very Poor', status: 'poor', color: '#dc2626' };
  return { name: 'Severe', status: 'poor', color: '#7f1d1d' };
}

function displayResults(results, currentAQI, treeCount, areaType, timeline) {
  const outputDiv = document.getElementById('output');
  
  const html = `
    <div class="output-content">
      <!-- AQI Improvement Card -->
      <div class="output-card">
        <div class="output-card-header">
          <div class="output-card-icon">📊</div>
          <div>
            <h3 class="output-card-title">AQI Improvement</h3>
            <p class="output-card-subtitle">Air Quality Index after ${timeline} year${timeline > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div class="output-card-value">${results.newAQI}<span class="output-card-unit">Index</span></div>
        <span class="status-badge ${results.newCategory.status}">
          ${results.newCategory.name}
        </span>
        <p class="output-card-description">
          Down from <strong>${results.currentAQI}</strong> (${results.currentCategory.name})
        </p>
      </div>

      <!-- AQI Reduction Card -->
      <div class="output-card">
        <div class="output-card-header">
          <div class="output-card-icon">📉</div>
          <div>
            <h3 class="output-card-title">Total Reduction</h3>
            <p class="output-card-subtitle">Improvement over ${timeline} year${timeline > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div class="output-card-value">${results.aqiReductionPercent}<span class="output-card-unit">%</span></div>
        <p class="output-card-description">
          <strong>${results.aqiReduction}</strong> points reduction in air quality index
        </p>
      </div>

      <!-- CO2 Reduction Card -->
      <div class="output-card">
        <div class="output-card-header">
          <div class="output-card-icon">🌍</div>
          <div>
            <h3 class="output-card-title">CO₂ Captured</h3>
            <p class="output-card-subtitle">Carbon dioxide sequestration</p>
          </div>
        </div>
        <div class="output-card-value">${results.totalCO2.toLocaleString()}<span class="output-card-unit">kg</span></div>
        <p class="output-card-description">
          <strong>${results.co2PerYear.toLocaleString()}</strong> kg/year average
        </p>
      </div>

      <!-- O2 Generation Card -->
      <div class="output-card">
        <div class="output-card-header">
          <div class="output-card-icon">💨</div>
          <div>
            <h3 class="output-card-title">O₂ Generated</h3>
            <p class="output-card-subtitle">Oxygen production</p>
          </div>
        </div>
        <div class="output-card-value">${results.totalO2.toLocaleString()}<span class="output-card-unit">kg</span></div>
        <p class="output-card-description">
          <strong>${results.o2PerYear.toLocaleString()}</strong> kg/year average
        </p>
      </div>

      <!-- Water Usage Card -->
      <div class="output-card">
        <div class="output-card-header">
          <div class="output-card-icon">💧</div>
          <div>
            <h3 class="output-card-title">Water Recycled</h3>
            <p class="output-card-subtitle">Sustainable water usage</p>
          </div>
        </div>
        <div class="output-card-value">${results.totalWater.toLocaleString()}<span class="output-card-unit">L</span></div>
        <p class="output-card-description">
          <strong>${results.waterPerYear.toLocaleString()}</strong> liters/year average
        </p>
      </div>

      <!-- Health Impact Card -->
      <div class="output-card">
        <div class="output-card-header">
          <div class="output-card-icon">❤️</div>
          <div>
            <h3 class="output-card-title">Health Benefit</h3>
            <p class="output-card-subtitle">Estimated annual value</p>
          </div>
        </div>
        <div class="output-card-value">₹${(results.healthBenefit / timeline).toLocaleString()}<span class="output-card-unit">/year</span></div>
        <p class="output-card-description">
          Based on healthcare cost reduction and improved air quality
        </p>
      </div>

      <!-- Summary Card -->
      <div class="summary-card">
        <h3>📈 Implementation Summary</h3>
        <div class="summary-card-content">
          <div class="summary-stat">
            <div class="summary-stat-label">Liquid Trees</div>
            <div class="summary-stat-value">${results.treeCount.toLocaleString()}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-label">Timeline</div>
            <div class="summary-stat-value">${results.timeline} Year${results.timeline > 1 ? 's' : ''}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-label">Area Type</div>
            <div class="summary-stat-value">${areaType.charAt(0).toUpperCase() + areaType.slice(1).replace('-', ' ')}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-label">Avg Annual Improvement</div>
            <div class="summary-stat-value">${results.improvementPerYear}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  outputDiv.innerHTML = html;
  
  // Scroll to results
  setTimeout(() => {
    outputDiv.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function displayError(message) {
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = `
    <div class="error-message">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h4>Invalid Input</h4>
        <p>${message}</p>
      </div>
    </div>
  `;
}
