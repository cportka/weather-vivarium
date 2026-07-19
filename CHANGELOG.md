# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org). Every change bumps the version and adds an entry below.

## [0.4.1] - 2026-07-19

### Added
- **Tracked city count.** The README now advertises the precomputed total
  (**1,030** cities across **140** countries — the unique union of `world.json`'s
  1,000 and `us.json`'s 62), the demo shows it live from the loaded data, and a
  new test (`tests/cities-count.test.mjs`) enforces that the README figure matches
  the datasets so it can't drift.

## [0.4.0] - 2026-07-19

Making cities feel like cities, more of the world, and a smarter search.

### Added
- **Urban density.** A city's population now drives a built-up overlay
  (`urbanLayer`) on *any* biome: a distant hazy skyline plus, for denser places,
  a taller near row of buildings — with the gaps between them still showing the
  biome's nature, so the built-vs-nature ratio reads at a glance. Street trees
  thin and traffic thickens with density. Fixes big cities (Zürich, Mumbai,
  Moscow…) that used to look pastoral. New `population` / `density` options.
- **More classic landmarks:** St. Basil's Cathedral (Moscow), Tokyo Tower,
  Burj Khalifa, Marina Bay, Petronas Towers, Sagrada Família, Brandenburg Gate,
  and the Great Wall — for wider worldwide coverage.
- **Search autocomplete.** The demo's search box now suggests places as you type
  (name + admin + country) via Open-Meteo geocoding, with keyboard navigation.
  New exported `geocodeSuggest()`.

### Changed / Fixed
- **No more Mount Fuji inside a city.** The landmark picker is now biome-aware —
  a landmark only appears where its biome fits — and Tokyo maps to Tokyo Tower.
- **Honest labels for uncurated places.** A city that fell through to the biome
  guess now shows its biome's name (e.g. "Forest", "Savanna") instead of an
  unrelated named preset like "Pacific Northwest".

## [0.3.0] - 2026-07-19

Second feedback pass — polish, a thousand cities, and a discoverable site.

### Added
- **A thousand-city gallery.** `gallery.html` grows from 24 to **1000** live
  cities (top by population, from GeoNames via `all-the-cities`), virtualised
  with an `IntersectionObserver` so only the on-screen tiles run a render loop —
  plus a name/country filter. New `data/cities/world.json` (built by
  `npm run build:cities -- --world`) and offline timezones via `tz-lookup`.
- **The main page leads with your city.** The hero diorama now defaults to your
  IP-located city, followed by two rows of five: *interesting cities within 400
  miles* and *interesting cities around the world* (biome- and country-diverse).
- **Widget performance options** for dense grids: `minimalData` (skip the
  air-quality request) and `refreshMs: 0` (no auto-refresh).
- **Brand + social.** A logo (`assets/logo.png`), app icon, `favicon.svg`, and a
  1280×640 GitHub **social preview** (`assets/social-preview.png`), all rendered
  from the vivarium's own art.
- **Full SEO / discoverability pass** (Portka app-website-evaluator: 85 → 100):
  JSON-LD, `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest`,
  apple-touch-icon, a `<meta>` CSP, and `/.well-known/security.txt`.

### Fixed
- **Natural moon.** The phase is now drawn per-pixel with a proper terminator —
  a softly shaded sphere with earthshine — instead of a hard offset disc that
  read as a double circle.
- **Las Vegas.** The casino is pure neon celebration (chasing marquee, a
  searchlight sweep) with no temperature; the temperature moves to a "Welcome to
  Las Vegas"-style sign (silver diamond crown, starburst, classic red digits),
  paired to the casino via a landmark `pairedSign` hint.

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
