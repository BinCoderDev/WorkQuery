/**
 * Generate tab bar icons from Remix Icon CDN
 * Downloads SVGs and converts to 81x81 PNG with active/inactive color variants
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const STATIC_DIR = path.resolve(__dirname, '../src/static');

// Icon definitions: [name, remix-icon-name]
const ICONS = [
  { file: 'tab-bank', icon: 'book-read-line', label: '题库' },
  { file: 'tab-search', icon: 'search-line', label: '速查' },
  { file: 'tab-mine', icon: 'user-line', label: '我的' },
];

// Colors
const INACTIVE_COLOR = '#999999';
const ACTIVE_COLOR = '#007AFF';
const ICON_SIZE = 81;

/**
 * Fetch SVG from Remix Icon CDN
 */
function fetchSvg(iconName) {
  const url = `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Others/${iconName}.svg`;

  // Some icons are in different folders
  const altUrls = {
    'book-read-line': 'https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Document/book-read-line.svg',
    'search-line': 'https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/System/search-line.svg',
    'user-line': 'https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/User%20%26%20Faces/user-line.svg',
  };

  const fetchUrl = altUrls[iconName] || url;

  return new Promise((resolve, reject) => {
    https.get(fetchUrl, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', (chunk) => (data += chunk));
          res2.on('end', () => resolve(data));
          res2.on('error', reject);
        });
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

/**
 * Convert SVG string to PNG buffer with specified color and size
 */
async function svgToPng(svgString, color, size) {
  // Remove existing fill attributes and inject desired color
  const coloredSvg = svgString
    .replace(/\s*fill="[^"]*"/g, '')
    .replace(/<svg/, `<svg fill="${color}"`);

  const pngBuffer = await sharp(Buffer.from(coloredSvg))
    .resize(size, size)
    .png()
    .toBuffer();

  return pngBuffer;
}

async function main() {
  console.log('🎨 Generating tab bar icons...\n');

  for (const { file, icon, label } of ICONS) {
    console.log(`Processing: ${label} (${icon})`);

    try {
      // Fetch SVG
      const svg = await fetchSvg(icon);
      console.log(`  ✓ Downloaded SVG (${svg.length} bytes)`);

      // Generate inactive icon (gray)
      const inactivePng = await svgToPng(svg, INACTIVE_COLOR, ICON_SIZE);
      const inactivePath = path.join(STATIC_DIR, `${file}.png`);
      fs.writeFileSync(inactivePath, inactivePng);
      console.log(`  ✓ Saved ${file}.png (${inactivePng.length} bytes)`);

      // Generate active icon (blue)
      const activePng = await svgToPng(svg, ACTIVE_COLOR, ICON_SIZE);
      const activePath = path.join(STATIC_DIR, `${file}-active.png`);
      fs.writeFileSync(activePath, activePng);
      console.log(`  ✓ Saved ${file}-active.png (${activePng.length} bytes)`);

    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  console.log('\n✅ Done! Tab bar icons generated in src/static/');
}

main().catch(console.error);
