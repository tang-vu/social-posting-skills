// Media manifest — tracks every asset used by a campaign with provenance,
// dimensions and bounds validation. No arbitrary file is ever auto-attached;
// assets enter only via explicit `campaign assets add`.

import { statSync, existsSync, readFileSync, openSync, readSync, closeSync } from "node:fs";
import path from "node:path";
import { sha256 } from "./util.js";

const IMAGE_READERS = {
  ".png": readPngSize,
  ".jpg": readJpegSize,
  ".jpeg": readJpegSize,
  ".gif": readGifSize,
  ".webp": readWebpSize,
};

export const MAX_ASSET_BYTES = 50 * 1024 * 1024; // hard ceiling before per-platform checks

export function assetId(filePath) {
  return "asset-" + sha256(path.basename(filePath)).slice(0, 10);
}

// Build a manifest entry for a file on disk. Dimensions are read for
// png/jpeg/gif/webp without external dependencies.
export function buildAssetEntry(filePath, { altText = null, provenance = "user-supplied" } = {}) {
  const abs = path.resolve(filePath);
  if (!existsSync(abs)) throw new Error(`Media file not found: ${filePath}`);
  const st = statSync(abs);
  if (!st.isFile()) throw new Error(`Not a file: ${filePath}`);
  if (st.size > MAX_ASSET_BYTES) {
    throw new Error(`File exceeds hard media ceiling (${MAX_ASSET_BYTES} bytes): ${filePath}`);
  }
  const ext = path.extname(abs).toLowerCase();
  const buf = readFileSync(abs);
  const entry = {
    id: assetId(abs),
    path: abs,
    fileName: path.basename(abs),
    ext: ext.replace(".", ""),
    bytes: st.size,
    sha256: sha256(buf),
    altText: altText ?? null,
    provenance,
    addedAt: new Date().toISOString(),
  };
  const reader = IMAGE_READERS[ext];
  if (reader) {
    const size = reader(buf);
    if (size) {
      entry.width = size.width;
      entry.height = size.height;
      entry.aspect = +(size.width / size.height).toFixed(4);
    }
  }
  return entry;
}

function readPngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readGifSize(buf) {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function readJpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let off = 2;
  while (off + 9 < buf.length) {
    if (buf[off] !== 0xff) { off++; continue; }
    const marker = buf[off + 1];
    // SOF0-SOF15 except DHT/DAC/JPG/RST carry dimensions
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
    }
    const segLen = buf.readUInt16BE(off + 2);
    off += 2 + segLen;
  }
  return null;
}

function readWebpSize(buf) {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const fmt = buf.toString("ascii", 12, 16);
  if (fmt === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fmt === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (fmt === "VP8X") {
    return {
      width: (buf.readUIntLE(24, 3) + 1),
      height: (buf.readUIntLE(27, 3) + 1),
    };
  }
  return null;
}

// Validate a set of assets against a platform's media constraints.
export function validateMedia(assets, platform) {
  const errors = [];
  const warnings = [];
  const m = platform.media ?? {};
  const images = assets.filter((a) => ["png", "jpg", "jpeg", "gif", "webp"].includes(a.ext));

  if (m.supported === false && images.length > 0) {
    errors.push(`${platform.displayName}: does not support inline media`);
  }
  if (m.maxImages != null && images.length > m.maxImages) {
    errors.push(`${platform.displayName}: ${images.length} images exceeds max ${m.maxImages}`);
  }
  for (const a of images) {
    if (m.maxImageMB != null && a.bytes > m.maxImageMB * 1024 * 1024) {
      errors.push(`${platform.displayName}: ${a.fileName} is ${(a.bytes / 1048576).toFixed(1)}MB, over ${m.maxImageMB}MB`);
    }
    if (m.formats?.length && !m.formats.includes(a.ext)) {
      errors.push(`${platform.displayName}: ${a.fileName} format .${a.ext} not in [${m.formats.join(", ")}]`);
    }
    if (m.altText && !a.altText) {
      warnings.push(`${platform.displayName}: ${a.fileName} has no alt text (accessibility)`);
    }
    if (m.imageSize && a.width && a.height) {
      const [w, h] = m.imageSize;
      const want = w / h;
      if (Math.abs(a.aspect - want) > 0.4) {
        warnings.push(
          `${platform.displayName}: ${a.fileName} is ${a.width}x${a.height}, recommended ${w}x${h} — may be cropped`
        );
      }
    }
  }
  return { errors, warnings };
}

// Non-authoritative secret sniff for asset file names — keeps obvious
// mistakes out of campaigns. Content scanning stays out of scope.
const SENSITIVE_NAME = /(\.env|secret|credential|private.?key|id_rsa|\.pem$|\.key$|\.p12$|\.pfx$|token|cookie|keystore)/i;

export function assertAssetNameSafe(filePath) {
  if (SENSITIVE_NAME.test(path.basename(filePath))) {
    throw new Error(`Refusing to add asset with sensitive-looking name: ${path.basename(filePath)}`);
  }
}

// Peek-only file signature check used by doctor to warn on suspicious assets.
export function looksLikePemOrKey(filePath) {
  const fd = openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(64);
    readSync(fd, buf, 0, 64, 0);
    return buf.toString("latin1").includes("-----BEGIN");
  } finally {
    closeSync(fd);
  }
}
