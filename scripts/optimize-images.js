import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const INPUT_DIR = './public';
const OUTPUT_DIR = './public/optimized';

// Configuración de optimización
const CONFIG = {
  // Tamaño máximo para imágenes de noticias (ancho)
  maxWidth: 1200,
  // Tamaño para thumbnails
  thumbnailWidth: 400,
  // Calidad WebP
  quality: 80,
  // Calidad para thumbnails
  thumbnailQuality: 75,
};

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function optimizeImage(inputPath, filename) {
  const { name } = parse(filename);

  console.log(`Procesando: ${filename}`);

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`  Original: ${metadata.width}x${metadata.height}`);

  // Versión optimizada WebP (tamaño completo para WebGPU upscaling)
  const optimizedPath = join(OUTPUT_DIR, `${name}.webp`);
  await sharp(inputPath)
    .resize(CONFIG.maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: CONFIG.quality })
    .toFile(optimizedPath);

  const optimizedStats = await stat(optimizedPath);
  console.log(`  Optimizada: ${(optimizedStats.size / 1024).toFixed(0)}KB`);

  // Thumbnail para carga rápida inicial
  const thumbPath = join(OUTPUT_DIR, `${name}-thumb.webp`);
  await sharp(inputPath)
    .resize(CONFIG.thumbnailWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: CONFIG.thumbnailQuality })
    .toFile(thumbPath);

  const thumbStats = await stat(thumbPath);
  console.log(`  Thumbnail: ${(thumbStats.size / 1024).toFixed(0)}KB`);

  // Versión JPEG fallback
  const jpegPath = join(OUTPUT_DIR, `${name}.jpg`);
  await sharp(inputPath)
    .resize(CONFIG.maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: CONFIG.quality })
    .toFile(jpegPath);

  console.log(`  JPEG fallback creado`);

  return {
    name,
    original: filename,
    optimized: `${name}.webp`,
    thumbnail: `${name}-thumb.webp`,
    fallback: `${name}.jpg`,
  };
}

async function main() {
  console.log('=== Optimizador de Imágenes para Portal de Noticias ===\n');

  await ensureDir(OUTPUT_DIR);

  const files = await readdir(INPUT_DIR);
  const imageFiles = files.filter(f =>
    /\.(jpg|jpeg|png)$/i.test(f) && !f.includes('-thumb')
  );

  console.log(`Encontradas ${imageFiles.length} imágenes para optimizar\n`);

  const results = [];

  for (const file of imageFiles) {
    const inputPath = join(INPUT_DIR, file);
    const fileStat = await stat(inputPath);

    // Solo procesar archivos
    if (!fileStat.isFile()) continue;

    try {
      const result = await optimizeImage(inputPath, file);
      results.push(result);
      console.log('');
    } catch (err) {
      console.error(`  Error procesando ${file}:`, err.message);
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Imágenes procesadas: ${results.length}`);
  console.log('\nArchivos generados:');
  results.forEach(r => {
    console.log(`  - ${r.optimized} (+ thumbnail + fallback)`);
  });
}

main().catch(console.error);
