// Builds the displacement map for a glass pane: a convex squircle bevel refracted with Snell's law.
// Red/green store the sideways shove for each pixel (128 = none); the shove is strongest at the rim
// and zero across the flat centre, like a thick piece of real glass.

const REFRACTIVE_INDEX = 1.5;

/** How much light bends at depth `t` into the bevel (0 = outer edge, 1 = where the flat top starts). */
export function bevelBend(t: number): number {
  const x = Math.min(Math.max(t, 0.02), 1);
  const slope = (1 - x) ** 3 / (1 - (1 - x) ** 4) ** 0.75;
  const incidence = Math.atan(slope);
  const refracted = Math.asin(Math.sin(incidence) / REFRACTIVE_INDEX);
  return Math.sin(incidence - refracted);
}

/** Signed distance to a rounded rectangle centred at the origin (negative inside). */
function roundedRectDistance(px: number, py: number, halfW: number, halfH: number, r: number) {
  const qx = Math.abs(px) - (halfW - r);
  const qy = Math.abs(py) - (halfH - r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Paint the map into an ImageData of the pane's size. `bezel` is the rim width in px; the normal
 * comes from the distance field's gradient, which stays smooth around the rounded corners.
 */
export function paintDisplacementMap(width: number, height: number, radius: number, bezel: number): ImageData {
  const image = new ImageData(width, height);
  const data = image.data;
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const rim = Math.max(1, Math.min(bezel, r, halfW, halfH));
  const peak = Math.max(...Array.from({ length: 50 }, (_, i) => bevelBend(i / 49)));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;
      const depth = -roundedRectDistance(px, py, halfW, halfH, r);
      const i = (y * width + x) * 4;
      let dx = 0;
      let dy = 0;
      if (depth > 0 && depth < rim) {
        // Gradient by central differences: points outward, so the rim samples the world just beyond it.
        const gx = roundedRectDistance(px + 0.5, py, halfW, halfH, r) - roundedRectDistance(px - 0.5, py, halfW, halfH, r);
        const gy = roundedRectDistance(px, py + 0.5, halfW, halfH, r) - roundedRectDistance(px, py - 0.5, halfW, halfH, r);
        const len = Math.hypot(gx, gy) || 1;
        const magnitude = bevelBend(depth / rim) / peak;
        dx = (gx / len) * magnitude;
        dy = (gy / len) * magnitude;
      }
      data[i] = Math.round(128 + dx * 127);
      data[i + 1] = Math.round(128 + dy * 127);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  return image;
}
