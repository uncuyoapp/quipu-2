const fs = require('fs');
const path = require('path');

console.log('[PWA Paths Fix] Iniciando corrección de rutas para PWA...');

const indexPath = path.join(__dirname, '../src/index.html');
const manifestPath = path.join(__dirname, '../public/manifest.webmanifest');

// Expresión regular para buscar y reemplazar rutas incorrectas generadas por pwa-asset-generator
// Reemplaza "icons/../public/icons/" por "icons/"
const incorrectPathPattern = /icons\/\.\.\/public\/icons\//g;

let fixedCount = 0;

// 1. Corregir src/index.html
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  if (incorrectPathPattern.test(content)) {
    const updatedContent = content.replace(incorrectPathPattern, 'icons/');
    fs.writeFileSync(indexPath, updatedContent);
    console.log(' -> Ruta corregida en src/index.html');
    fixedCount++;
  } else {
    console.log(' -> src/index.html ya tiene las rutas correctas o no contiene el patrón incorrecto.');
  }
} else {
  console.error(` -> ERROR: No se encontró src/index.html en la ruta: ${indexPath}`);
}

// 2. Corregir public/manifest.webmanifest
if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');
  if (incorrectPathPattern.test(content)) {
    const updatedContent = content.replace(incorrectPathPattern, 'icons/');
    fs.writeFileSync(manifestPath, updatedContent);
    console.log(' -> Ruta corregida en public/manifest.webmanifest');
    fixedCount++;
  } else {
    console.log(' -> public/manifest.webmanifest ya tiene las rutas correctas o no contiene el patrón incorrecto.');
  }
} else {
  console.error(` -> ERROR: No se encontró public/manifest.webmanifest en la ruta: ${manifestPath}`);
}

if (fixedCount > 0) {
  console.log('[PWA Paths Fix] ¡Corrección completada exitosamente!\n');
} else {
  console.log('[PWA Paths Fix] No se requirieron modificaciones.\n');
}
