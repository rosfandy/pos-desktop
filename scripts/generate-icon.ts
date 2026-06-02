import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'build-resources');

const SVG = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="215" font-family="Inter, Arial, sans-serif" font-size="180" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="middle" stroke="none">POS</text>
  <text x="256" y="330" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="500" fill="#a5b4fc" text-anchor="middle" dominant-baseline="middle" letter-spacing="8" stroke="none">KASIR</text>
</svg>`;

async function main() {
  const png512 = await sharp(Buffer.from(SVG(512)))
    .resize(512, 512)
    .png()
    .toBuffer();

  writeFileSync(join(OUT, 'icon.png'), png512);

  const sizes = [256, 64, 48, 32, 16];
  const pngBuffers = await Promise.all(
    sizes.map(s => sharp(Buffer.from(SVG(s))).resize(s, s).png().toBuffer())
  );

  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync(join(OUT, 'icon.ico'), icoBuffer);

  await sharp(png512).resize(256, 256).png().toFile(join(OUT, 'icon-256.png'));

  console.log('✅ Icons regenerated!');
  console.log(`   icon.png     ${(png512.length / 1024).toFixed(1)} KB`);
  console.log(`   icon.ico     ${(icoBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
