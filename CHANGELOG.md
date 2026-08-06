# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org). Every change bumps the version and adds an entry below.

## [0.10.0] - 2026-08-06

From a full review of the reference set.

### Fixed
- **Los Angeles has its swaying palm back** (regression). Trees were a weighted
  random draw, so LA's signature palm was a coin flip; calling cards now cover trees
  too, and LA and Honolulu always lead with a palm (Kyoto with cherry blossom).
- **New York is dense again** (regression). Buildings are packed shoulder to shoulder
  at metropolis density instead of leaving town-sized gaps between them — the gap
  between buildings and the gap between clusters now both scale with density.
- **Trees and buildings no longer block each other.** Trees take the free-est of a
  set of slots — never covering the landmark or another tree — and the settlement
  steps *around* the tree spans,
  so a tree and the building behind it both show fully — **Kyoto** and **Mumbai** were
  the worst cases.
- **Zurich's shapeless grey blob is gone.** Where the horizon already has a silhouette
  of its own (mountains, canyon rims), the distant skyline is suppressed — a handful of
  far blocks against a mountain wall just read as a smudge. Those places show their
  size through the settlement in front.
- **Miami keeps its swamp but reads as a big place** — the distant skyline is stronger
  now, so a few towers stand behind the cypress and stilt houses.
- **Small buildings are bigger.** The minimum is now 8px, and the low styles (suburb,
  low-rise, adobe, chalet, round hut, farmstead) start at 8–9px, so houses hold their
  own beside a tree or a person — **Torrance**'s tract houses were dwarfed.
- **Bangkok isn't bland**: it gets **Wat Arun**, the Temple of Dawn — a tall porcelain
  prang flanked by two smaller ones.
- **Bengaluru is denser** while staying the green jungle city it should be.

### Added
- **27,000 precomputed cities** across 204 countries (11,000 US + 16,000
  international) — still 1.5 MB, because 27 is lucky.
- `verify.html` shows the running version.

## [0.9.0] - 2026-08-06

### Added
- **Calling cards.** A place can send out a specific character *first*, before the
  cast turns over to the usual random draw — the establishing shot. Los Angeles opens
  with the beachgoer on her towel, Nairobi with a giraffe, Cusco with a llama, New
  Orleans with a street musician, Aspen with a skier, Kyoto with a monk, Honolulu and
  Sydney with a surfer, Reykjavík with a gull. `resolveScene` exposes `callingCard`,
  and a test proves each named sprite exists *and* can actually appear in that city's
  biome (which caught three that silently couldn't).
- **Ground animals actually appear.** The `groundAnimals` pool existed and was filled,
  but nothing ever drew from it — 30-odd species were unreachable. They now amble
  across the back of the scene, which is also what makes the animal calling cards work.
- **`verify.html`** — flip through the whole reference set one city at a time: ← →
  (or the buttons), a day/night toggle, live-weather toggle, a jump menu, dot strip,
  and the full attributes card for each.
- **Torrance** joins the reference set (51 cities), as a suburb reference.

### Changed
- **The wall is uncapped** — every precomputed city, because searching the
  whole set is the fun part. Tiles still only come alive near the viewport.
- **Seattle is a green city on water.** New `puget-sound` landscape (Seattle, Tacoma,
  Olympia, Bellingham, Everett, Bremerton, Victoria): sound and inlet with a far shore
  and evergreen banks rather than surf beach.
- **The Space Needle is bigger and better** — 31px tall with tapered legs sweeping to
  a waist, a proper flying-saucer deck with a warm ring of lit windows after dark, and
  a blinking beacon.
- **The Golden Gate sits 2px further back**, so it reads as distance.
- **Swimming animals sit 2px higher** in the water — a whale reads as being out in it
  rather than beached at the near edge.
- Gulls range into the tundra, kangaroos across grassland/bush/coastal scrub, and the
  street musician busks in more biomes — all so their calling cards can fire.

## [0.8.1] - 2026-08-05

### Fixed
- **The Golden Gate spans the whole width.** The bridge was drawn 48px wide on a
  50px scene, leaving a sliver of open water at each edge; the headlands now run
  right off both sides.
- **Suburbs look like suburbs.** A new `suburb` style — tract houses with pitched
  roofs, garages, driveways and lawns, built out wall to wall — and rural styles
  (farmsteads, hut villages) drop out once a place has a real population. **Torrance**
  and **Pasadena** were reading as woodland hamlets.
- **Paved roads where people live.** Any place above town density gets asphalt with
  markings whatever the terrain, so a suburb of 150,000 is no longer served by a dirt
  track.
- **Your city, properly.** The demo now snaps an IP fix to the nearest significant
  precomputed city (so the hero carries a real population, and therefore the right
  density and skyline) → falls back to the best city near those coordinates → and only
  if nothing geographic can be established at all, Los Angeles. LA itself now carries
  its true coordinates and population everywhere, so it always resolves as the
  metropolis it is rather than as a nondescript town.

### Added
- **The reference sheets are generated in CI.** A `reference cities (50)` job renders
  the day and night sheets plus the catalog/scene sweep in a real browser on every
  push and uploads them as the `reference-cities` artifact. The sheets are also
  committed under `assets/` and shown in the README, so they're visible without
  downloading anything. Render scripts now find Chromium in CI or the sandbox alike.

## [0.8.0] - 2026-08-05

Nothing built on water, architecture that belongs where it stands, and a standing
50-city reference set to judge every future change against.

### Fixed
- **Never a building on open water.** Placement is now a real rule rather than a
  height cap: a settlement stands on dry land, a style meant to sit over water
  (stilt houses on a marsh) declares it, and anything else steps back above the
  waterline. Looking out to sea there's no land to build on, so the horizon stays
  clean sea and sky — **Los Angeles** is a beach again, with no grey pillars
  standing in the ocean and no shrunken houses cluttering the sand.
- **No buildings shorter than the people.** A building has to be at least 7px —
  taller than a person or a bird — or the shore simply stays open. That's what
  removed LA's tiny sand-huts instead of merely shrinking them.
- **Stilt houses came back.** The 0.7.0 waterline cap had silently suppressed
  settlements in wetland and canyon scenes (New Orleans lost its swamp shacks).
- **Architecture belongs where it stands.** Vernacular styles are now pinned to a
  cultural region, so no more pagoda roofs in **Denver**, oil derricks in
  **Reykjavík**, **Tromsø** or **Alice Springs**, or pyramids in **Marrakesh** and
  **Timbuktu** (the pyramids are Giza's alone now). Anywhere a region has no fitting
  vernacular, ordinary low/mid-rise fills in rather than nothing.
- **Less traffic, tiered by size.** Roughly half the previous flow: a metropolis
  runs up to 3 cars with a short gap, a city 2, a town or village 1 with a long
  quiet stretch between them. The road frames the scene instead of dominating it.
- **Mexico City** is a highland metropolis again — the Mexican volcanic belt and the
  Central American highlands resolve as green mountains, not dry savanna — and it
  gets **El Ángel de la Independencia** as its landmark.
- **Venice and Havana** read as the water cities they are (new `lagoon` landscape).

### Added
- **The 50-city reference set** (`verify/reference-cities.mjs`) — a deliberately
  diverse standing set spanning every biome, the full density range, both
  hemispheres, coastal and inland, curated and long-tail. `npm run verify:reference`
  renders the day + night contact sheets, and `tests/reference-cities.test.mjs` locks
  each city's biome, region, tier, style and landmark so no tweak can quietly change
  one. Regenerate deliberately with `npm run update:reference`.
- **Attributes info card.** Expanding any scene now shows a card listing everything
  the diorama knows — place, coordinates, local time, light, conditions, cloud, wind,
  air quality, swell/tide, sunrise/sunset, moon, biome, landscape, landmark,
  settlement size, population. The demo shows the same card for the current city, and
  `instance.attributes()` exposes the rows to any consumer.

### Changed
- Preset city chips fit on one line with no scrollbar (the list was trimmed to short
  names).

## [0.7.0] - 2026-07-22

The 1.0 runway: big cities that look big, 25,000 of them, and a package ready to publish.

### Fixed
- **No more buildings standing in the sea.** On a waterfront the near shore is a
  beach, so anything built on it now stops at the waterline; the city reads from the
  skyline across the bay instead. Fixes the long-standing Los Angeles bug where
  towers grew straight up through the ocean.
- **Big cities look big.** Settlement style now follows the density tier, so a
  metropolis builds like one whatever biome it sits in — **Taipei**, **Bangkok**,
  **Bengaluru**, **Mumbai** and **Jakarta** were rendering as villages of low houses.
  Towns and mid-size cities keep their vernacular (New Orleans still a stilt-house
  swamp, Zurich still chalets, Aspen still pastoral).
- **Monsoon Asia is green, not dry.** Peninsular India, Indochina, the Malay
  archipelago, south China and Taiwan now resolve as wet/tropical rather than
  savanna — **Bengaluru**, the Garden City, is no longer brown. Added the Thar to
  the arid set so the dry parts stay dry.
- **A hazier distant skyline.** Far towers vary in height and wash toward the sky at
  the horizon, so they read as distance instead of dark pillars planted in the scene.
- **The beachgoer sunbathes.** She now lies out on a striped towel for a good while
  before getting up and strolling on, instead of marching past without pause.

### Added
- **25,000 precomputed cities** across **202 countries** (10,000 US + 15,000
  international, disjoint by country).
- **A compact dataset format.** Columnar rows with dictionary-encoded string columns
  (`src/data/cities.js` decodes it, and is exported for consumers). 25,000 cities now
  ship in **1.4 MB — less than half** what 15,000 cities cost before.
- **🎲 Random** button on the demo — leap to any city in the set.
- **TypeScript declarations** (`src/index.d.ts`) for the whole public API, and npm
  metadata (`types`, `exports` with types, `unpkg`/`jsdelivr`, `publishConfig`). The
  published tarball is ~109 kB, 59 files, and has **zero runtime dependencies**.
- **Sponsor button** — `.github/FUNDING.yml`.

### Changed
- Preset city chips stay on one line (scroll sideways) instead of wrapping.

## [0.6.0] - 2026-07-21

Placement, direction, San Francisco, Reno — and a way to tell us.

### Fixed
- **Sprites face where they're going.** Center-anchored birds and insects (and the
  odd tropical bird) were drawn facing right no matter which way they flew — a bird
  moon-walking across the sky. Every moving sprite is now mirrored to its travel
  direction, mirrored about its own centre so it never drifts.
- **Road-edge pedestrians pass in FRONT of the sign.** A stroller on the shoulder
  used to vanish behind the temperature sign; z-order is now decided by depth (feet
  row), so a figure at the road edge walks in front and one set back walks behind.
- **No more 1px-floating props.** Many landmarks (and half the trees, and a couple
  of signs) were authored a pixel above the ground line and appeared to hover. A new
  measure (`src/catalog/measure.js`) plants every landmark, tree and sign so its
  lowest pixel lands exactly on the ground — appearance untouched, and future sprites
  auto-ground too.
- **No more mid-word city mismatches.** City lookups now match on whole words, so
  **Reno** no longer inherits g-*reno*-ble's alpine look; it's high desert.

### Added
- **The Golden Gate spans the water.** San Francisco is a peninsula, so the bridge is
  now a *distance* feature drawn across the strait between two headlands (with real
  catenary cables + hanger geometry), viewed from the beach — not a jumble of towers
  on the sand. The confusing grey skyline piers behind it are suppressed.
- **Reno gets its own casino** — the warm retro neon arch ("The Biggest Little City
  in the World"), clearly not the tall cool-purple Vegas tower.
- **A few weed-smoking strollers** (hippie, stoner, rasta) that only appear in cities
  with a famous cannabis culture (Amsterdam, Denver, Portland, …).
- **A feedback form.** GitHub issue templates to suggest a city, report a city that
  looks wrong, or file a bug — linked from the bottom of the demo page.
- **15,000 precomputed cities** (191 countries): `world.json` grows to the top 10,000
  cities outside the US. The gallery wall stays capped at the 10,000 most-populous;
  the rest are a search away.
- **Real biomes for the interior West** — a Great Basin box so Reno, Carson City and
  neighbours read as high desert.

## [0.5.0] - 2026-07-19

Real settlements, real variety, and ten thousand cities.

### Added
- **Settlement styles by biome** (**21** total). How a place is *built* is now a
  biome-appropriate architecture (`src/catalog/settlements.js`), not a generic wall of
  towers: swamps get stilt shacks, deserts low adobe, mountains chalets, jungle
  hillsides stacked favela boxes, savanna round huts, and so on — plus a wider world
  set (gulf-modern glass, medinas, nordic gables, shophouses, pagoda towns, ports,
  apartment blocks, brownstones, oil towns with a nodding pumpjack, lake lodges,
  resorts, pueblos). Each biome has several candidate styles; a city picks one
  deterministically from its seed, so cities of the same biome vary while any one
  city stays stable.
- **Coarse climate biomes for the long tail.** Uncurated cities now guess their biome
  from lon/lat boxes over the world's big arid / grassland / alpine belts (US
  Southwest desert, Great Plains, Rockies, Corn Belt, Sahara + Arabia, Andes, Pampas,
  Central Asia, the Outback…), not latitude alone — so the map isn't a monotone wall
  of "forest".
- **More life:** +13 people (**33** total — street musicians, food vendors, tourists,
  skaters, shepherds, buskers…) and +21 animals (**65** total — yak, alpaca, ostrich,
  peacock, capybara, meerkat, rhino, hippo, cheetah, panda, gorilla, plus toucan and
  parrot in the air) spanning savanna, jungle, mountain and wetland.
- **10,000 precomputed cities** (175 countries): `us.json` is now the top **5,000** US
  cities and `world.json` the top **5,000** cities outside the US — disjoint by
  country, so the total is exact. The gallery is a true 10,000-city wall.

### Changed
- **Density recalibrated.** Population drives a genuine spectrum — pastoral → rural →
  town → city → metropolis — capped per style so nature always shows between
  buildings, with a hazy distant skyline only behind genuinely large cities. Fixes
  the "big buildings everywhere" over every biome (Berkeley, Moscow, New Orleans).
- **Christ the Redeemer** redrawn to read clearly as the iconic cross-shaped Corcovado
  silhouette.

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
