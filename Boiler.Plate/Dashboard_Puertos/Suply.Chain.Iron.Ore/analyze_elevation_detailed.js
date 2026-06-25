// Generate intermediate points every 500m along conveyor routes
// and query elevations for detailed slope analysis

const https = require('https');

// Conveyor segments with start/end coordinates
const segments = {
    'Faja 1a': {
        start: { lat: -15.241667, lon: -75.184444, name: 'Island 1' },
        end: { lat: -15.198056, lon: -75.227222, name: 'Waypoint' },
        distance: 6610 // meters
    },
    'Faja 1b': {
        start: { lat: -15.198056, lon: -75.227222, name: 'Waypoint' },
        end: { lat: -15.192778, lon: -75.243611, name: 'Petral' },
        distance: 1560
    },
    'Faja 2': {
        start: { lat: -15.333611, lon: -75.146389, name: 'Island 2' },
        end: { lat: -15.198056, lon: -75.227222, name: 'Waypoint' },
        distance: 17810
    },
    'Faja 3': {
        start: { lat: -15.310833, lon: -75.098889, name: 'Island 3' },
        end: { lat: -15.198056, lon: -75.227222, name: 'Waypoint' },
        distance: 18670
    }
};

// Generate intermediate points every 500m
function generateIntermediatePoints(start, end, totalDistance) {
    const points = [];
    const numPoints = Math.ceil(totalDistance / 500);

    for (let i = 0; i <= numPoints; i++) {
        const ratio = i / numPoints;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lon = start.lon + (end.lon - start.lon) * ratio;
        const distance = i * 500;

        points.push({ lat, lon, distance });
    }

    return points;
}

// Collect all points for API query
const allPoints = [];
const segmentPoints = {};

for (const [name, segment] of Object.entries(segments)) {
    const points = generateIntermediatePoints(segment.start, segment.end, segment.distance);
    segmentPoints[name] = points;
    allPoints.push(...points);
}

// Build API URL (max 100 points per request)
const locations = allPoints.map(p => `${p.lat},${p.lon}`).join('|');
const apiUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`;

console.log(`Generated ${allPoints.length} points total`);
console.log('Querying elevations...');

// Query API
https.get(apiUrl, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const result = JSON.parse(data);
        const elevations = result.results;

        // Assign elevations back to segments
        let idx = 0;
        for (const [name, points] of Object.entries(segmentPoints)) {
            for (let i = 0; i < points.length; i++) {
                points[i].elevation = elevations[idx].elevation;
                idx++;
            }
        }

        // Calculate slopes for each segment
        console.log('\n=== DETAILED ELEVATION ANALYSIS ===\n');

        for (const [name, points] of Object.entries(segmentPoints)) {
            console.log(`\n${name}:`);
            console.log('Distance(m) | Elevation(m) | Slope(%)');
            console.log('------------|--------------|----------');

            let maxSlope = 0;
            let minSlope = 0;

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                let slope = 'N/A';

                if (i > 0) {
                    const prev = points[i - 1];
                    const dh = p.elevation - prev.elevation;
                    const dd = 500; // 500m segments
                    const s = (dh / dd) * 100;
                    slope = s.toFixed(2) + '%';

                    if (s > maxSlope) maxSlope = s;
                    if (s < minSlope) minSlope = s;
                }

                console.log(`${p.distance.toString().padStart(11)} | ${p.elevation.toString().padStart(12)} | ${slope.toString().padStart(8)}`);
            }

            console.log(`\nMax slope: ${maxSlope.toFixed(2)}%`);
            console.log(`Min slope: ${minSlope.toFixed(2)}%`);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
