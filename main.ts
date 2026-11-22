// entry validator + copier for news-image-20261122.
//
// Reads the entry image that sits next to this file, checks that it is a
// whole JPEG or PNG of exactly 1024x1024 and no more than 1 MiB, copies the
// verified bytes to $MAKEFUN_OUTPUT_DIR/entry.png, then reads the copy back
// and refuses to exit cleanly unless its length and sha256 match the
// source exactly. Any failed check exits non-zero with the reason on
// stderr. Node 22, standard library only.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;
const MAX_BYTES = 1024 * 1024;
const ENTRY_NAME = "entry.png";

const JPEG_SOI = 0xd8;
const JPEG_EOI = 0xd9;
const JPEG_SOS = 0xda;
const JPEG_DQT = 0xdb;
const JPEG_DHT = 0xc4;
const JPEG_SOF_KINDS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  throw new Error(`entry check failed: ${message}`);
}

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Walk a JPEG's marker segments once and return the frame size plus the
// set of marker codes seen. Standalone markers (0x01, 0xd0-0xd9) carry no
// length field; every other marker is followed by a 2-byte big-endian
// length that includes the length bytes themselves.
function inspectJpeg(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== JPEG_SOI) fail("missing JPEG SOI marker");
  if (bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== JPEG_EOI) {
    fail("missing JPEG EOI marker");
  }
  const seen = new Set();
  let frame = null;
  let pos = 2;
  while (pos + 1 < bytes.length) {
    if (bytes[pos] !== 0xff) fail(`expected marker prefix at offset ${pos}`);
    let code = bytes[pos + 1];
    while (code === 0xff) { // padding bytes before the real code
      pos += 1;
      if (pos + 1 >= bytes.length) fail("truncated marker prefix");
      code = bytes[pos + 1];
    }
    seen.add(code);
    pos += 2;
    if (code === JPEG_EOI || code === JPEG_SOS) break;
    if (code === 0x01 || (code >= 0xd0 && code <= JPEG_EOI)) continue;
    if (pos + 2 > bytes.length) fail("truncated marker length");
    const segmentLength = bytes.readUInt16BE(pos);
    if (segmentLength < 2 || pos + segmentLength > bytes.length) {
      fail(`marker 0x${code.toString(16)} overruns the file`);
    }
    if (JPEG_SOF_KINDS.has(code)) {
      if (segmentLength < 8) fail("short SOF segment");
      const precision = bytes[pos + 2];
      const height = bytes.readUInt16BE(pos + 3);
      const width = bytes.readUInt16BE(pos + 5);
      const components = bytes[pos + 7];
      if (precision !== 8) fail(`unsupported sample precision ${precision}`);
      if (components < 1 || components > 4) fail(`bad component count ${components}`);
      frame = { width, height };
    }
    pos += segmentLength;
  }
  if (!frame) fail("no JPEG frame (SOF) segment found");
  if (!seen.has(JPEG_DQT)) fail("no JPEG quantization table (DQT)");
  if (!seen.has(JPEG_DHT)) fail("no JPEG Huffman table (DHT)");
  if (!seen.has(JPEG_SOS)) fail("no JPEG scan (SOS)");
  return frame;
}

function inspectPng(bytes) {
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) fail("not a JPEG or PNG file");
  if (bytes.length < 33) fail("truncated PNG header");
  if (bytes.toString("ascii", 12, 16) !== "IHDR") fail("PNG missing IHDR chunk");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  if (bitDepth !== 8 && bitDepth !== 16) fail(`unsupported PNG bit depth ${bitDepth}`);
  if (![0, 2, 3, 4, 6].includes(colorType)) fail(`unsupported PNG color type ${colorType}`);
  return { width, height };
}

function inspectImage(bytes) {
  if (bytes.length === 0) fail("empty entry file");
  if (bytes.length > MAX_BYTES) fail(`${bytes.length} bytes exceeds the 1 MiB limit`);
  const isJpeg = bytes[0] === 0xff && bytes[1] === JPEG_SOI;
  const frame = isJpeg ? inspectJpeg(bytes) : inspectPng(bytes);
  if (frame.width !== EXPECTED_WIDTH || frame.height !== EXPECTED_HEIGHT) {
    fail(`dimensions ${frame.width}x${frame.height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`);
  }
  return isJpeg ? "JPEG" : "PNG";
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const sourcePath = join(here, ENTRY_NAME);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (!outDir) fail("MAKEFUN_OUTPUT_DIR is not set");
  const bytes = await readFile(sourcePath).catch((error) => {
    // fail() throws, so this callback never returns a value.
    fail(`cannot read ${ENTRY_NAME} next to main.ts (${error.code ?? error.message})`);
  });
  const kind = inspectImage(bytes);
  const digest = sha256Hex(bytes);
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, ENTRY_NAME);
  await writeFile(outPath, bytes);
  const written = await readFile(outPath);
  if (written.length !== bytes.length) {
    fail(`output length ${written.length} != source length ${bytes.length}`);
  }
  if (sha256Hex(written) !== digest) fail("output sha256 does not match the source");
  console.log(`wrote ${kind} ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT} ${bytes.length} bytes ` +
    `sha256=${digest} to ${outPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
