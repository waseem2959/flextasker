#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG to PNG conversion script that uses sharp if available
// or falls back to creating placeholder files

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for icons
function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#15919B"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="#ffffff"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="#15919B" text-anchor="middle" dominant-baseline="central">F</text>
</svg>`;
}

// Try to use sharp if available
let sharp;
try {
  sharp = await import('sharp');
  sharp = sharp.default;
} catch (e) {
  console.log('Sharp not found, will create placeholder files');
}

async function generateIcon(size) {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  if (sharp) {
    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(filename);
      console.log(`✓ Generated ${filename}`);
    } catch (error) {
      console.error(`Error generating ${filename}:`, error);
    }
  } else {
    // Create a placeholder file
    fs.writeFileSync(filename, '');
    console.log(`✓ Created placeholder ${filename}`);
  }
}

// Generate shortcut icons
const shortcuts = {
  'tasks': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
    <rect width="192" height="192" fill="#15919B"/>
    <rect x="48" y="64" width="96" height="8" fill="#ffffff" rx="4"/>
    <rect x="48" y="92" width="96" height="8" fill="#ffffff" rx="4"/>
    <rect x="48" y="120" width="64" height="8" fill="#ffffff" rx="4"/>
  </svg>`,
  'create': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
    <rect width="192" height="192" fill="#15919B"/>
    <rect x="92" y="56" width="8" height="80" fill="#ffffff" rx="4"/>
    <rect x="56" y="92" width="80" height="8" fill="#ffffff" rx="4"/>
  </svg>`,
  'dashboard': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
    <rect width="192" height="192" fill="#15919B"/>
    <rect x="40" y="100" width="24" height="52" fill="#ffffff" rx="4"/>
    <rect x="84" y="80" width="24" height="72" fill="#ffffff" rx="4"/>
    <rect x="128" y="60" width="24" height="92" fill="#ffffff" rx="4"/>
  </svg>`,
  'messages': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
    <rect width="192" height="192" fill="#15919B"/>
    <rect x="40" y="56" width="112" height="80" fill="#ffffff" rx="12"/>
    <polygon points="80,136 80,156 100,136" fill="#ffffff"/>
  </svg>`
};

async function generateShortcutIcon(name, svg) {
  const filename = path.join(iconsDir, `${name}.png`);
  
  if (sharp) {
    try {
      await sharp(Buffer.from(svg))
        .resize(192, 192)
        .png()
        .toFile(filename);
      console.log(`✓ Generated ${filename}`);
    } catch (error) {
      console.error(`Error generating ${filename}:`, error);
    }
  } else {
    fs.writeFileSync(filename, '');
    console.log(`✓ Created placeholder ${filename}`);
  }
}

// Main function
async function main() {
  console.log('🎨 Generating PWA icons...\n');
  
  // Generate main icons
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  // Generate shortcut icons
  for (const [name, svg] of Object.entries(shortcuts)) {
    await generateShortcutIcon(name, svg);
  }
  
  console.log('\n✅ Icon generation complete!');
  
  if (!sharp) {
    console.log('\n⚠️  Note: Install sharp for actual PNG generation:');
    console.log('   npm install --save-dev sharp');
  }
}

main().catch(console.error);