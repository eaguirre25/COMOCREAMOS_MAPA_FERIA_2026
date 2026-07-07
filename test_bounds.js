const fs = require('fs');
const geojson = JSON.parse(fs.readFileSync('E:/MAPA FERIA 2026/SAN MARTIN LOCALIDADES.geojson', 'utf8'));

function getGeoJSONBounds(geojson) {
    const bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
    function walk(coords) {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            bounds[0][0] = Math.min(bounds[0][0], coords[0]);
            bounds[0][1] = Math.min(bounds[0][1], coords[1]);
            bounds[1][0] = Math.max(bounds[1][0], coords[0]);
            bounds[1][1] = Math.max(bounds[1][1], coords[1]);
            return;
        }
        coords.forEach(walk);
    }
    geojson.features.forEach(feature => walk(feature.geometry.coordinates));
    return bounds;
}

console.log(getGeoJSONBounds(geojson));
