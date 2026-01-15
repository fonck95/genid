import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const PUBLIC_DIR = './public';
const OPTIMIZED_DIR = './public/optimized';

// Configuración de compresión
const CONFIG = {
  // Imágenes grandes del candidato - reducir significativamente
  large: {
    width: 800,
    quality: 75,
    patterns: ['jairo1', 'jairo2', 'jairo3']
  },
  // Imágenes medianas
  medium: {
    width: 600,
    quality: 80,
    patterns: ['caricatura', 'jairoprofile']
  },
  // Logos - mantener pequeños
  logos: {
    width: 300,
    quality: 85,
    patterns: ['logo', 'fclogo']
  }
};

async function compressImage(inputPath, outputPath, options) {
  const { width, quality } = options;

  try {
    const metadata = await sharp(inputPath).metadata();
    console.log(`  Original: ${metadata.width}x${metadata.height}`);

    await sharp(inputPath)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .png({
        quality,
        compressionLevel: 9,
        palette: false
      })
      .toFile(outputPath);

    const originalStats = await stat(inputPath);
    const compressedStats = await stat(outputPath);

    const reduction = ((1 - compressedStats.size / originalStats.size) * 100).toFixed(1);
    console.log(`  Comprimido: ${(compressedStats.size / 1024).toFixed(0)}KB (${reduction}% reducción)`);

    return { original: originalStats.size, compressed: compressedStats.size };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return null;
  }
}

function getConfigForFile(filename) {
  for (const [type, config] of Object.entries(CONFIG)) {
    if (config.patterns.some(pattern => filename.toLowerCase().includes(pattern.toLowerCase()))) {
      return { type, ...config };
    }
  }
  return { type: 'default', width: 600, quality: 80, patterns: [] };
}

async function main() {
  console.log('🖼️  Iniciando compresión de imágenes...\n');

  // Crear directorio de salida
  await mkdir(OPTIMIZED_DIR, { recursive: true });

  // Leer archivos del directorio público
  const files = await readdir(PUBLIC_DIR);
  const imageFiles = files.filter(f =>
    /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('optimized')
  );

  console.log(`Encontradas ${imageFiles.length} imágenes para procesar:\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const file of imageFiles) {
    const inputPath = join(PUBLIC_DIR, file);
    const { name, ext } = parse(file);
    const outputPath = join(OPTIMIZED_DIR, `${name}-optimized.png`);

    const config = getConfigForFile(name);
    console.log(`📷 ${file} (${config.type})`);

    const result = await compressImage(inputPath, outputPath, config);
    if (result) {
      totalOriginal += result.original;
      totalCompressed += result.compressed;
    }
    console.log('');
  }

  console.log('═'.repeat(50));
  console.log(`✅ Compresión completada!`);
  console.log(`   Total original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total comprimido: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Reducción total: ${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%`);
}

main().catch(console.error);
