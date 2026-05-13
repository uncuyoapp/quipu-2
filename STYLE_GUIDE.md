# Guía de Estilos — Quipu

## Introducción

Este documento define las convenciones de estilos del proyecto. Todos los valores visuales están centralizados en **design tokens** (CSS custom properties) ubicados en `src/theme/`. Los componentes nunca deben definir colores, tamaños de fuente, sombras o border-radius de forma directa.

### Arquitectura de archivos de tema

```
src/theme/
├── _tokens.scss       → Variables CSS (colores, tipografía, radios, sombras, z-index)
├── _typography.scss   → Mixins tipográficos (@include q-heading-2, q-body-sm, etc.)
├── _surfaces.scss     → Mixins de superficies (@include q-card, q-panel, q-focus-ring, etc.)
├── _material.scss     → Overrides centralizados de Angular Material y CDK
└── themes.scss        → Orquestador: importa los parciales, configura Material y Bootstrap
```

---

## Colores

### Principio: Capa de valores → Capa semántica → Uso

```scss
// _tokens.scss define tres capas:
--q-gray-800: #181c32;                    // Capa de valores (fija por tema)
--q-text-primary: var(--q-gray-800);      // Capa semántica (re-apuntable por tema)

// Los componentes usan SOLO la capa semántica:
.titulo { color: var(--q-text-primary); } // ✅ Correcto
.titulo { color: var(--q-gray-800); }     // ⚠️ Evitar (no es portable entre temas)
.titulo { color: #181c32; }               // ❌ Prohibido
```

### Tokens de color disponibles

#### Marca y primarios
| Token | Valor | Uso |
|---|---|---|
| `--q-brand` | `#004a99` | Logo, identidad institucional |
| `--q-primary` | `#2979ff` | Acciones principales, enlaces, botones activos |
| `--q-primary-dark` | `#2073ed` | Hover sobre primario |
| `--q-primary-darker` | `#2067ce` | Variante más oscura |
| `--q-primary-light` | `#b0cdfc` | Acentos suaves |
| `--q-primary-bg` | `#dfebff` | Fondos informativos, badges |

#### Complementarios (paleta decorativa)

Colores decorativos utilizados para temáticas, categorías y acentos visuales. Sus nombres son **neutros** (no atados al color) porque en otro tema pueden cambiar completamente.

| Token | Valor actual | Variante clara |
|---|---|---|
| `--q-comp-1` | `#ff3e84` | `--q-comp-1-bg`: `#ffd9ea` |
| `--q-comp-2` | `#fab217` | `--q-comp-2-bg`: `#ffedca` |
| `--q-comp-3` | `#70cacd` | `--q-comp-3-bg`: `#caede8` |

> **Nota**: En el tema actual, los complementarios coinciden con los semánticos (comp-1 = danger, comp-2 = warning, comp-3 = success). Esta coincidencia **no está garantizada** en otros temas. Por eso se definen por separado con valores propios.

#### Semánticos (estados del sistema)

Colores funcionales con significado fijo. Tienen valores propios, independientes de los complementarios.

| Estado | Color | Fondo |
|---|---|---|
| Éxito | `--q-success`: `#70cacd` | `--q-success-bg`: `#caede8` |
| Advertencia | `--q-warning`: `#fab217` | `--q-warning-bg`: `#ffedca` |
| Error/Peligro | `--q-danger`: `#ff3e84` | `--q-danger-bg`: `#ffd9ea` |
| Información | `--q-info`: `#2979ff` | `--q-info-bg`: `#dfebff` |
| Resaltado | `--q-highlight`: `#fff59d` | — |

#### Texto
| Token | Uso |
|---|---|
| `--q-text-primary` | Títulos, texto principal |
| `--q-text-secondary` | Subtítulos, texto complementario |
| `--q-text-muted` | Etiquetas, hints, placeholders |
| `--q-text-disabled` | Elementos deshabilitados |
| `--q-text-link` | Enlaces (= `--q-primary`) |
| `--q-text-on-primary` | Texto sobre fondos de color primario |

#### Superficies
| Token | Uso |
|---|---|
| `--q-surface` | Fondo principal (blanco) |
| `--q-surface-variant` | Fondo alternativo (gris claro) |
| `--q-surface-hover` | Fondo al pasar el mouse |

#### Bordes
| Token | Uso |
|---|---|
| `--q-border-color` | Separadores sutiles entre secciones |
| `--q-border-color-strong` | Bordes más visibles (cards, inputs) |
| `--q-border-color-input` | Específico para campos de formulario |

#### Escala de grises
| Token | Hex | Uso típico |
|---|---|---|
| `--q-gray-900` | `#000000` | Negro puro |
| `--q-gray-800` | `#181c32` | Texto principal |
| `--q-gray-700` | `#404040` | Texto oscuro alternativo |
| `--q-gray-600` | `#707070` | Texto secundario |
| `--q-gray-500` | `#94a3b8` | Texto apagado |
| `--q-gray-400` | `#cccccc` | Deshabilitados |
| `--q-gray-300` | `#e0e0e0` | Bordes visibles |
| `--q-gray-200` | `#e6e6e6` | Bordes sutiles, fondos hover |
| `--q-gray-100` | `#f5f5f5` | Fondos alternos |
| `--q-white` | `#ffffff` | Fondo principal |

#### Paleta de temáticas

La paleta utilizada para colorear las categorías temáticas se resuelve en runtime desde los tokens CSS. Está compuesta por los 3 complementarios + el primario:

```
--q-comp-1  →  Temática 1
--q-comp-2  →  Temática 2
--q-comp-3  →  Temática 3
--q-primary →  Temática 4
(el ciclo se repite si hay más de 4 temáticas)
```

Esto se gestiona en `ThematicStateService.resolveThematicPalette()`, que lee los tokens via `getComputedStyle`. Al cambiar de tema, la paleta se actualiza automáticamente.

### Uso en HTML (clases utilitarias)

Para casos donde no se puede usar SCSS (templates con clases dinámicas):

```html
<p class="q-text-muted">Texto apagado</p>
<span class="q-text-primary">Enlace o acción</span>
<div class="q-bg-light">Fondo alternativo</div>
<strong class="q-fw-semibold">Texto enfatizado</strong>
```

> **Nota**: Las clases `q-*` están definidas en `src/styles.scss`. Preferir siempre tokens en SCSS sobre clases utilitarias.

---

## Tipografía

### Escala

| Token | Valor | Uso | ¿RFS? |
|---|---|---|---|
| `--q-fs-3xl` | `2.5rem` (40px) | Display / H1 (~28px en móvil) | ✅ |
| `--q-fs-2xl` | `2rem` (32px) | H2 (~25px en móvil) | ✅ |
| `--q-fs-xl` | `1.75rem` (28px) | H3 (~22px en móvil) | ✅ |
| `--q-fs-lg` | `1.5rem` (24px) | H4 (~20px en móvil) | ✅ |
| `--q-fs-md` | `1.25rem` (20px) | H5 / Lead (~18px en móvil) | ✅ |
| `--q-fs-base` | `1rem` (16px) | Cuerpo de texto, inputs | ❌ Fijo |
| `--q-fs-sm` | `0.875rem` (14px) | Metadatos, botones, badges | ❌ Fijo |
| `--q-fs-xs` | `0.75rem` (12px) | Captions, etiquetas menores | ❌ Fijo |

> **RFS (Responsive Font Sizes)**: Los tamaños ≥20px escalan fluidamente con el viewport mediante `calc()`. Los tamaños <20px permanecen fijos. Ver `docs/typography-system.md` para detalle completo.

### Pesos

| Token | Valor | Uso |
|---|---|---|
| `--q-fw-regular` | 400 | Cuerpo de texto |
| `--q-fw-medium` | 500 | Etiquetas, botones |
| `--q-fw-semibold` | 600 | Subtítulos, campos de perfil |
| `--q-fw-bold` | 700 | Títulos principales |

### Line-height y letter-spacing

| Token | Valor | Uso |
|---|---|---|
| `--q-lh-tight` | 1.2 | Headings grandes (H1-H3) |
| `--q-lh-snug` | 1.3 | Headings medianos (H4-H5), captions |
| `--q-lh-normal` | 1.5 | Body text |
| `--q-lh-relaxed` | 1.6 | Párrafos largos |
| `--q-ls-tight` | -0.02em | Headings grandes (compacta) |
| `--q-ls-normal` | 0 | Body |
| `--q-ls-wide` | 0.025em | Captions, labels uppercase |

### Mixins (preferidos para combinaciones frecuentes)

> **Nota sobre RFS**: Los mixins de headings (`q-heading-*`) y `q-lead` usan el mixin `font-size()` de Bootstrap RFS. Los headings escalan automáticamente — no se necesita media query manual.

```scss
.titulo-seccion { @include q-heading-2; }  // 2rem / 600 / 1.2 / ls:-0.02em (RFS)
.etiqueta       { @include q-label; }      // 0.875rem / 500 / 1.5
.nota-al-pie    { @include q-caption; }    // 0.75rem / 400 / 1.3 / ls:0.025em
.codigo         { @include q-code; }       // DM Mono, 0.875rem
.intro          { @include q-lead; }       // 1.25rem / 400 / 1.6 (RFS)
```

| Mixin | Tamaño (desktop) | Peso | Line-height | Letter-spacing | ¿RFS? |
|---|---|---|---|---|---|
| `q-heading-1` | 2.5rem (40px) | bold (700) | tight (1.2) | tight (-0.02em) | ✅ |
| `q-heading-2` | 2rem (32px) | semibold (600) | tight (1.2) | tight (-0.02em) | ✅ |
| `q-heading-3` | 1.75rem (28px) | medium (500) | tight (1.2) | tight (-0.02em) | ✅ |
| `q-heading-4` | 1.5rem (24px) | semibold (600) | snug (1.3) | — | ✅ |
| `q-heading-5` | 1.25rem (20px) | medium (500) | snug (1.3) | — | ✅ |
| `q-body` | 1rem (16px) | regular (400) | normal (1.5) | — | ❌ |
| `q-body-sm` | 0.875rem (14px) | regular (400) | normal (1.5) | — | ❌ |
| `q-caption` | 0.75rem (12px) | regular (400) | snug (1.3) | wide (0.025em) | ❌ |
| `q-label` | 0.875rem (14px) | medium (500) | normal (1.5) | — | ❌ |
| `q-code` | 0.875rem (14px) | — | normal (1.5) | — | ❌ |
| `q-lead` | 1.25rem (20px) | regular (400) | relaxed (1.6) | — | ✅ |

---

## Bordes y Radios

### Border-radius

| Token | Valor | Uso |
|---|---|---|
| `--q-radius-sm` | 4px | Badges, checkboxes, botones pequeños |
| `--q-radius-md` | 8px | Cards, inputs, modales, paneles |
| `--q-radius-lg` | 10px | Bottom sheets, drag preview |
| `--q-radius-xl` | 16px | Cards premium, caja de login |
| `--q-radius-pill` | 100px | Tags, pills |
| `--q-radius-circle` | 50% | Avatares, iconos circulares |

### Mixins de superficies

```scss
@import 'src/theme/surfaces';

.mi-card    { @include q-card; }        // radius-md + shadow-md + fondo blanco
.mi-panel   { @include q-panel; }       // border sutil + radius-md
.mi-input   { @include q-input-border; } // border fuerte + radius-md
.separador  { @include q-separator; }   // border-bottom sutil
.con-foco   { @include q-focus-ring; }  // glow azul de accesibilidad
```

---

## Sombras

| Token | Valor | Uso |
|---|---|---|
| `--q-shadow-sm` | `0 2px 4px rgba(0,0,0,0.1)` | Nav-bar fija, elementos menores |
| `--q-shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards, snackbars |
| `--q-shadow-lg` | `0 10px 30px rgba(0,74,153,0.08)` | Cards destacadas, modales |
| `--q-shadow-xl` | `0 15px 25px rgba(0,74,153,0.15)` | Elevación máxima (logos, hero) |
| `--q-shadow-focus` | `0 0 0 3px rgba(41,121,255,0.1)` | Anillo de foco (accesibilidad) |
| `--q-shadow-drag` | Compuesta | Elemento en arrastre (CDK Drag) |

---

## Z-index

| Token | Valor | Uso |
|---|---|---|
| `--q-z-navbar` | 1020 | Barra de navegación |
| `--q-z-edit-bar` | 1030 | Barra de modo edición |
| `--q-z-overlay` | 2000 | Overlays de CDK, modales |
| `--q-z-spinner` | 9999 | Spinner de carga global |

---

## Bootstrap

### Clases permitidas (layout)

```html
<!-- ✅ Grid -->
<div class="container">
  <div class="row g-4">
    <div class="col-12 col-md-6 col-lg-4">...</div>
  </div>
</div>

<!-- ✅ Flexbox -->
<div class="d-flex align-items-center justify-content-between gap-3">...</div>

<!-- ✅ Responsive / Display -->
<div class="d-none d-md-block">Solo visible en desktop</div>

<!-- ✅ Spacing (layout) -->
<div class="mt-4 mb-3 py-5">...</div>
```

### Clases prohibidas (usar tokens en su lugar)

```html
<!-- ❌ Color → usar q-text-* o var(--q-*) -->
<p class="text-primary">...</p>     <!-- Usar: class="q-text-primary" -->
<p class="text-muted">...</p>       <!-- Usar: class="q-text-muted" -->
<div class="bg-white">...</div>     <!-- Usar: class="q-bg-white" -->

<!-- ❌ Tipografía → usar tokens o mixins -->
<span class="fw-bold">...</span>    <!-- Usar: class="q-fw-bold" -->
<span class="fs-5">...</span>       <!-- Usar: font-size: var(--q-fs-lg) en SCSS -->

<!-- ❌ Bordes visuales → usar tokens -->
<div class="rounded">...</div>      <!-- Usar: border-radius: var(--q-radius-sm) en SCSS -->
<div class="shadow">...</div>       <!-- Usar: box-shadow: var(--q-shadow-md) en SCSS -->
```

---

## Soporte para Temas

La arquitectura de tokens soporta múltiples temas. El tema se activa con un atributo `data-theme` en el `<html>`:

```scss
// Ejemplo: tema oscuro (futuro)
[data-theme="dark"] {
  // Semánticos de texto
  --q-text-primary: var(--q-gray-100);
  --q-text-secondary: var(--q-gray-400);
  // Superficies
  --q-surface: #1a1a2e;
  --q-surface-variant: #16213e;
  --q-border-color: rgba(255, 255, 255, 0.1);
  // Complementarios (pueden ser otros colores)
  --q-comp-1: #e040fb;
  --q-comp-1-bg: rgba(224, 64, 251, 0.15);
  // Semánticos (independientes de complementarios)
  --q-success: #66bb6a;
  --q-danger: #ef5350;
}
```

Los componentes que usan tokens semánticos (`--q-text-primary`, `--q-surface`, etc.) se adaptarán automáticamente sin modificar su SCSS.

> **Regla**: Usar siempre tokens **semánticos** (texto, superficie, borde) en componentes. Los tokens de **valor** (grises, primarios) solo deben usarse en `_tokens.scss` para definir la capa semántica.
>
> **Complementarios vs Semánticos**: En un cambio de tema, los complementarios (`--q-comp-*`) y los semánticos (`--q-success`, `--q-danger`, etc.) se pueden cambiar de forma **independiente**. Hoy coinciden, en otro tema pueden no coincidir.

---

## Imágenes e Ilustraciones

El manejo de activos gráficos estáticos (logos, fondos, ilustraciones) está centralizado en `src/app/core/config/illustrations.config.ts`.

1. **No uses rutas absolutas de assets en SCSS (`url(...)`)**: Los fondos estáticos no deben fijarse en SCSS debido a que dificulta el manejo de temas y portabilidad.
2. **No uses rutas absolutas en Templates**: Utiliza la constante `SECTION_GRAPHICS` expuesta en el componente para acceder a rutas como `graphics.logoMain` o `graphics.hero`.
3. **Inyección de fondos (Backgrounds)**: Delega el fondo dinámico a través de CSS Variables inyectadas por Angular.
   ```html
   <div class="mi-panel" [style.--panel-bg]="'url(' + graphics.background + ')'"></div>
   ```
   ```scss
   .mi-panel { background-image: var(--panel-bg); }
   ```

---

## Iconos Semánticos

El sistema de íconos de la aplicación se gestiona mediante tokens semánticos centralizados en `src/app/core/config/icons.config.ts`.

1. **Prohibido usar nombres de íconos literales**: No utilizar cadenas directas (ej. `name="ionCloseOutline"`) en los templates. Esto acopla la vista a la librería específica.
2. **Prohibido importar íconos en componentes**: No usar `provideIcons` a nivel de componente. Todos los íconos requeridos se registran globalmente en `app.config.ts`.
3. **Uso obligatorio de `APP_ICONS`**: Inyectar la constante `APP_ICONS` (`protected readonly icons = APP_ICONS;`) en el componente y utilizarla para referenciar los íconos semánticamente en el template.

```html
<!-- ❌ Prohibido: Literal hardcodeado (depende de la librería subyacente) -->
<ng-icon name="ionSearchOutline"></ng-icon>

<!-- ✅ Correcto: Uso de token semántico (agnóstico) -->
<ng-icon [name]="icons.actions.search"></ng-icon>
```

---

## Reglas Generales

1. **Prohibido** usar colores hex en hojas de estilos de componentes
2. **Prohibido** usar `font-size` o `font-weight` con valores literales
3. **Prohibido** usar `border-radius` o `box-shadow` con valores literales
4. **Prohibido** usar clases Bootstrap de color, tipografía o bordes visuales
5. **Preferir** mixins (`@include q-heading-2`) sobre tokens individuales cuando la combinación existe
6. **Preferir** tokens semánticos (`--q-text-primary`) sobre tokens de valor (`--q-gray-800`)
7. **Documentar** todo en español (JSDoc, comentarios, SCSS)
8. **BEM** para nomenclatura de clases CSS
9. **Overrides de Material**: centralizar en `src/theme/_material.scss`, no en componentes
10. **`::ng-deep`**: evitar — usar `_material.scss` para overrides globales de Material
