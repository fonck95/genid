import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

// Brand colors
const PRIMARY_COLOR = '#1a365d';
const ACCENT_COLOR = '#c53030';
const WHITE = '#ffffff';

// Generate Open Graph image (1200x630)
async function generateOGImage() {
  const width = 1200;
  const height = 630;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${PRIMARY_COLOR}"/>
          <stop offset="100%" style="stop-color:#2c5282"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect x="0" y="580" width="100%" height="50" fill="${ACCENT_COLOR}"/>
      <text x="600" y="280" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800" fill="${WHITE}" text-anchor="middle">BERRAQUERA</text>
      <text x="600" y="370" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800" fill="${WHITE}" text-anchor="middle">SANTANDEREANA</text>
      <text x="600" y="460" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400" fill="${WHITE}" text-anchor="middle" opacity="0.9">Noticias de Santander, Bucaramanga y el Área Metropolitana</text>
      <text x="600" y="610" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" fill="${WHITE}" text-anchor="middle">www.berraquera.co</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'og-image.jpg'));

  console.log('✓ Generated og-image.jpg (1200x630)');
}

// Generate PNG favicons from SVG
async function generateFavicons() {
  const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

  const faviconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${PRIMARY_COLOR}"/>
          <stop offset="100%" style="stop-color:#2c5282"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg)"/>
      <text x="50" y="68" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="${WHITE}" text-anchor="middle">B</text>
      <rect x="20" y="78" width="60" height="4" rx="2" fill="${ACCENT_COLOR}"/>
    </svg>
  `;

  for (const size of sizes) {
    const filename = size <= 32 ? `favicon-${size}x${size}.png` : `icon-${size}x${size}.png`;
    await sharp(Buffer.from(faviconSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, filename));
    console.log(`✓ Generated ${filename}`);
  }

  // Apple touch icon (180x180)
  await sharp(Buffer.from(faviconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png (180x180)');
}

// Generate logo image
async function generateLogo() {
  const logoSvg = `
    <svg width="600" height="60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logobg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${PRIMARY_COLOR}"/>
          <stop offset="100%" style="stop-color:#2c5282"/>
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="12" fill="url(#logobg)"/>
      <text x="30" y="42" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${WHITE}" text-anchor="middle">B</text>
      <rect x="10" y="50" width="40" height="3" rx="1.5" fill="${ACCENT_COLOR}"/>
      <text x="80" y="42" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${PRIMARY_COLOR}">BERRAQUERA SANTANDEREANA</text>
    </svg>
  `;

  await sharp(Buffer.from(logoSvg))
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ Generated logo.png (600x60)');
}

// Main execution
async function main() {
  console.log('Generating SEO assets...\n');

  try {
    await generateOGImage();
    await generateFavicons();
    await generateLogo();

    console.log('\n✅ All SEO assets generated successfully!');
  } catch (error) {
    console.error('Error generating assets:', error);
    process.exit(1);
  }
}

main();
