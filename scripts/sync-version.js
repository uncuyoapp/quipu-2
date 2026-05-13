const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

console.log(`[Version Sync] Detectada actualización a v${version}. Sincronizando con los environments...`);

const envPaths = [
  path.join(__dirname, '../src/environments/environment.ts'),
  path.join(__dirname, '../src/environments/environment.prod.ts'),
  path.join(__dirname, '../src/environments/environment.testing.ts')
];

let updatedCount = 0;

envPaths.forEach(envPath => {
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    
    // RegEx para buscar appVersion y reemplazar el valor por la nueva versión
    const updatedContent = content.replace(/appVersion:\s*['"][^'"]+['"]/g, `appVersion: '${version}'`);
    
    if (content !== updatedContent) {
      fs.writeFileSync(envPath, updatedContent);
      console.log(` -> Actualizado ${path.basename(envPath)} a v${version}`);
      updatedCount++;
    }
  }
});

if (updatedCount > 0) {
  console.log(`[Version Sync] ¡Sincronización completada exitosamente! ${updatedCount} archivos modificados.\n`);
} else {
  console.log(`[Version Sync] No se requiere sincronización.\n`);
}
