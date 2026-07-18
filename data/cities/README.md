# City database

A precomputed lookup from a place to its resolved vivarium: the biome, landscape,
landmark, category, temperature unit, and the content pools available there. With
it, a client can render a known city from **only its current weather + temperature**
— no geocoding round-trip, and a stable, curated look per city.

## Why

The engine can already resolve *any* place on the fly (`resolveScene`), but that
depends on a geocoding request and a latitude/elevation guess for unknown cities.
This database:

- removes the geocoding hop for known cities (faster, offline-capable),
- lets a human curate the landscape/landmark for a city when the heuristic is wrong,
- is the substrate for the long-term goal: **support most of the world's ~5M named
  population centres**, starting with the US, then Mexico/Canada, then Europe/Asia,
  then everywhere.

## Files

- `us-seed.raw.json` — the hand-curated **input**: `[name, state, lat, lon, tz,
  elevation_m, population]` rows for notable US cities (a seed, not yet exhaustive).
- `us.json` — the **built** database (generated; do not edit by hand). Produced by
  `npm run build:cities`.

## Record shape (built `us.json`)

```json
{
  "name": "Las Vegas", "state": "NV", "country": "United States",
  "lat": 36.17, "lon": -115.14, "tz": "America/Los_Angeles",
  "elevation": 610, "population": 646790,
  "biome": "desert", "landscape": "sonoran", "landmark": "casino",
  "category": "desert", "unit": "fahrenheit",
  "content": { "trees": 6, "vehicles": 31, "people": 12, "animals": 18, "birds": 7, "signs": 8 }
}
```

`content` is the count of catalog entries valid for the city's biome — the trees,
vehicles, people, animals, birds and signs that can appear there.

## Building

```
npm run build:cities                 # build us.json from us-seed.raw.json
node scripts/build-cities.mjs --geonames path/to/US.txt   # (future) full GeoNames ingest
```

## Roadmap

1. **US** — expand the seed toward the full GeoNames US set (feature class `P`,
   ~2M rows; ship tiers by population: ≥100k, ≥15k, ≥500).
2. **Mexico + Canada**, then **Europe + Asia**, then the rest of the world.
3. Ship tiers as separate files (`us.json`, `ca.json`, …) or a single compact
   binary (a static SQLite read in-browser via a WASM build) once the row count
   makes JSON unwieldy.

## Attribution

When built from GeoNames data, the dataset is licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribute
"GeoNames (geonames.org)". The seed here is hand-curated and carries no such
requirement.
