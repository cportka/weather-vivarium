// gif.mjs — encode a directory of PNG frames into an animated GIF with no native
// tools (pngjs decodes, gifenc quantizes + encodes). Used by verify/preview.mjs.
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;

export function encodeGif(framesDir, outPath, opts = {}) {
  const delay = opts.delay || 83;      // ms/frame (~12fps)
  const files = fs.readdirSync(framesDir).filter(f => /^f\d+\.png$/.test(f)).sort();
  if (!files.length) throw new Error("no frames in " + framesDir);

  const frames = files.map(f => PNG.sync.read(fs.readFileSync(path.join(framesDir, f))));
  const { width, height } = frames[0];

  // Build one shared palette from a few sampled frames so animation colours
  // (lightning, neon flicker) survive quantization.
  const samples = [frames[0], frames[Math.floor(frames.length / 2)], frames[frames.length - 1]];
  const merged = new Uint8Array(samples.reduce((n, p) => n + p.data.length, 0));
  let o = 0;
  for (const p of samples) { merged.set(p.data, o); o += p.data.length; }
  const palette = quantize(merged, 256, { format: "rgb565" });

  const gif = GIFEncoder();
  for (const p of frames) {
    const index = applyPalette(p.data, palette, "rgb565");
    gif.writeFrame(index, width, height, { palette, delay, repeat: 0 });
  }
  gif.finish();
  fs.writeFileSync(outPath, Buffer.from(gif.bytes()));
  return { width, height, frames: frames.length, bytes: fs.statSync(outPath).size };
}
