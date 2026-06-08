// scripts/generate-pwa-icons.mjs
// 从 public/favicon.svg 生成 PWA 应用图标
// 用法: node scripts/generate-pwa-icons.mjs
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const svgPath = resolve(projectRoot, 'public/favicon.svg');

const targets = [
  { file: 'public/pwa-192x192.png', size: 192 },
  { file: 'public/pwa-512x512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
];

// maskable: 512 画布, 内嵌 410 的源图 (保留 ~20% 安全区)
const maskableSize = 512;
const maskableInner = Math.round(maskableSize * 0.8);

async function ensureDir(file) {
  await mkdir(dirname(file), { recursive: true });
}

async function main() {
  const svg = await readFile(svgPath);

  for (const { file, size } of targets) {
    const out = resolve(projectRoot, file);
    await ensureDir(out);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`✓ ${file} (${size}x${size})`);
  }

  const maskableOut = resolve(projectRoot, 'public/pwa-maskable-512x512.png');
  await ensureDir(maskableOut);
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: await sharp(svg).resize(maskableInner, maskableInner).png().toBuffer(), gravity: 'center' }])
    .png()
    .toFile(maskableOut);
  console.log(`✓ public/pwa-maskable-512x512.png (${maskableSize}x${maskableSize}, inner ${maskableInner}px)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
