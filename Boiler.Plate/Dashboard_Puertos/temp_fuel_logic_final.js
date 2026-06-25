// --- Fuel Logistics Calculator Logic ---
function initFuelCalculator() {
    const inputs = ['input-fuel-vol', 'input-fuel-pct', 'input-fuel-conv', 'input-fuel-tanker'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateFuelLogistics);
    });

    // Initial Calc
    calculateFuelLogistics();
}

function calculateFuelLogistics() {
    // 1. Get Inputs
    const volM3 = parseFloat(document.getElementById('input-fuel-vol').value) || 0;
    const pct = parseFloat(document.getElementById('input-fuel-pct').value) || 100;
    const convFactor = parseFloat(document.getElementById('input-fuel-conv').value) || 264.172;
    const tankerVol = parseFloat(document.getElementById('input-fuel-tanker').value) || 9000;

    // 2. Calculate Total Volume in Gallons
    // Formula: Vol(m3) * (%/100) * Conversion
    const totalGal = volM3 * (pct / 100) * convFactor;

    // 3. Calculate Daily Tankers
    const days = 365;
    const tankersPerYear = totalGal / tankerVol;
    const tankersPerDay = tankersPerYear / days;

    // 4. Calculate Total Events (Round Trip)
    const dailyEvents = tankersPerDay * 2;

    // 5. Update UI
    const elTotal = document.getElementById('res-fuel-total');
    if (elTotal) elTotal.innerText = `${Math.round(totalGal).toLocaleString()} gal`;

    const elTrucks = document.getElementById('res-fuel-trucks');
    if (elTrucks) elTrucks.innerText = `${tankersPerDay.toFixed(1)} 🚛 /día`;

    const elEvents = document.getElementById('res-fuel-events');
    if (elEvents) elEvents.innerText = `${dailyEvents.toFixed(1)} viajes/día`;
}

// Ensure init is called
document.addEventListener('DOMContentLoaded', initFuelCalculator);

// --- Layer Toggle Logic ---
function togglePortLabels() {
    const show = document.getElementById('toggle-port-labels').checked;
    const mapContainer = document.getElementById('map');

    if (show) {
        mapContainer.classList.remove('map-hide-port-labels');
    } else {
        mapContainer.classList.add('map-hide-port-labels');
    }
}
