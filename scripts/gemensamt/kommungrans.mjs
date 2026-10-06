// Ligger en plats i Uppsala kommun? Avgörs med kommungränsen som polygon.
//
// Gränsen kommer från OpenStreetMap (relation 305455), förenklad till några
// hundra punkter. Licens: Data © OpenStreetMap contributors, ODbL 1.0.
// Förenklingen gör att gränsen kan slå fel med några hundra meter, vilket
// räcker för att skilja Uppsala från grannkommunerna.

import { readFileSync } from "node:fs";

const GRANS = JSON.parse(readFileSync(new URL("./uppsala-kommun.geojson", import.meta.url), "utf8")).features[0].geometry;

// Klassisk punkt-i-polygon: räkna hur många kanter en stråle från punkten korsar.
function iRing(lng, lat, ring) {
  let inne = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inne = !inne;
  }
  return inne;
}

function iPolygon(lng, lat, polygon) {
  const [yttre, ...hal] = polygon;
  return iRing(lng, lat, yttre) && !hal.some((h) => iRing(lng, lat, h));
}

export function iUppsalaKommun(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const polygoner = GRANS.type === "MultiPolygon" ? GRANS.coordinates : [GRANS.coordinates];
  return polygoner.some((p) => iPolygon(lng, lat, p));
}
