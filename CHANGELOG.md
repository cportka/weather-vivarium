# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org). Every change bumps the version and adds an entry below.

## [0.1.0] - 2026-07-18

The first cut: generalise the one-off Los Angeles beach widget from
`kevin-website` into a reusable, any-city weather diorama engine.

### Added
- **Engine core.** A dependency-free 50×50 pixel-art renderer: `painter.js`
  (primitives ported 1:1 from the LA widget), seeded RNG, timezone-aware clock +
  sun/moon geometry with real moon phase (`astronomy.js`), a generalised sky
  palette (`sky.js`), WMO weather interpretation (`wmo.js`), and celestial bodies.
- **Any city.** `geocode.js` (Open-Meteo geocoding) resolves a city name to
  coordinates + timezone + elevation; `weather.js` fetches current conditions,
  marine wave height (coastal), and air quality for any latitude/longitude, with
  the same graceful-fallback discipline as the original. Sunrise/sunset come from
  the place, so the sun sets at the *place's* dusk.
- **World model.** 14 biomes/backgrounds (coast, ocean, mountain, desert, forest,
  jungle, plains, city, tundra, wetland, lake, savanna, canyon, farmland), 29
  named landscapes mapping real cities onto them, and a resolver that infers a
  biome from a city (curated matches, then a latitude/elevation guess).
- **Catalogs.** Trees, vehicles (road + water), people, animals (ground/water/air),
  birds, signs, and landmarks — each a data-driven catalog of pixel-art entries
  selected per biome. The eight LA cars, the palm, the gull/pelican, the beachgoer,
  the cat and the neon temperature sign are ported as the reference idiom.
- **Landmarks.** A prominent, recognisable feature per city (Statue of Liberty,
  Space Needle, casino, Diamond Head, riverboat, …), matched by city name.
- **Temperature unit.** `temperatureUnit: 'fahrenheit' | 'celsius' | 'auto'`,
  defaulting to the place's country convention.
- **Weather effects.** Rain, snow, fog, storm lightning, blowing wind particles,
  rainbow, aurora (high-latitude nights), sandstorm, heat shimmer, and hail.
- **Widget.** `createVivarium(el, { city })` mounts a self-sizing canvas with a
  render loop, live data, a11y labelling, reduced-motion support, and optional
  click-to-zoom.
- **Verification.** A headless-Chromium harness that screenshots catalog contact
  sheets and example scenes, plus a Node stub-painter test that renders every
  catalog entry without a browser so CI catches broken sprites.
- **Onboarding.** Portka standard workflow (`.claude/CLAUDE.md`), permissions
  allowlist, SemVer version sync + unit tests (`tests/`), and CI.
