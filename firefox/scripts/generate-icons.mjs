#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// generate-icons.mjs — writes assets/icon-48.png and assets/icon-96.png.
//
// Spec §1.6 (spec-pinned): a solid #272822 rounded square with an #a6e22e
// "U" glyph. PNG encoding is hand-rolled on top of node's built-in zlib
// (deflate) plus a CRC32 table — zero dependencies, deterministic output, so
// the committed icons are regenerable byte-for-byte.
//
// Rasterization uses 4x4 supersampling for smooth edges: every pixel takes
// 16 fixed subpixel samples; coverage >= 1 sample contributes alpha by count.
// All geometry is expressed as a fraction of icon size, so 48 and 96 share
// one design.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(SCRIPT_DIR, '..', 'assets');

// --- palette (Monokai, design §7) ------------------------------------------
const BG = [0x27, 0x28, 0x22, 0xff]; // page-background default
const FG = [0xa6, 0xe2, 0x2e, 0xff]; // interactive default (link green)

// --- geometry, as fractions of size S --------------------------------------
const CORNER_R = 0.2;   // rounded-square corner radius
const GLYPH_W = 0.5;    // "U" bounding box width
const GLYPH_H = 0.56;   // "U" bounding box height
const STROKE = 0.15;    // stroke thickness (both verticals and the bottom)

// --- rasterizer (supersampled, deterministic) ------------------------------
const SS = 4; // supersample factor per axis

function insideRoundedRect(px, py, size) {
  const r = CORNER_R * size;
  // distance to the nearest corner center when in a corner region
  const cx = px < r ? r : px > size - r ? size - r : px;
  const cy = py < r ? r : py > size - r ? size - r : py;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// "U": two vertical bars + a bottom bar whose outer and inner corners are
// rounded, so the counters read as a bowl rather than a box.
function insideGlyph(px, py, size) {
  const gw = GLYPH_W * size;
  const gh = GLYPH_H * size;
  const t = STROKE * size;
  const x0 = (size - gw) / 2;
  const y0 = (size - gh) / 2;
  const x1 = x0 + gw;
  const y1 = y0 + gh;

  // vertical bars
  if (px >= x0 && px <= x0 + t && py >= y0 && py <= y1 - t) return true;
  if (px >= x1 - t && px <= x1 && py >= y0 && py <= y1 - t) return true;

  // bottom bar: x within [x0, x1], y within [y1 - t, y1]
  if (px >= x0 && px <= x1 && py >= y1 - t && py <= y1) {
    // outer bottom corners (radius t): the bar's outside corners are round
    if (px < x0 + t && py > y1 - t) {
      const dx = x0 + t - px;
      const dy = py - (y1 - t);
      if (dx * dx + dy * dy > t * t) return false;
    }
    if (px > x1 - t && py > y1 - t) {
      const dx = px - (x1 - t);
      const dy = py - (y1 - t);
      if (dx * dx + dy * dy > t * t) return false;
    }
    return true;
  }
  return false;
}

function rasterize(size) {
  const buf = Buffer.alloc(size * size * 4);
  const step = 1 / (SS * SS);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (!insideRoundedRect(px, py, size)) continue;
          if (insideGlyph(px, py, size)) fg++;
          else bg++;
        }
      }
      const i = (y * size + x) * 4;
      // composite glyph over background over transparent, straight alpha
      const aFg = fg * step;
      const aBg = bg * step;
      const a = aFg + aBg;
      if (a === 0) continue; // transparent corner — buffer already zeroed
      buf[i] = Math.round((FG[0] * aFg + BG[0] * aBg) / a);
      buf[i + 1] = Math.round((FG[1] * aFg + BG[1] * aBg) / a);
      buf[i + 2] = Math.round((FG[2] * aFg + BG[2] * aBg) / a);
      buf[i + 3] = Math.round(a * 255);
    }
  }
  return buf;
}

// --- PNG encoder (RGBA8, filter type 0 per scanline) -----------------------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(out.subarray(4, 8 + data.length));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- entry -----------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
for (const size of [48, 96]) {
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, encodePng(size, rasterize(size)));
  console.log(`wrote ${file}`);
}
