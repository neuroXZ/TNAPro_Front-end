/**
 * Color conversion utilities
 * Converts between HEX and OKLCH color formats
 */

/**
 * Convert HEX color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

/**
 * Convert RGB to linear RGB
 */
function rgbToLinear(val: number): number {
  return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

/**
 * Convert RGB to XYZ
 */
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  const rLinear = rgbToLinear(r);
  const gLinear = rgbToLinear(g);
  const bLinear = rgbToLinear(b);

  return {
    x: rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375,
    y: rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.072175,
    z: rLinear * 0.0193339 + gLinear * 0.119192 + bLinear * 0.9503041,
  };
}

/**
 * Convert XYZ to OKLAB
 */
function xyzToOklab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  const l = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  return {
    l: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

/**
 * Convert OKLAB to OKLCH
 */
function oklabToOklch(l: number, a: number, b: number): { l: number; c: number; h: number } {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;

  return { l, c, h };
}

/**
 * Convert HEX to OKLCH
 * @param hex - HEX color string (e.g., "#3B82F6")
 * @returns OKLCH color string (e.g., "oklch(0.488 0.243 264.376)")
 */
export function hexToOklch(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "oklch(0.5 0 0)"; // Fallback to gray

  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  const oklab = xyzToOklab(xyz.x, xyz.y, xyz.z);
  const oklch = oklabToOklch(oklab.l, oklab.a, oklab.b);

  // Format to 3 decimal places
  const l = oklch.l.toFixed(3);
  const c = oklch.c.toFixed(3);
  const h = oklch.h.toFixed(3);

  return `oklch(${l} ${c} ${h})`;
}

/**
 * Convert OKLCH to HEX (approximate)
 * This is a simplified version and may not be perfectly accurate
 */
export function oklchToHex(oklchString: string): string {
  // Parse OKLCH string like "oklch(0.488 0.243 264.376)"
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) return "#808080"; // Fallback to gray

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  // Convert OKLCH to OKLAB
  const hRad = h * (Math.PI / 180);
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // Convert OKLAB to XYZ (inverse of xyzToOklab)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const x = 1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3;
  const y = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3;
  const z = -0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3;

  // Convert XYZ to RGB
  const rLinear = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const gLinear = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
  const bLinear = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  // Convert linear RGB to sRGB
  const linearToRgb = (val: number): number => {
    return val <= 0.0031308 ? val * 12.92 : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
  };

  let r = Math.round(Math.max(0, Math.min(1, linearToRgb(rLinear))) * 255);
  let g = Math.round(Math.max(0, Math.min(1, linearToRgb(gLinear))) * 255);
  let b_val = Math.round(Math.max(0, Math.min(1, linearToRgb(bLinear))) * 255);

  // Convert to HEX
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b_val.toString(16).padStart(2, '0')}`;
}
