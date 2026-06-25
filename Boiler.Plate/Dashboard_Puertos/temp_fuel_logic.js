// --- Fuel Logistics Calculator Logic ---
function initFuelCalculator() {
    const inputs = ['input-fuel-vol', 'input-fuel-pct', 'input-fuel-conv', 'input-fuel-tanker'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateFuelLogistics);
    });
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
    document.getElementById('res-fuel-total').innerText = `${Math.round(totalGal).toLocaleString()} gal`;
    document.getElementById('res-fuel-trucks').innerText = `${tankersPerDay.toFixed(1)} 🚛 /día`;
    document.getElementById('res-fuel-events').innerText = `${dailyEvents.toFixed(1)} viajes/día`;
}

// Ensure init is called
document.addEventListener('DOMContentLoaded', initFuelCalculator);

// --- Layer Toggle Logic ---
function togglePortLabels() {
    const show = document.getElementById('toggle-port-labels').checked;

    // Toggle tooltip opacity/visibility for all port markers
    // We can't easily reference local 'markers' variable unless we expose it or query DOM.
    // Easier: Loop through map layers and check for 'port-label-container' class in tooltip

    map.eachLayer(layer => {
        if (layer.getTooltip && layer.getTooltip()) {
            const tooltip = layer.getTooltip();
            if (tooltip.options.className && tooltip.options.className.includes('port-label-container')) {
                if (show) {
                    map.openTooltip(tooltip);
                } else {
                    map.closeTooltip(tooltip);
                }
            }
        }
    });

    // Also handle the "Info Boat" markers which are separate markers
    // But logic says "borrar tags", usually meaning the text labels.
    // If user implies hiding icons too, we'd need more logic.
    // Assuming labels first.
}
