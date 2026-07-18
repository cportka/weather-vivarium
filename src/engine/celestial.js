/* =========================================================================
   celestial.js — the sun and the moon.

   The sun rides the daytime arc with a warm layered bloom that dims under
   cloud, smog and fog. The moon rides the night arc and is drawn with its real
   phase for the calendar day: a shadow bite is taken out of the correct
   (waxing/waning) side, so a crescent looks like a crescent.
   ========================================================================= */
import { clamp } from "./painter.js";

/** Draw the sun at `pos` ({x,y,low}); `env` supplies cloud/aqi/code for haze. */
export function drawSun(P, pos, env, sky) {
  var core = pos.low ? "#ffd47e" : "#fff0aa";
  var glow = pos.low ? "#ff8a3c" : "#ffcf5e";
  P.withAlpha(0.28, function () { P.disc(pos.x, pos.y, 6, glow); });
  P.withAlpha(0.55, function () { P.disc(pos.x, pos.y, 4, glow); });
  P.disc(pos.x, pos.y, 3, core);
  P.px(pos.x, pos.y, "#fffdf0");

  var dim = clamp(env.cloud / 100 * 0.5 + clamp((env.aqi - 90) / 160, 0, 0.5), 0, 0.8);
  if (env.code === 45 || env.code === 48) dim = Math.max(dim, 0.55);
  if (dim > 0) P.withAlpha(dim, function () { P.disc(pos.x, pos.y, 4, sky.top); });
}

/**
 * Draw the moon at `pos` with a phase bite. `illum` = { fraction, waxing } from
 * astronomy.moonIllumination. `sky` supplies the colour that carves the shadow.
 */
export function drawMoon(P, pos, illum, sky) {
  var r = 3;
  P.disc(pos.x, pos.y, r, "#e9e7cf");
  // craters
  P.px(pos.x - 1, pos.y - 1, "#cfcdb4");
  P.px(pos.x + 1, pos.y + 1, "#cfcdb4");

  var frac = illum ? illum.fraction : 1;
  if (frac >= 0.96) return;                    // full moon — no shadow
  // Slide a sky-coloured disc across to bite the shadow side. New moon → fully
  // covered; the offset direction encodes waxing (shadow on the left) vs waning.
  var cover = 1 - frac;                        // 0 full .. 1 new
  var dx = (illum && illum.waxing) ? -1 : 1;   // waxing: lit on the right
  var off = (r * 2) * cover;
  P.ctx.fillStyle = sky.top;
  P.ctx.beginPath();
  P.ctx.arc(pos.x + 0.5 + dx * off, pos.y + 0.5, r + 0.4, 0, 7);
  P.ctx.fill();
}
