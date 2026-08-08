# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com) and the project uses
[Semantic Versioning](https://semver.org). Every change bumps the version and adds an entry below.

## [0.16.0] - 2026-08-08

Placement measured for real, forty trees, and the grey cities get their colour.

### Fixed
- **Trees are placed by their real painted span, not their declared box.** A new
  `paintedSpan()` measure (cached, like `groundOffset()`) records each sprite's true
  horizontal extent across a full animation cycle; tree placement, sign clearance and
  the building step-around all use it. The palm's fronds reach four columns past its
  box — that overhang is why Santa Monica grew a tree in its palm and why Seattle's
  and Paris's trees hid behind signs. Every sign now blocks placement too (low ones
  included); when a scene is genuinely too full, the min-clash scan degrades to the
  least-covered spot instead of hiding a tree.
- **The distant skyline never overshoots its cap.** The old height curve could run
  25% past it, and that one un-capped slab was Chicago's "grey blob popping out the
  top". Far towers are washed firmly toward the sky, and the tall ones taper into a
  slim spire so they read as skyline, not slab.

### Added
- **Twenty new tree species** (`trees-b.js`) spread across every land biome —
  jacaranda, Monterey cypress, Joshua tree, ponderosa, dogwood, magnolia, ginkgo,
  date palm, fir, larch, Lombardy poplar, cottonwood, juniper, fig, rubber tree,
  kapok, flame tree, yucca, tulip poplar, paperbark. The catalog now carries 40
  trees; every land biome offers 7–15 species.
- **A Tree row on the info card.** The scene exposes its planted trees
  (`scene.trees()`), and `attributes()` lists their species names after Landmark.
- **Santa Monica is its own postcard.** The Pacific Wheel (ferris-wheel landmark)
  turns over the beach and the jacaranda blooms by the road; the palm and the neon
  billboard now belong to Los Angeles alone. San Francisco plants its wind-sculpted
  Monterey cypress, Seattle its Douglas fir — each via calling-card trees.

### Changed
- **The grey cities got their colour back.** Towers build in facade families (dark
  glass, steel blue, pale stone, warm concrete) with setback silhouettes,
  curtain-wall window columns by day, scattered lit offices by night, and antenna
  masts with beacons. Apartment blocks mix brick, render, slate and warm concrete
  with balcony rails; mid-rises get cornices, shaded flanks and readable window
  grids. Daylight windows always contrast with their wall — darker-grey-on-grey
  was the "drab blob" complaint.
- **Cloud Gate is a mirror, not a mound.** A true ellipse with the three mirror
  bands (sky above the waist, smeared skyline at it, warm plaza below), a
  walk-through arch between chrome feet, and lit window reflections at night.
- **The ferris wheel is steel, not mist.** Solid rim, four turning spokes, coloured
  cabins by day and the LED show at night, on an A-frame with a boarding deck.
- **Barns look like barns.** The farmstead barn and the farmland horizon barn wear
  gambrel roofs, white-trimmed X-braced sliding doors, hayloft vents and proper
  grain silos — the horizon one had been two stacked red rectangles ("unclear red
  thing", Naperville).

## [0.15.0] - 2026-08-07

Depth fixes on the coast, and three cities get their icons.

### Fixed
- **The beachgoer walks behind the palm** (Los Angeles). A set-back walker (on the
  sand, `lift > 0`) now paints before the trees as well as the sign; a road-shoulder
  walker still passes in front of both. A draw-order test drives the real compositor
  and asserts each kind on every frame.
- **The riverboat is moored in front of the shore trees** (New Orleans). Landmarks
  can declare `front: true` to paint after the trees — a boat at the bank is nearer
  than the bank's own trees.
- **No kangaroos in Los Angeles.** Ground animals can be region-locked as well as
  biome-locked: kangaroo and koala are gated to Oceania, so Australian beach roos
  stay Australian. LA's beach fauna gains the raccoon instead — city-funny, and
  entirely real.
- **Crowded scenes pack their trees instead of hiding one** (Queenstown). When every
  slot overlaps something, the placer now scans the whole canvas for the
  least-overlapping column (nearest the intended slot on ties) rather than giving up
  after ten steps — two wide trees and a tall sign all read fully.

### Added
- **Cloud Gate for Chicago** — the Bean: polished chrome with a bright sky band, a
  smeared horizon, a specular gleam, and the gate's shadowed arch on its plaza.
- **Torrance High School** — the Renaissance Revival original: central pediment
  pavilion with the arched entry, red-tile rooflines, arcaded wings of tall windows
  in cream stucco, clipped hedges out front, and the pine alongside by calling card.
  Landmark city lists now accept the same admin-scoped entries as landscapes, so
  Torrance, Scotland keeps its own identity.

## [0.14.0] - 2026-08-07

The variety sweep: thin biomes filled in, and the whole database learns what a
suburb is.

### Added
- **Metro-aware density, baked into the dataset.** City-limits population lies about
  suburbs — Naperville's 147k next to Chicago's 2.7M rendered as a mid-size town in a
  cornfield. At build time every city now consults its neighbourhood: a bigger core
  within its commuter belt (tiered reach — a 2M+ metro pulls from 50 km, a 100k town
  from 20) lifts the suburb to ~60% of the core's density. **12,962 cities** across
  the two datasets carry the lifted value in a new packed `density` column; the
  gallery, demo wall, reference sheet and CI replay all render with it. Noise lifts
  (below village grade, or under +0.03) aren't stored, so the files barely grow, and
  curated landscape floors (the South Bay) still win where they say more. Cores and
  standalone towns are untouched — Chicago is its own metro, Iowa City has no bigger
  neighbour. Tests pin Naperville risen, Chicago unmoved, and the reference row's
  hand-set value equal to the dataset's.
- **Tiki board** — a thatched beach-bar sign for jungle, coast and lake: bamboo
  posts, palm-frond roof, driftwood plank, and a pair of tiki torches that flicker
  alight after dark. Amazon river ports (Iquitos, Manaus) lead with it by calling
  card — and send the capybara out first.
- **Naperville, IL and Iquitos, Peru join the reference set** — now 54. One shows a
  commuter suburb rendered as what it is; the other shows the filled-out jungle.

### Changed
- **No biome is threadbare any more.** Sign, tree, bird, animal and stroller biome
  lists widened where ecology allows: jungle went from **one** sign for 6,782 cities
  to five (even 20% spread, measured across the database); forest (25,351 cities)
  from three to four; lake from one to six. Canyon — one tree, zero ground animals —
  now has pinyon pine, aspen and deadwood, bighorn goats, jackrabbits and snakes.
  Lakeshores get deer, foxes, birch and oak; alpine meadows and savanna get their
  butterflies and bees; city nights get bats; the passer-by strolls every biome. The
  full-database replay and a distribution tally confirm every biome now draws from
  ≥4 signs with no degenerate favourite.

## [0.13.0] - 2026-08-06

Layering and signature fixes across the LA basin, and the wall grows to 44,444.

### Fixed
- **Ground animals cross behind the trees** (San Francisco). They were painted after
  the landmark and trees, so a passing dog slid over the palm trunk; they now amble
  across the back of the scene, behind landmark and trees, still in front of nothing
  they shouldn't be.
- **The tree steps clear of the temperature sign** (Oakland). Tall signs now count in
  the tree-slot scoring, and a tree whose best slot still overlaps walks outward —
  left first — to the nearest clash-free column, so landmark, tree and sign all read
  fully. Knee-high markers (milestone, sandwich board) deliberately don't block: a
  canopy above a low marker reads fine, and in a crowded scene it's the only way
  everything fits.
- **Vegas's welcome-sign pairing had silently never worked** — `pairedSign` was read
  off the `{entry, x}` wrapper instead of the entry, so the casino's paired sign
  never matched and Vegas only got it because the weighted draw favours it. Now
  guaranteed, with a regression test.
- **A `carson`-style bare name can no longer hijack other states' cities.** Landscape
  city lists accept admin-scoped entries (`{ name: "carson", admin: ["ca",
  "california"] }`), so the new South Bay preset claims Carson, California without
  turning Carson City, Nevada's Great Basin desert — or a 2,000-person Carson,
  Washington — into LA suburbs. Caught by review before it shipped; the datasets are
  built from the scoped lists.
- **One density formula.** Population → urbanisation was hand-copied in six places
  and they had already drifted; `sceneDensity()` in resolve.js is now the single
  source, used by the widget, the verify harness, the dataset replay, the snapshot
  resolver and the tests.

### Added
- **Los Angeles leads with its own sign.** Calling cards gained a `sign` slot, and LA
  pins the neon billboard — the board ported from the original widget: cream with a
  sun motif and coral digits by day, noir purple under hot-magenta neon with cyan
  digits at night — instead of a random coast draw.
- **Lomita has its library.** A new landmark modeled on the City of Lomita Public
  Library — cream stone, tall dark glass bays between white pilasters, the flat
  white fascia, entrance canopy, lawn and flower bed — with a big pine alongside via
  a calling-card tree, and a couple of panes left warmly lit after dark.
- **The South Bay renders as what it is.** Curated landscapes can assert a `density`
  floor: Lomita, Torrance, Gardena, Carson, Lawndale and Hawthorne (California) now
  read as the wall-to-wall leafy suburb they are — paved road, tract houses — instead
  of woodland hamlets, whatever their municipal populations say.
- **44,444 cities** (16,444 US — the whole GeoNames pop-1000+ US list barring a few
  hundred — + 28,000 world). The full-database replay covers every one in ~3s.

## [0.12.0] - 2026-08-06

Three bugs with one thing in common: nothing threw, nothing logged, the scene just
quietly stopped being right.

### Fixed
- **The day/night and live toggles work again.** The widget claimed `timezone: "UTC"`
  for any place given as bare coordinates, so Open-Meteo returned Los Angeles's
  sunrise and sunset as UTC wall-clock times — 13:05 and 02:55. Sunset landed
  *before* sunrise and `dayFactor` answered 0 for every minute of the day: the scene
  was permanently night and neither toggle could move it. The zone is now resolved
  from the coordinates and adopted from the response, `dayFactor` reads a lit stretch
  that wraps past midnight as an interval on a circle (which is also polar summer),
  and `localTime` falls back to the viewer's clock rather than UTC.
- **A city looks like itself again.** Everything fixed about a scene was seeded from
  `name + latitude`, so the same city seeded differently depending on which code path
  supplied its coordinates — the packed dataset (34.052), the reference list (34.05),
  the browser's geolocation (34.0522…) — and Los Angeles grew a different tree on
  each. The seed now keys on the place's identity.
- **Ground animals stand on the ground.** They were planted a row above the line the
  trees, sign, landmark and strolling figure all use, so every animal hovered — two
  rows for the deer and the elephant. `groundOffset` also samples a walk cycle now
  instead of one frame, so a lifted hoof no longer drives the planted one underground.
- **A wide sign no longer runs off the canvas.** The 22px mural wall was placed at the
  same hard-coded column as every other sign and lost its last pixel.
- **The stub Painter's bounds were a pixel too generous** — a `w × h` rect covers rows
  `y..y+h-1`, not `y+h` — which made every rect-drawn sprite measure a row taller than
  it is. Nothing in the catalog actually breaks its baseline; the ruler was wrong.

### Added
- **33,333 cities** (13,333 US + 20,000 world), and **Lomita, CA** joins the reference
  set — now 52.
- **`npm run verify:replay`** builds every city in the database and checks what got
  placed: a tree wherever one is due, the calling card's tree when a city names one,
  and nothing off the canvas. It runs in the test suite on every push and found two
  real bugs the moment it was switched on. Deliberately cheap — no canvas, no images,
  nothing written to disk: **~4s and ~170 MB for all 33,333**, scaling linearly, so
  growing the database stays affordable.
- **`npm run verify:controls`** drives the real `verify.html` in a browser with
  Open-Meteo stubbed and asserts that pressing day/night actually changes what you
  see. The unit suite can prove `dayFactor` is right; only this catches a page that
  has quietly stopped responding.

### Changed
- **The Statue of Liberty redrawn.** She was a two-pixel-wide column of one green on a
  pedestal that ate two thirds of her height — a grey-green blob on the New York
  skyline. Now a short granite plinth under a tall figure: modelled copper with the
  folds running down the robe, four-wide shoulders pinching to a head under a spiked
  crown, the tablet in the crook of one arm and the torch raised clear on the other,
  gilded and floodlit after dark.
- The snapshot test and its updater now share one resolver with the widget, so the
  locked expectations can't drift from the scene anyone actually renders.

## [0.11.0] - 2026-08-06

The beach at both ends of the day, and two landmarks redrawn.

### Fixed
- **The beachgoer keeps to daylight.** Nobody sunbathes in the dark: figures marked
  `daylight` are only cast while the sun is up. After sunset the Los Angeles beach
  belongs to a tabby cat instead — the night half of the original LA widget, restored.
- **She sunbathes where you can see her.** The towel now goes down well clear of the
  temperature sign instead of sometimes landing behind it, and she strolls two pixels
  up on the sand rather than on the kerb — the depth the original drew her at, which
  also puts her behind the sign the way the original did.
- **A calling card is no longer spent on a cast that never happened.** A card the
  current pool can't honour (LA's beachgoer while it's still dark) stays pending for
  the next spawn instead of being silently burnt.
- **The verify harness was building a world the widget never builds** — it left out
  `region` and `callingCard`, so every reference render since 0.9.0 was missing its
  calling card and its regional settlement style. It now mirrors `buildWorld()`
  field for field.

### Added
- **Beach cat** — pads down the sand after dark, tail up, hunched and quick when the
  weather turns. Cast through a new `nightPerson` calling-card slot.
- **The full sunbathe, ported from the original.** She folds down through two
  in-between poses (crouch → propped) onto a nine-wide striped towel, holds the
  reclining pose with one knee rocking, then rises back up the same way — instead of
  snapping flat and snapping upright.
- **`tests/walker.test.mjs`** drives the real compositor over hundreds of frames with
  a stub Painter and asserts what actually got painted: the right cast for the hour,
  the full fold-down sequence, and a towel that always clears the sign. Placement bugs
  here are silent no-ops — a scene that renders fine, just missing someone — so they
  need a test that looks at the output, not at the code.

### Changed
- **Diamond Head redrawn.** It was a lumpy green mound; Lēʻahi is a dry leeward tuff
  cone. Gold-brown slopes with green only in the ravines and along the foot, a broad
  crater rim with the saddle between its two rises, a shaded seaward face, and the
  lighthouse standing clear on the low point.
- **The Eiffel Tower redrawn.** The old profile collapsed to a bare one-pixel pole for
  its whole upper half. The silhouette is now written out row by row — splayed legs
  with open sky and the great arch between them, the first deck, the braced shaft, the
  second deck, the long taper, top platform and spire — warm iron by day, gilded with
  a floodlit glow and a champagne sparkle at night.

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
