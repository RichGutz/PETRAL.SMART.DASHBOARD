// Function to toggle perimeter labels visibility
function togglePerimeterLabels() {
    const isChecked = document.getElementById('toggle-perimeter-labels').checked;

    if (window.perimeterLabelsLayer) {
        if (isChecked) {
            map.addLayer(window.perimeterLabelsLayer);
        } else {
            map.removeLayer(window.perimeterLabelsLayer);
        }
    }
}
