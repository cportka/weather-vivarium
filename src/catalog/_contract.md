# Sprite catalog contract

Every drawable in weather-vivarium is a **catalog entry** — a plain object with
metadata plus a `draw` function. The compositor picks entries appropriate to the
resolved biome/landscape and weather, then calls `draw`. All art is authored at
**50×50 logical resolution** and nearest-neighbour upscaled, so sprites are
small (most 6–18 px). The whole catalog is authored **facing right**; the
compositor mirrors an entry when it should face/travel left.

## Entry shape

```js
{
  id: "pine",                 // unique within its category, kebab-case
  name: "Pine",               // human label (a11y / demo)
  biomes: ["mountain","forest","tundra"],   // where it may appear (see biome ids)
  tags: ["tree","conifer","cold"],          // free-form, for filtering/flavour
  w: 12,                      // bounding-box width  (px, logical)
  h: 20,                      // bounding-box height (px, logical, above anchor)
  anchor: "baseline",         // "baseline" → (x, yb) is the ground-contact row;
                              // "center"   → (x, y) is the sprite centre (flyers/fish)
  rarity: 1,                  // relative spawn weight (default 1; rarer = smaller)
  draw: function (P, x, yb, env) { /* paint here */ }
}
```

## The `draw(P, x, yb, env)` function

- `P` — the **Painter** (see `src/engine/painter.js`). Use ONLY these to draw:
  - `P.px(x,y,color)` · `P.rect(x,y,w,h,color)` · `P.disc(cx,cy,r,color)` ·
    `P.line(x0,y0,x1,y1,color)` · `P.glyph(ch,x,y,color)` · `P.text(str,x,y,color)`
  - `P.withAlpha(a, fn)` for translucency · `P.mix(a,b,t)` / `P.shade(c,amt)` /
    `P.tint(c,amt)` / `P.lerp` / `P.clamp` for colour math.
  - `P.L` is the logical size (50).
- `x, yb` — the anchor. For `anchor:"baseline"`, draw **upward** from `yb`
  (feet/wheels/trunk-base rest on row `yb`; body occupies `yb-1, yb-2, …`) and
  rightward from `x` (occupy `x … x+w-1`). For `anchor:"center"`, draw around
  `(x, yb)`.
- `env` — per-frame context:
  - `env.night` (bool), `env.dayT` (0..1), `env.frame` (int, for animation),
  - `env.col(color)` — day/night dimmer; wrap **local/paint colours** in it so a
    sprite reads correctly at night (e.g. `P.rect(x,yb-4,11,4, env.col("#3f7fae"))`).
    Light sources (headlights, windows, neon, fire) should NOT be dimmed.
  - `env.rng()` → [0,1) seeded random (stable per entity) for tiny jitter,
  - `env.wind` (0..1) normalised wind for sway, `env.dir` (±1) travel direction.

## Rules

1. **Pure & synchronous.** No `fetch`, no timers, no DOM, no `import`, no global
   state, no `Math.random()` (use `env.rng`), no `while(true)`. Draw and return.
2. **Stay in the box.** Keep pixels within roughly `[x, x+w) × [yb-h, yb]`
   (baseline) so placement and the contact sheet line up.
3. **Small palette, hard edges.** A handful of colours; no anti-aliasing beyond
   what `disc` gives. Match the vintage-pixel look of the reference entries.
4. **Right-facing.** Heads/nose/headlights toward +x. The compositor flips.
5. **Readable at 100px.** Silhouette first; detail second.

See the reference entries (ported from the original LA beach widget) in each
category file for the exact idiom.
