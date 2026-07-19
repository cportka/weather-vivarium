# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org). Every change bumps the version and adds an entry below.

## [0.2.0] - 2026-07-19

Feedback pass after the first cut.

### Added
- **Demo "Near you" panel** — a 1×3 row of your best-guess city (keyless IP
  lookup, no permission prompt) plus the two most populous cities within 200
  miles, drawn from the shipped US city DB and a world-metro pool.
- **24-city gallery** — the live gallery grows from 12 to 24, now spanning the
  globe (Tokyo, London, Sydney, Cairo, Reykjavík, Cusco, …) with each place's
  country driving its °F/°C default.

### Fixed
- **City skyline no longer flickers.** The skyline was re-randomised every frame
  (it read as a background "moving way too fast"); it now uses a per-frame stable
  RNG (`env.srng`) so buildings — and the graffiti mural — hold still. Same fix
  applied to any static scenery.
- **Pyramids are right-side up** in Cairo (the triangles were inverted), and a
  touch bigger/brighter with a crisp edge so they read against the dunes.
- **Signs fit the temperature.** Widened the narrow boards (route shield, hanging
  shop sign, trail post, milestone, sandwich board, fuel totem) and centred the
  text so 3–4 digit readings (e.g. `104°`, `-15°`) don't overflow — fixes the
  cramped signs seen in Zürich and Nairobi.
- **Sydney Opera House** redrawn as recognisable overlapping white sail shells.
- **Landmark z-order.** A landmark now draws after the water cast, so a passing
  boat no longer floats in front of it (seen at the Opera House), while
  foreground trees/actors still layer over it.
- **No Los Angeles flash** when switching cities: a city-only widget now holds
  its (invisible) canvas until geocoding resolves and fades straight in on the
  correct city, instead of briefly showing the LA default.

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
