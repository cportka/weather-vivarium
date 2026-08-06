#!/usr/bin/env node
/* update-reference-snapshot.mjs — regenerate tests/reference-cities.snapshot.json.
   Run this only when a change to the 50 reference cities is INTENDED, and look at
   verify/out/reference-50.png (npm run verify:reference) before committing. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { REFERENCE_CITIES, resolveReference } from "../verify/reference-cities.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

const cities = {};
for (const c of REFERENCE_CITIES) cities[c.name] = resolveReference(c);

const out = path.join(ROOT, "tests", "reference-cities.snapshot.json");
writeFileSync(out, JSON.stringify({
  note: "Locked expectations for the 50 reference cities. Regenerate deliberately with: node scripts/update-reference-snapshot.mjs",
  cities
}, null, 2) + "\n");
console.log(`Wrote ${out}: ${Object.keys(cities).length} cities`);
