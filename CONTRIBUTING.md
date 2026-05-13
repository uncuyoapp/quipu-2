# Guía de Contribución — QUIPU

Gracias por querer contribuir a QUIPU. Este documento describe todo lo que necesitás saber para participar del proyecto de forma ordenada: desde la configuración inicial hasta el proceso de revisión de tu Pull Request.

> [!IMPORTANT]
> Los mantenedores del proyecto revisan y aprueban **todos** los Pull Requests antes de integrarlos. Seguir esta guía aumenta significativamente las chances de que tu contribución sea aceptada.

---

## Tabla de Contenidos

1. [Código de Conducta](#1-código-de-conducta)
2. [¿Cómo puedo contribuir?](#2-cómo-puedo-contribuir)
3. [Configuración del entorno](#3-configuración-del-entorno)
4. [Estrategia de ramas (Gitflow)](#4-estrategia-de-ramas-gitflow)
5. [Convenciones de commits](#5-convenciones-de-commits)
6. [Proceso de Pull Request](#6-proceso-de-pull-request)
7. [Estándares de código](#7-estándares-de-código)
8. [Relación entre ramas y fases de versión](#8-relación-entre-ramas-y-fases-de-versión)

---

## 1. Código de Conducta

Este proyecto adhiere al [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md). En resumen: **trato respetuoso, crítica al código no a las personas, y disposición a aprender y enseñar**. Cualquier interacción irrespetuosa en issues, PRs o discusiones resultará en la restricción de acceso al repositorio.

Leer el [Código de Conducta completo](./CODE_OF_CONDUCT.md) antes de contribuir.

---

## 2. ¿Cómo puedo contribuir?

### Reportar un bug

1. Buscar primero en los [Issues existentes](../../issues) para evitar duplicados.
2. Si no existe, abrir un nuevo Issue usando la plantilla **Bug Report**.
3. Incluir: versión de la app, navegador, pasos para reproducir, comportamiento esperado vs. actual, capturas de pantalla si aplica.

### Proponer una nueva funcionalidad

1. Abrir un Issue usando la plantilla **Feature Request** antes de escribir código.
2. Describir el problema que resuelve y la solución propuesta.
3. Esperar feedback de los mantenedores antes de comenzar la implementación. Esto evita trabajo innecesario si la feature no se alinea con la hoja de ruta.

### Contribuir con código

El flujo completo está descripto en las secciones [4](#4-estrategia-de-ramas-gitflow) y [6](#6-proceso-de-pull-request) de este documento.

### Mejorar la documentación

Las mejoras a los archivos `.md`, comentarios JSDoc o ejemplos son siempre bienvenidas. Para cambios exclusivamente de documentación, usar una rama `docs/*` (ver [sección 4](#4-estrategia-de-ramas-gitflow)).

---

## 3. Configuración del entorno

### Fork y clone

```bash
# 1. Hacer fork del repositorio desde GitHub
# 2. Clonar tu fork localmente
git clone https://github.com/TU_USUARIO/quipu-2.git
cd quipu-2

# 3. Agregar el repositorio original como remote "upstream"
git remote add upstream https://github.com/uncuyoapp/quipu-2.git

# 4. Instalar dependencias
npm install
```

### Mantener tu fork actualizado

```bash
# Antes de comenzar cualquier contribución, actualizar desde upstream
git fetch upstream
git checkout develop
git merge upstream/develop
```

---

## 4. Estrategia de ramas (Gitflow)

QUIPU utiliza una variante de **Gitflow** adaptada al ciclo SemVer del proyecto (ver [RELEASING.md](./RELEASING.md)).

### Ramas permanentes

| Rama | Propósito | Deploy |
|------|-----------|--------|
| `main` | Código estable, siempre deployable. Solo recibe merges desde `release/*` o `hotfix/*`. Cada merge aquí **dispara automáticamente** el deploy a GitHub Pages (demo con datos mock). | ✅ GitHub Pages |
| `develop` | Rama de integración continua. Base para nuevas features y fixes. Refleja el estado actual del desarrollo (`-alpha`). | ❌ Sin deploy |

> [!CAUTION]
> **Nunca** hacer push directo a `main` ni a `develop`. Todo código llega a través de un PR revisado y aprobado por al menos un mantenedor.

### Ramas temporales

Todas las ramas temporales se eliminan una vez integradas.

#### `feature/` — Nuevas funcionalidades

```
Base:   develop
Target: develop
Nombre: feature/<descripcion-corta>

Ejemplos:
  feature/visualization-export
  feature/dark-mode
  feature/search-filters
```

Usada para nuevas funcionalidades. Siempre parte de `develop` y vuelve a `develop` mediante PR.

#### `fix/` — Corrección de bugs no críticos

```
Base:   develop
Target: develop
Nombre: fix/<descripcion-del-bug>

Ejemplos:
  fix/thematic-breadcrumb-display
  fix/mobile-sidenav-overflow
```

Para bugs detectados en desarrollo. Solo mergea a `develop`.

#### `hotfix/` — Corrección urgente en producción

```
Base:   main
Target: main + develop
Nombre: hotfix/<descripcion>

Ejemplos:
  hotfix/login-token-expiry
  hotfix/visualization-crash-ios
```

Reservada para bugs críticos que afectan `main` y no pueden esperar el ciclo normal. **Se mergea tanto a `main` como a `develop`** para no perder la corrección en futuros releases.

#### `release/` — Preparación de lanzamiento

```
Base:   develop
Target: main + develop
Nombre: release/<version>

Ejemplos:
  release/2.0.0-beta.1
  release/2.0.0-rc.1
  release/2.0.0
```

Se abre cuando `develop` está en estado *feature-complete* para la versión objetivo. Solo se admiten commits de tipo `fix` y `docs` en esta rama. Una vez aprobada, mergea a `main` y `develop`.

#### `docs/` — Mejoras de documentación

```
Base:   develop
Target: develop
Nombre: docs/<tema>

Ejemplos:
  docs/update-architecture-diagrams
  docs/add-api-examples
  docs/fix-contributing-typos
```

Para cambios que solo afectan documentación: archivos `.md`, comentarios JSDoc, ejemplos. No debe incluir cambios funcionales en el código fuente.

### Flujo para contribuciones externas (fork-based)

Los contribuidores externos siguen este flujo:

1. Hacer **fork** del repositorio desde GitHub.
2. Clonar el fork y crear una rama `feature/*`, `fix/*` o `docs/*`.
3. Abrir un **Pull Request hacia `develop`** del repo principal.
4. El CI ejecuta checks automáticos (build, compilación).
5. Un mantenedor revisa y aprueba → **Squash & Merge**.

### Flujo para el equipo mantenedor

Los mantenedores pueden crear ramas **directamente en el repositorio** (sin fork):

1. Crear rama `feature/*`, `fix/*` o `docs/*` desde `develop`.
2. Abrir PR hacia `develop`.
3. Otro mantenedor revisa y aprueba → **Squash & Merge**.

> [!NOTE]
> Los mantenedores también pueden usar forks si lo prefieren. Lo importante es que todo pase por PR con revisión.

### Diagrama de flujo

```
                                    tag: v2.0.0           tag: v2.1.0
main ──────────────────────────────────●───────────────────────●── → GH Pages
                                       ↑                       ↑
                        release/2.0.0 ●─┘        release/2.1.0●─┘
                       ↗                ↘       ↗               ↘
develop ──●────●────●────────────────────●───●────────────────────●──→
           ↑    ↑        ↑                    ↑
      feature/a fix/b  docs/c             feature/d
                                  ↑
                         (contribución externa via fork + PR)
```

---

## 5. Convenciones de commits

QUIPU utiliza el estándar **[Conventional Commits](https://www.conventionalcommits.org/)** para mantener un historial limpio y generar CHANGELOGs automatizables.

### Formato

```
<tipo>(<alcance>): <descripción en imperativo, minúsculas, sin punto final>

[cuerpo opcional: explica el por qué, no el qué]

[pie opcional: referencias a issues o breaking changes]
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | Nueva funcionalidad visible para el usuario |
| `fix` | Corrección de un bug |
| `refactor` | Cambio de código que no agrega funcionalidad ni corrige bug |
| `style` | Cambios de formato/estilos (SCSS, espaciado, orden de imports) |
| `docs` | Cambios en documentación (`.md`, JSDoc, comentarios) |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento: actualización de deps, configuración de build |
| `perf` | Mejoras de rendimiento |
| `ci` | Cambios en la configuración de CI/CD |

### Alcance (scope)

El alcance es opcional pero recomendado. Identifica la parte del sistema afectada:

```
feat(pages/home): agregar botón de exploración rápida
fix(services/session): corregir limpieza de token en logout
refactor(infrastructure/data-read): extraer método initializeFromStoredData
docs(architecture): actualizar diagrama de capas CQRS
```

### Ejemplos correctos

```bash
feat(visualization): implementar modo trellis para gráficos distribuidos
fix(thematic): corregir validación de existencia al navegar por URL directa
refactor(session-state): encapsular signal user como readonly
docs(contributing): agregar sección de proceso de PR
chore(deps): actualizar Angular a 18.2.x
```

### Breaking changes

Si el cambio rompe compatibilidad (API, modelos, rutas), indicarlo con `BREAKING CHANGE:` en el pie del commit o con `!` después del tipo:

```
feat(models)!: renombrar campo informationUnit a informationUnitId

BREAKING CHANGE: El campo `informationUnit` en el modelo User fue renombrado
a `informationUnitId`. Actualizar todos los consumidores del modelo.
```

### Commits durante el desarrollo de una feature

Dentro de tu rama `feature/` podés hacer commits intermedios con cualquier mensaje. Al hacer el PR, los mantenedores harán **squash merge**, por lo que el historial final en `develop` mostrará un único commit limpio con el formato correcto.

---

## 6. Proceso de Pull Request

### Antes de abrir el PR

- [ ] Tu rama está actualizada con `develop` (`git fetch upstream && git merge upstream/develop`)
- [ ] El código compila sin errores (`node_modules/.bin/tsc --noEmit`)
- [ ] Los tests pasan (`npm test`)
- [ ] Se respetan los [estándares de código](#7-estándares-de-código) del proyecto
- [ ] Documentaste con JSDoc (en español) todo método/componente/servicio nuevo
- [ ] Si agregaste una feature que cambia el comportamiento del usuario, actualizaste la documentación relevante

### Abrir el PR

1. Hacer push de tu rama al **fork** (no al repositorio original):
   ```bash
   git push origin feature/mi-feature
   ```
2. Ir a GitHub y abrir un **Pull Request** desde tu fork hacia `uncuyoapp/quipu-2:develop`.
3. Completar la plantilla de PR:
   - **Descripción**: qué hace el PR y por qué.
   - **Tipo de cambio**: feature / fix / refactor / docs / chore.
   - **Issue relacionado**: `Closes #123` si resuelve un issue.
   - **Checklist** de verificación.
   - **Screenshots** si hay cambios visuales.

### Proceso de revisión

```
PR abierto
    └─→ GitHub Actions ejecuta CI automáticamente (build, compilación)
            └─→ [si pasa] Revisión por mantenedor
                    ├─→ Cambios solicitados → autor itera → nueva revisión
                    └─→ Aprobado → Squash & Merge a develop
```

> [!NOTE]
> El workflow de CI (`.github/workflows/ci.yml`) se ejecuta automáticamente en cada PR. Si el CI falla, el PR no puede ser mergeado.

Los mantenedores pueden pedir cambios, hacer sugerencias inline o rechazar el PR con una explicación. **Todos los PRs pasan por al menos una revisión humana antes de ser integrados.**

### Tipos de merge utilizados

| Destino | Estrategia | Por qué |
|---------|-----------|---------|
| `develop` ← `feature/*`, `fix/*`, `docs/*` | **Squash & Merge** | Historial limpio: un cambio = un commit |
| `main` ← `release/*` | **Merge Commit** | Preservar el historial de la release para auditoría |
| `develop` ← `release/*` (back-merge) | **Merge Commit** | Preservar contexto |
| `main` ← `hotfix/*` | **Merge Commit** | Preservar contexto del fix crítico |
| `develop` ← `hotfix/*` | **Merge Commit** | Ídem |

---

## 7. Estándares de código

La guía completa de estándares arquitectónicos, de tipado y de estilos está en [ARCHITECTURE.md](./ARCHITECTURE.md) y [STYLE_GUIDE.md](./STYLE_GUIDE.md). Los puntos más importantes para contribuidores externos:

### Reglas no negociables

| Regla | Descripción |
|-------|-------------|
| ❌ Sin `any` | Tipado estricto en todo el código TypeScript. |
| ✅ `inject()` siempre | Única forma de inyectar dependencias. Prohibido `constructor(private x: X)`. |
| ✅ Standalone Components | No crear `NgModule`. Todos los componentes son `standalone: true`. |
| ✅ Control de flujo nativo | Usar `@if`, `@for`, `@switch`. Prohibidas las directivas `*ngIf`, `*ngFor`. |
| ✅ `@for` con `track` | Todo `@for` debe incluir su expresión `track`. |
| ✅ JSDoc en español | Todo componente, servicio y método público debe tener JSDoc en español. |
| ✅ Sufijo `.model.ts` | Obligatorio para todas las interfaces y tipos de datos en `core/models`. |
| ✅ Respetar capas CQRS | Componentes no pueden importar `DataReadService` ni `DataWriteService` directamente. |

### Arquitectura de capas

Ver [ARCHITECTURE.md — Reglas de Importación entre Capas](./ARCHITECTURE.md#114-reglas-de-importación-entre-capas).

### Estilo de código

- **Archivos**: `kebab-case` (`thematic-edit.service.ts`)
- **Variables/métodos**: `camelCase` descriptivo (`isUserLoggedIn`)
- **Interfaces/tipos**: `PascalCase` (`VisualizationPage`). Los archivos deben usar el sufijo `.model.ts`.
- **Constantes de módulo**: `UPPER_SNAKE_CASE` (`LOGIN_MESSAGES`)

### Formateo de código

El proyecto incluye un archivo `.prettierrc` con la configuración de [Prettier](https://prettier.io/). Se recomienda configurar tu editor para formatear automáticamente al guardar. La configuración utilizada es:

- Comillas simples (`singleQuote: true`)
- Punto y coma obligatorio (`semi: true`)
- Trailing comma en ES5 (`trailingComma: "es5"`)

---

## 8. Relación entre ramas y fases de versión

El ciclo de versiones del proyecto (documentado en [RELEASING.md](./RELEASING.md)) se corresponde directamente con las ramas:

| Rama | Fase SemVer | Ejemplo de tag | Deploy |
|------|-------------|----------------|--------|
| `develop` | `-alpha.X` | `v2.0.0-alpha.3` | ❌ Sin deploy |
| `release/x.x.x` | `-beta.X` → `-rc.X` | `v2.0.0-beta.1` | ❌ Staging manual |
| `main` | Oficial | `v2.0.0` | ✅ GitHub Pages (automático) |

### ¿Cuándo se abre una rama `release/`?

Cuando los mantenedores consideran que `develop` está *feature-complete* para el próximo hito. A partir de ese momento:

1. Se abre `release/2.0.0-beta.1` desde `develop`.
2. Solo se admiten `fix` y `docs` en esa rama.
3. Se ejecuta el proceso de bump de versión:
   ```bash
   npm version prerelease --preid=beta
   ```
4. Se despliega en staging para QA con usuarios reales.
5. Cuando supera QA sin show-stoppers, se hace el bump a `rc`:
   ```bash
   npm version prerelease --preid=rc
   ```
6. Si el RC supera el período de estabilidad acordado, se cierra la release:
   ```bash
   npm version 2.0.0
   ```
7. La rama se mergea a `main` y `develop`, y se agrega el tag al repositorio.
8. Al mergear a `main`, GitHub Actions despliega automáticamente a GitHub Pages.
9. El mantenedor crea un **GitHub Release** con el tag y las notas de la versión.

---

*Ante cualquier duda sobre este proceso, abrir un Issue con la etiqueta `question` antes de empezar a trabajar.*
