#!/usr/bin/env node
/* update-reference-snapshot.mjs — regenerate tests/reference-cities.snapshot.json.
   Run this only when a change to the 50 reference cities is INTENDED, and look at
   verify/out/reference-50.png (npm run verify:reference) before committing. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { REFERENCE_CITIES } from "../verify/reference-cities.mjs";
import { resolveScene } from "../src/world/resolve.js";
import { styleForBiome } from "../src/catalog/settlements.js";
import { seedFrom } from "../src/engine/random.js";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const density = (pop) => Math.max(0, Math.min(1, (Math.log10(pop) - 3.6) / 4.2));
const tierName = (d) => (d < 0.2 ? "rural" : d < 0.36 ? "town" : d < 0.62 ? "city" : "metropolis");

const cities = {};
for (const c of REFERENCE_CITIES) {
  const r = resolveScene({ name: c.name, latitude: c.lat, longitude: c.lon, country: c.country }, {});
  const d = density(c.population);
  const s = styleForBiome(r.biome.id, seedFrom(c.name + c.lat), d, r.region);
  cities[c.name] = {
    biome: r.biome.id, region: r.region, tier: tierName(d),
    style: s ? s.id : null, landmark: r.landmark ? r.landmark.id : null
  };
}

const out = path.join(ROOT, "tests", "reference-cities.snapshot.json");
writeFileSync(out, JSON.stringify({
  note: "Locked expectations for the 50 reference cities. Regenerate deliberately with: node scripts/update-reference-snapshot.mjs",
  cities
}, null, 2) + "\n");
console.log(`Wrote ${out}: ${Object.keys(cities).length} cities`);
