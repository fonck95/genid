import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const INPUT_DIR = './public';
const OUTPUT_DIR = './public/optimized';

const CONFIG = {
  maxWidth: 1200,
  thumbnailWidth: 400,
  quality: 80,
  thumbnailQuality: 75,
};

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    // Directory exists
  }
}

async function optimizeImage(inputPath, filename) {
  const { name } = parse(filename);

  // Skip profile and banner - they're not news images
  if (name === 'profile' || name === 'banner') {
    console.log(`⏭️  Skipping ${filename} (not a news image)`);
    return;
  }

  const inputStats = await stat(inputPath);
  const inputSizeKB = (inputStats.size / 1024).toFixed(0);

  // Main image WebP
  const mainOutput = join(OUTPUT_DIR, `${name}.webp`);
  await sharp(inputPath)
    .resize(CONFIG.maxWidth, null, { withoutEnlargement: true })
    .webp({ quality: CONFIG.quality })
    .toFile(mainOutput);

  const mainStats = await stat(mainOutput);
  const mainSizeKB = (mainStats.size / 1024).toFixed(0);

  // Thumbnail WebP
  const thumbOutput = join(OUTPUT_DIR, `${name}-thumb.webp`);
  await sharp(inputPath)
    .resize(CONFIG.thumbnailWidth, null, { withoutEnlargement: true })
    .webp({ quality: CONFIG.thumbnailQuality })
    .toFile(thumbOutput);

  // JPEG fallback
  const jpegOutput = join(OUTPUT_DIR, `${name}.jpg`);
  await sharp(inputPath)
    .resize(CONFIG.maxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: CONFIG.quality })
    .toFile(jpegOutput);

  console.log(`✅ ${filename}: ${inputSizeKB}KB → ${mainSizeKB}KB (WebP)`);
}

async function main() {
  console.log('🖼️  Optimizando imágenes para Berraquera Santandereana...\n');

  await ensureDir(OUTPUT_DIR);

  const files = await readdir(INPUT_DIR);
  const imageFiles = files.filter(f => /\.(jpeg|jpg|png)$/i.test(f));

  console.log(`Encontradas ${imageFiles.length} imágenes\n`);

  for (const file of imageFiles) {
    const inputPath = join(INPUT_DIR, file);
    const fileStat = await stat(inputPath);

    if (fileStat.isFile()) {
      await optimizeImage(inputPath, file);
    }
  }

  console.log('\n✨ Optimización completada');
}

main().catch(console.error);
