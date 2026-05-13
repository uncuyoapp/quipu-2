# Guía de Release y Despliegue

Este documento describe las directrices y estándares para incrementar y publicar entregables de la aplicación **Quipu**.

El proyecto sigue formalmente el estándar de **Semantic Versioning (SemVer)** adaptado para ciclos de QA (Quality Assurance) y despliegue continuo. La demo pública en GitHub Pages se actualiza automáticamente al mergear a `main`.

---

## 1. Reglas de Etiquetado de Estabilidad

A medida que el equipo avance en el código, el sistema irá escalando la "estabilidad" de sus pre-lanzamientos usando sufijos estandarizados, hasta alcanzar la versión final `2.0.0`.

### Fase ALPHA (`-alpha.X`)
**Ejemplo:** `2.0.0-alpha.1`
- **Uso principal:** Para desarrollos tempranos destinados a los primeros ciclos exploratorios, usualmente con ambientes de `testing` (con o sin *mock data*).
- **Inestabilidad:** Alta. El modelo de datos, la estructura semántica y la UI pueden cambiar de forma radical de una versión alpha a la siguiente sin previo aviso preventivo de "breaking changes".
- **Comando sugerido de paso:** 
  ```bash
  npm version prerelease --preid=alpha
  ```

### Fase BETA (`-beta.X`)
**Ejemplo:** `2.0.0-beta.1`
- **Uso principal:** El producto (o iteración actual) está "Feature Complete" (completado a nivel de funciones). Esto se suele desplegar en *Staging* para que los Key Users reales de la universidad o auditores prueben la base ya conectada contra una API robusta.
- **Inestabilidad:** Media-Baja. En la etapa beta ya no se agregan funciones enormes ni se hace refactoring agresivo de APIs sin advertencias rigurosas. Todo se perfila al ajuste de comportamiento y solución de 'Bugs'.
- **Comando sugerido de paso:** 
  ```bash
  # Para pasar de alpha.x a la primera beta.1
  npm version prerelease --preid=beta
  ```

### Fase RC (`-rc.X`) - Release Candidate
**Ejemplo:** `2.0.0-rc.1`
- **Uso principal:** Es una versión que internamente el equipo de desarrollo considera que es **La Versión Final (Producción)**. Se empuja con etiqueta `rc` a producción para mantenerla como candidata oficial y congelar agresivamente el ingreso de código. Si a lo largo de un período establecido (ej. 1 semana) no saltan fallos críticos (Show-stoppers), el código pasa intacto a versión limpia.
- **Inestabilidad:** Nula (esperable).

### Fase OFICIAL / LAUNCH 
**Ejemplo:** `2.0.0`
- **Uso principal:** La aplicación se encuentra viva para todos los usuarios definitivos y estables del sistema en Producción real.
- **Comando sugerido de paso:**
  ```bash
  npm version major # (o minor/patch según corresponda a futuro posterior al lanzamiento de la v2)
  ```

---

## 2. Automatización del Versionado en Quipu

¡No tienes que modificar las variables de versión en 4 archivos simultáneos manualmente! Quipu cuenta con un *Hook NPM* profesional (`scripts/sync-version.js`).

### ¿Cómo actualizar la aplicación correctamente?

Para incrementar la versión oficial desde tu terminal antes de mandar el código a control de versiones (Git), todo lo que tienes que hacer es escribir un comando NPM nativo:

```bash
# Ejemplo: Subir a alpha.2
npm version prerelease --preid=alpha
```

**¿Qué es lo que hace NPM por debajo al ejecutar esto?:**
1. Actualiza obligatoriamente `package.json` y el `package-lock.json`.
2. Se detiene y dispara el hook de ciclo de vida nativo de NPM: `version` de nuestro `package.json`.
3. Ejecuta de forma invisible nuestro script `sync-version.js`, el cual *escanea* y *reemplaza* la variable de texto `appVersion` dentro de **TODOS** tus entornos (`environment.ts`, `environment.prod.ts` y `environment.testing.ts`) e incluye esos archivos en la caja de control (`git add`).
4. Realiza el *Commit* genérico del sistema versionando todo.
5. Inyecta el *Tag* en tu historia de Git local (Ej: tag `v2.0.0-alpha.2`).

Al terminar, tu trabajo simplemente consiste en llevar los cambios e integrarlos (con un `git push` o `git push --tags`).

---

## 3. Compilación y Despliegue (Deploy)

Para compilar la aplicación, Angular cuenta con diferentes perfiles en `angular.json` que optimizan el empaquetado y reemplazan las variables de conexión según corresponda.

### Construcción Estándar (Por Entorno)
- **Producción:** Empaqueta con máxima minificación y habilita configuración contra la API pública (Usa `environment.prod.ts`).
  ```bash
  npm run build
  # o bien: ng build --configuration production
  ```
- **Testing (QA):** Empaquetado minificado productivo pero usando datos estáticos *MOCK* (Usa `environment.testing.ts`). Ideal para simulaciones en staging PWA sin API.
  ```bash
  npm run build:testing
  ```

### Despliegue en Sub-Directorios
Si la aplicación no va a ser servida desde el directorio raíz (`/`) de un dominio, sino desde una sub-carpeta (por ejemplo: `https://apps.edu.ar/quipu-2`), es obligatorio informárselo al compilador para que las rutas e inyecciones de PWA concuerden:
```bash
ng build --configuration production --base-href /quipu-2/
```
> [!WARNING]
> Si omites el parámetro `--base-href`, la PWA y los *assets* principales arrojarán errores 404 porque el sistema los buscará inexorablemente en la raíz `apps.edu.ar/`.

### Deploy automático a GitHub Pages

Al mergear un PR a `main`, el workflow `.github/workflows/deploy-ghpages.yml` se ejecuta automáticamente:

1. Compila la app con `--configuration testing` (datos mock) y `--base-href /quipu-2/`.
2. Despliega el resultado en GitHub Pages.
3. La demo queda disponible en `https://uncuyoapp.github.io/quipu-2/`.

> [!NOTE]
> La demo de GitHub Pages **siempre usa datos ficticios** (`MockDataProvider`). No se conecta a ningún backend real.

---

## 4. Testing Local Interactivo de PWA

Testear características Progressive Web App (Service Workers, Prompts de Instalación y Caching) no es posible en un simple `ng serve` de desarrollo en memoria. Debes emular un ecosistema productivo.

### Preparación del entorno de PWA
1. **Compilar la app:** Obligas al compilador a generar tu estático PWA de prueba.
   ```bash
   npm run build:testing
   ```
2. **Servir localmente:** Utiliza la librería de Node que despliega el empaquetado. 
   *(Nota: Puedes usar el atajo `npm run serve:testing` para agrupar los pasos 1 y 2)*.
   ```bash
   npx serve dist/quipu/browser -s
   ```
   *Asumamos que esto levanta el servidor local en el puerto `3000`.*

### Requisito Básico: HTTPS (Cifrado)
Los navegadores móviles **prohíben terminantemente** instalar una aplicación web si el protocolo no es seguro (HTTP clásico en IPs locales). Tienes dos maneras de vulnerar o cumplir esta seguridad para hacer el QA temporal:

#### Método A: Usando Ngrok (Recomendado y más rápido)
Ngrok generará un túnel público 100% cifrado con SSL legítimo apuntando de reversa a tu puerto 3000 local.
```bash
npx ngrok http 3000
```
- Copia enteramente el *Forwarding URL* que comienza con `https://...` (Ej: `https://crouch-skype.ngrok-free.dev`).
- Abre esta dirección en tu dispositivo móvil.
- Puesto que es HTTPS seguro y con certificados válidos, se registrará el `ngsw-worker.js` y saltará el diálogo "Instalar Quipu".

#### Método B: Ignorar Origen Local Inseguro (Desde el Teléfono)
Si no deseas utilizar Ngrok y buscas entrar usando tu IP local por wifi (Ej: `http://192.168.1.5:3000`):
1. Desde Google Chrome en de tu móvil, ingresa a las políticas ocultas: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. En la caja de texto ingresa textualmente tu IP y puerto completa (`http://192.168...:3000`).
3. Actívalo marcando la opción **"Enabled"** y pulsa "Relaunch" (Reiniciar navegador).
4. El teléfono ahora tratará tu conexión wifi local como segura, forzando la instalación de la PWA.

> [!TIP]
> Si no ves el cuadro de instalación, recuerda abrir y testear siempre en **Navegación Privada (Incógnito)**. Esto evita que el `sessionStorage` o los cachés muertos de Chrome oculten el Service Worker, garantizando una carga pura como si fueras un usuario nuevo.

---

## 5. Gestión del Ícono de PWA (Favicon y App Icon)

El ícono oficial de la aplicación y sus múltiples resoluciones requeridas por iOS, Android y Navegadores Desktop no se manipulan individualmente de forma prehistórica en Quipu.

**Pipeline de Generación Automático**
Al proyecto se le incorporó una directiva que automatiza enteramente la creación, minificación e inyección de los íconos de la Progressive Web App:

1. Ubica o reemplaza tu logótipo principal y único (`512x512` idealmente o más) dentro de la carpeta `/public` y llámalo tajantemente **`logo-base.png`**.
2. Corre en la consola el script nativo de automatización:
   ```bash
   npm run pwa:icons
   ```
3. La consola comenzará una operación de Puppeteer (Navegador oculto) que recortará e indexará resoluciones, sobreescribirá mágicamente tu `public/manifest.webmanifest`, e inyectará los códigos legados para Apple dentro del `src/index.html`.

Vuelve a compilar (`npm run build`) para empaquetarlos en tu próximo lanzamiento.

---

## 6. GitHub Releases

Cuando una versión oficial llega a `main`, el mantenedor debe crear un **GitHub Release** manualmente desde la interfaz de GitHub:

1. Ir a **Releases** → **Draft a new release**.
2. Seleccionar el **tag** creado por `npm version` (ej. `v2.0.0`).
3. Escribir las **notas de la versión** (release notes), incluyendo:
   - Resumen de funcionalidades nuevas
   - Bugs corregidos
   - Breaking changes (si los hay)
   - Agradecimientos a contribuidores externos
4. Publicar el release.

> [!TIP]
> Usar el botón **"Generate release notes"** de GitHub como punto de partida. Este genera automáticamente una lista de PRs incluidos en la versión.
