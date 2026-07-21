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

Two datasets ship, **disjoint by country** so their union is exactly their sum
(**15,000** places across **191** countries):

- `us.json` — the top **5,000** US cities by population.
- `world.json` — the top **10,000** cities **outside** the US. (US cities live in
  `us.json`; keeping them out here avoids double-counting.)

The [gallery](../../gallery.html) hangs the 10,000 most-populous of the combined
set on its wall; everything precomputed is still reachable by search on the demo.

Both are **generated** (do not edit by hand) from [GeoNames](https://geonames.org)
via the `all-the-cities` package (pop ≥ 1000), with offline timezones from
`tz-lookup`. `us-seed.raw.json` is a small hand-curated US seed kept as an
alternate input (`[name, state, lat, lon, tz, elevation_m, population]` rows).

## Record shape

```json
{
  "name": "Las Vegas", "cc": "US", "admin": "NV",
  "lat": 36.175, "lon": -115.137, "tz": "America/Los_Angeles",
  "population": 623747,
  "biome": "desert", "landscape": "sonoran", "landmark": "casino",
  "category": "desert", "unit": "fahrenheit"
}
```

`cc` is the ISO country code, `admin` the state/region code (so same-named cities
in different states stay distinct). A client renders the city from this plus its
current weather — no geocoding hop.

## Building

```
npm run build:cities -- --us-top 5000    # build us.json — top 5,000 US cities
npm run build:cities -- --world 10000    # build world.json — top 10,000 non-US cities
npm run build:cities                     # (alt) build us.json from the curated seed
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
