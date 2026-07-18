/* styles.js — the minimal CSS the widget needs, injected once. Class names are
   prefixed `wv-` so a host page can drop the widget in without collisions. */

export var CSS = "" +
  ".wv{position:relative;width:var(--wv-size,100px);height:var(--wv-size,100px);" +
  "border-radius:calc(var(--wv-size,100px)/12);overflow:hidden;display:inline-block;" +
  "box-shadow:0 6px 22px rgba(23,21,15,.22),inset 0 0 0 1px rgba(255,255,255,.10);" +
  "opacity:0;transform:translateY(4px);transition:opacity .6s ease,transform .6s ease}" +
  ".wv.is-ready{opacity:1;transform:none}" +
  ".wv__cv{width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges}" +
  ".wv.is-interactive{cursor:pointer}" +
  ".wv.is-interactive:focus-visible{outline:2px solid #4a9eff;outline-offset:3px}" +
  ".wv.is-expanded{position:fixed;top:50%;left:50%;width:var(--wv-exp,400px);height:var(--wv-exp,400px);" +
  "margin:calc(-1*var(--wv-exp,400px)/2) 0 0 calc(-1*var(--wv-exp,400px)/2);" +
  "border-radius:calc(var(--wv-exp,400px)/12);z-index:9991;" +
  "box-shadow:0 18px 60px rgba(23,21,15,.35),inset 0 0 0 1px rgba(255,255,255,.10)}" +
  ".wv-backdrop{position:fixed;inset:0;background:rgba(10,10,14,.72);opacity:0;z-index:9990;" +
  "pointer-events:none;transition:opacity .35s ease}" +
  ".wv-backdrop.is-on{opacity:1;pointer-events:auto;cursor:pointer}" +
  "html.wv-lock{overflow:hidden}" +
  "@media (prefers-reduced-motion: reduce){.wv{transition:none;opacity:1;transform:none}.wv-backdrop{transition:none}}";

var injected = false;
export function injectStyles(doc) {
  doc = doc || (typeof document !== "undefined" ? document : null);
  if (!doc || injected || doc.getElementById("wv-styles")) { injected = true; return; }
  var s = doc.createElement("style");
  s.id = "wv-styles";
  s.textContent = CSS;
  (doc.head || doc.documentElement).appendChild(s);
  injected = true;
}
