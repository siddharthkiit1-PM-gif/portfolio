import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "public/assets/portrait-source.jpg");
const OUT_DIR = resolve(ROOT, "public/portrait");

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("→ removing background…");
  // Wrap the file bytes in a typed Blob so the codec can sniff the MIME.
  const srcBytes = readFileSync(SRC);
  const srcBlob = new Blob([srcBytes], { type: "image/jpeg" });
  const blob = await removeBackground(srcBlob, {
    output: { format: "image/png", quality: 0.95 },
  });
  const cutoutBuf = Buffer.from(await blob.arrayBuffer());

  console.log("→ writing portrait-1024.png (RGBA cutout)");
  await sharp(cutoutBuf)
    .resize(1024, 1024, { fit: "cover", position: "top" })
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT_DIR, "portrait-1024.png"));

  console.log("→ writing portrait-mask-512.png (alpha → grayscale)");
  await sharp(cutoutBuf)
    .resize(512, 512, { fit: "cover", position: "top" })
    .ensureAlpha()
    .extractChannel("alpha")
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT_DIR, "portrait-mask-512.png"));

  console.log("✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
