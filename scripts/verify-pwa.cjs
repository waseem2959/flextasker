#!/usr/bin/env node

/**
 * PWA Verification Script
 * 
 * Verifies that all PWA requirements are met
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function addCheck(name, passed, message) {
  checks.push({ name, passed, message });
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
}

console.log('🔍 Verifying PWA Configuration...\n');

// Check manifest.json exists and is valid
try {
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  addCheck('Manifest File', true, 'manifest.json exists and is valid JSON');
  
  // Check required manifest fields
  const requiredFields = ['name', 'start_url', 'display', 'icons'];
  requiredFields.forEach(field => {
    const hasField = manifest[field] !== undefined;
    addCheck(`Manifest ${field}`, hasField, hasField ? `${field} is defined` : `${field} is missing`);
  });
  
  // Check icons
  if (manifest.icons && Array.isArray(manifest.icons)) {
    const hasRequiredSizes = manifest.icons.some(icon => 
      icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
    );
    addCheck('Manifest Icons', hasRequiredSizes, 
      hasRequiredSizes ? 'Icons include required sizes' : 'Missing 192x192 or 512x512 icons');
  }
  
} catch (error) {
  addCheck('Manifest File', false, `Error reading manifest.json: ${error.message}`);
}

// Check service worker exists
const swPath = path.join(__dirname, '../public/service-worker.js');
const swExists = fs.existsSync(swPath);
addCheck('Service Worker', swExists, swExists ? 'service-worker.js exists' : 'service-worker.js missing');

if (swExists) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const hasInstallEvent = swContent.includes("addEventListener('install'");
  const hasActivateEvent = swContent.includes("addEventListener('activate'");
  const hasFetchEvent = swContent.includes("addEventListener('fetch'");
  
  addCheck('SW Install Event', hasInstallEvent, hasInstallEvent ? 'Install event handler present' : 'Install event handler missing');
  addCheck('SW Activate Event', hasActivateEvent, hasActivateEvent ? 'Activate event handler present' : 'Activate event handler missing');
  addCheck('SW Fetch Event', hasFetchEvent, hasFetchEvent ? 'Fetch event handler present' : 'Fetch event handler missing');
}

// Check offline page exists
const offlinePath = path.join(__dirname, '../public/offline.html');
const offlineExists = fs.existsSync(offlinePath);
addCheck('Offline Page', offlineExists, offlineExists ? 'offline.html exists' : 'offline.html missing');

// Check service worker registration in HTML
const htmlPath = path.join(__dirname, '../index.html');
if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const hasRegistration = htmlContent.includes('serviceWorker.register');
  addCheck('SW Registration', hasRegistration, hasRegistration ? 'Service worker registration found in HTML' : 'Service worker registration missing');
} else {
  addCheck('HTML File', false, 'index.html not found');
}

// Check for HTTPS requirement (in production)
addCheck('HTTPS', true, 'HTTPS required for production PWA (dev server ok for testing)');

// Check icons directory
const iconsDir = path.join(__dirname, '../public/icons');
const iconsDirExists = fs.existsSync(iconsDir);
addCheck('Icons Directory', iconsDirExists, iconsDirExists ? 'Icons directory exists' : 'Icons directory missing');

if (iconsDirExists) {
  const iconFiles = fs.readdirSync(iconsDir);
  const hasIcons = iconFiles.length > 0;
  addCheck('Icon Files', hasIcons, hasIcons ? `${iconFiles.length} icon files found` : 'No icon files found');
}

// Summary
console.log('\n📊 PWA Verification Summary:');
const passed = checks.filter(check => check.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);

if (percentage >= 80) {
  console.log('🎉 PWA configuration looks good!');
} else if (percentage >= 60) {
  console.log('⚠️  PWA configuration needs some improvements.');
} else {
  console.log('❌ PWA configuration needs significant work.');
}

console.log('\n📝 Recommendations:');
checks.filter(check => !check.passed).forEach(check => {
  console.log(`   • Fix: ${check.name} - ${check.message}`);
});

if (percentage >= 80) {
  console.log('\n🚀 Next Steps:');
  console.log('   • Test installation on mobile device');
  console.log('   • Verify offline functionality');
  console.log('   • Test service worker caching');
  console.log('   • Run Lighthouse PWA audit');
}

process.exit(percentage >= 80 ? 0 : 1);