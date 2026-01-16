import sharp from 'sharp';
import { readdir, mkdir, stat, copyFile, unlink, rename } from 'fs/promises';
import { join, parse } from 'path';
import { existsSync } from 'fs';

const PUBLIC_DIR = './public';
const BACKUP_DIR = './public/backup-original';

// Configuracion de compresion optimizada para WebGPU upscaling
const CONFIG = {
  // Imagenes grandes del candidato - comprimir agresivamente
  // WebGPU las escalara de nuevo en el navegador
  large: {
    width: 600,      // Reducido para carga rapida, WebGPU escalara a 2-2.5x
    quality: 80,
    webpQuality: 75,
    patterns: ['jairo1', 'jairo2', 'jairo3']
  },
  // Imagenes medianas
  medium: {
    width: 400,
    quality: 80,
    webpQuality: 75,
    patterns: ['caricatura', 'jairoprofile']
  },
  // Logos - mantener nitidos
  logos: {
    width: 200,
    quality: 90,
    webpQuality: 85,
    patterns: ['logo', 'fclogo', 'logomarca']
  }
};

async function getImageStats(path) {
  try {
    const stats = await stat(path);
    return stats.size;
  } catch {
    return 0;
  }
}

async function compressToWebP(inputPath, outputPath, options) {
  const { width, webpQuality } = options;

  const metadata = await sharp(inputPath).metadata();

  await sharp(inputPath)
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
      kernel: 'lanczos3'  // Alta calidad para que WebGPU tenga buena base
    })
    .webp({
      quality: webpQuality,
      effort: 6,  // Maximo esfuerzo de compresion
      smartSubsample: true
    })
    .toFile(outputPath);

  return {
    originalWidth: metadata.width,
    originalHeight: metadata.height
  };
}

async function compressToPNG(inputPath, outputPath, options) {
  const { width, quality } = options;

  await sharp(inputPath)
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
      kernel: 'lanczos3'
    })
    .png({
      quality,
      compressionLevel: 9,
      palette: false,
      effort: 10
    })
    .toFile(outputPath);
}

async function compressToJPG(inputPath, outputPath, options) {
  const { width, quality } = options;

  await sharp(inputPath)
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
      kernel: 'lanczos3'
    })
    .jpeg({
      quality,
      mozjpeg: true  // Usa mozjpeg para mejor compresion
    })
    .toFile(outputPath);
}

function getConfigForFile(filename) {
  for (const [type, config] of Object.entries(CONFIG)) {
    if (config.patterns.some(pattern => filename.toLowerCase().includes(pattern.toLowerCase()))) {
      return { type, ...config };
    }
  }
  return { type: 'default', width: 400, quality: 80, webpQuality: 75, patterns: [] };
}

async function main() {
  console.log('='.repeat(60));
  console.log('  OPTIMIZACION DE IMAGENES PARA WEBGPU');
  console.log('  Compresion + Escalado con WebGPU en navegador');
  console.log('='.repeat(60));
  console.log('');

  // Crear directorio de backup
  await mkdir(BACKUP_DIR, { recursive: true });

  // Leer archivos del directorio publico
  const files = await readdir(PUBLIC_DIR);
  const imageFiles = files.filter(f =>
    /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('backup') && !f.includes('optimized')
  );

  console.log(`Encontradas ${imageFiles.length} imagenes para procesar:\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  const results = [];

  for (const file of imageFiles) {
    const inputPath = join(PUBLIC_DIR, file);
    const { name, ext } = parse(file);
    const config = getConfigForFile(name);

    console.log(`\n[${config.type.toUpperCase()}] ${file}`);
    console.log('-'.repeat(50));

    const originalSize = await getImageStats(inputPath);
    totalOriginal += originalSize;
    console.log(`  Original: ${(originalSize / 1024).toFixed(0)} KB`);

    // Backup del original
    const backupPath = join(BACKUP_DIR, file);
    if (!existsSync(backupPath)) {
      await copyFile(inputPath, backupPath);
      console.log(`  Backup creado`);
    }

    // Generar WebP
    const webpPath = join(PUBLIC_DIR, `${name}.webp`);
    const tempPngPath = join(PUBLIC_DIR, `${name}-temp${ext}`);

    try {
      // Comprimir a WebP (formato principal)
      const metadata = await compressToWebP(inputPath, webpPath, config);
      const webpSize = await getImageStats(webpPath);
      console.log(`  WebP: ${(webpSize / 1024).toFixed(0)} KB (${((1 - webpSize / originalSize) * 100).toFixed(0)}% reduccion)`);

      // Comprimir formato original como fallback
      if (ext.toLowerCase() === '.png') {
        await compressToPNG(inputPath, tempPngPath, config);
      } else {
        await compressToJPG(inputPath, tempPngPath, config);
      }

      // Reemplazar original con version comprimida
      await unlink(inputPath);
      await rename(tempPngPath, inputPath);

      const compressedSize = await getImageStats(inputPath);
      console.log(`  ${ext.toUpperCase().slice(1)} optimizado: ${(compressedSize / 1024).toFixed(0)} KB`);

      totalCompressed += webpSize; // Usamos WebP como referencia

      results.push({
        file,
        original: originalSize,
        webp: webpSize,
        compressed: compressedSize,
        reduction: ((1 - webpSize / originalSize) * 100).toFixed(1)
      });

    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  // Resumen
  console.log('\n');
  console.log('='.repeat(60));
  console.log('  RESUMEN DE OPTIMIZACION');
  console.log('='.repeat(60));
  console.log('');
  console.log('  Archivo                 Original    WebP     Reduccion');
  console.log('  ' + '-'.repeat(55));

  for (const r of results) {
    const name = r.file.padEnd(22);
    const orig = `${(r.original / 1024).toFixed(0)} KB`.padStart(8);
    const webp = `${(r.webp / 1024).toFixed(0)} KB`.padStart(8);
    const red = `${r.reduction}%`.padStart(10);
    console.log(`  ${name} ${orig} ${webp} ${red}`);
  }

  console.log('  ' + '-'.repeat(55));
  console.log(`  TOTAL                 ${(totalOriginal / 1024).toFixed(0)} KB   ${(totalCompressed / 1024).toFixed(0)} KB   ${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%`);
  console.log('');
  console.log('  Los navegadores modernos usaran WebP automaticamente.');
  console.log('  WebGPU escalara las imagenes para mejor calidad visual.');
  console.log('');
}

main().catch(console.error);
