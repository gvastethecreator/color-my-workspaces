import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const outputs = [
  ["media/icon.png", 128, 128],
  ["media/icon-512.png", 512, 512],
  ["media/preview.png", undefined, undefined],
  ["media/social-preview.png", 1280, 420],
];

const before = new Map();
for (const [file, width, height] of outputs) {
  const bytes = await readFile(file);
  before.set(file, digest(bytes));
  const metadata = await sharp(bytes).metadata();
  if ((width && metadata.width !== width) || (height && metadata.height !== height)) {
    throw new Error(`${file} has ${metadata.width}x${metadata.height}; expected ${width}x${height}`);
  }
  if (metadata.hasAlpha !== true) {
    throw new Error(`${file} must preserve alpha transparency`);
  }
}

const rendered = spawnSync(process.execPath, ["scripts/render-icons.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: "pipe",
});
if (rendered.status !== 0) {
  process.stderr.write(rendered.stderr);
  throw new Error("Media rendering failed");
}

for (const [file] of outputs) {
  const after = digest(await readFile(file));
  if (after !== before.get(file)) {
    throw new Error(`${file} is stale or its rendering is not deterministic`);
  }
}

console.log(`Verified ${outputs.length} deterministic media files.`);

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
