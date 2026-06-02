import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'build-resources');

// ── Icon SVG ────────────────────────────────────────────────────────────────
// Modern POS icon: indigo rounded square with white storefront

const SVG = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(96, 96)" fill="none" stroke="#fff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
    <!-- Roof -->
    <path d="M40 160 L160 48 L280 160"/>
    <!-- Storefront body -->
    <rect x="40" y="160" width="240" height="160" rx="8" stroke-width="20"/>
    <!-- Door -->
    <rect x="130" y="220" width="60" height="100" rx="4" stroke-width="12"/>
    <!-- Awning -->
    <rect x="40" y="120" width="240" height="48" rx="4" fill="#fff" opacity="0.9" stroke="none"/>
    <!-- Awning lines -->
    <line x1="80" y1="120" x2="80" y2="168" stroke-width="4" stroke="#6366f1" opacity="0.4"/>
    <line x1="160" y1="120" x2="160" y2="168" stroke-width="4" stroke="#6366f1" opacity="0.4"/>
    <line x1="240" y1="120" x2="240" y2="168" stroke-width="4" stroke="#6366f1" opacity="0.4"/>
    <!-- Window left -->
    <rect x="56" y="184" width="56" height="48" rx="4" stroke-width="10"/>
    <line x1="84" y1="184" x2="84" y2="232" stroke-width="6"/>
    <!-- Window right -->
    <rect x="208" y="184" width="56" height="48" rx="4" stroke-width="10"/>
    <line x1="236" y1="184" x2="236" y2="232" stroke-width="6"/>
    <!-- Door handle -->
    <circle cx="178" cy="270" r="6" fill="#fff" stroke="none"/>
  </g>
</svg>`;

async function main() {
  // 1. Generate PNG 512×512
  const png512 = await sharp(Buffer.from(SVG(512)))
    .resize(512, 512)
    .png()
    .toBuffer();

  writeFileSync(join(OUT, 'icon.png'), png512);

  // 2. Generate ICO from multiple sizes (256, 48, 32, 16)
  const sizes = [256, 48, 32, 16];
  const pngBuffers = await Promise.all(
    sizes.map(s => sharp(Buffer.from(SVG(s))).resize(s, s).png().toBuffer())
  );

  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync(join(OUT, 'icon.ico'), icoBuffer);

  // 3. Generate smaller PNGs for other uses
  await sharp(png512).resize(256, 256).png().toFile(join(OUT, 'icon-256.png'));

  console.log('✅ Icons generated successfully!');
  console.log(`   📄 icon.png     ${(png512.length / 1024).toFixed(1)} KB`);
  console.log(`   📄 icon.ico     ${(icoBuffer.length / 1024).toFixed(1)} KB (${sizes.join(', ')}px)`);
}

main().catch(console.error);
