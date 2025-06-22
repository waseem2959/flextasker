#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - Primary color
  ctx.fillStyle = '#15919B';
  ctx.fillRect(0, 0, size, size);
  
  // White circle in center
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.35, 0, 2 * Math.PI);
  ctx.fill();
  
  // "F" letter in center
  ctx.fillStyle = '#15919B';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', size/2, size/2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
}

// Generate shortcut icons
function generateShortcutIcon(name) {
  const size = 192;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#15919B');
  gradient.addColorStop(1, '#0891b2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // White circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.35, 0, 2 * Math.PI);
  ctx.fill();
  
  // Icon symbol
  ctx.fillStyle = '#15919B';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const symbols = {
    tasks: '📋',
    create: '➕',
    dashboard: '📊',
    messages: '💬'
  };
  
  ctx.fillText(symbols[name] || 'F', size/2, size/2);
  
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(iconsDir, `${name}.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
}

// Main generation
console.log('Generating PWA icons...');

// Generate main app icons
sizes.forEach(size => generateIcon(size));

// Generate shortcut icons
['tasks', 'create', 'dashboard', 'messages'].forEach(name => generateShortcutIcon(name));

console.log('Icon generation complete!');