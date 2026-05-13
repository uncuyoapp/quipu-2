# Sistema de Colores — Quipu

## Índice

1. [Cómo funciona](#cómo-funciona)
2. [Arquitectura de capas](#arquitectura-de-capas)
3. [Catálogo completo de tokens](#catálogo-completo-de-tokens)
4. [Complementarios vs Semánticos](#complementarios-vs-semánticos)
5. [Paleta de temáticas](#paleta-de-temáticas)
6. [Guía para el diseñador](#guía-para-el-diseñador)
7. [Cómo agregar un color](#cómo-agregar-un-color)
8. [Soporte para temas](#soporte-para-temas)
9. [Accesibilidad (WCAG)](#accesibilidad-wcag)

---

## Cómo funciona

### El problema de los colores dispersos

En una aplicación sin sistema, cada componente define sus propios colores:

```scss
// nav-bar.scss
.nav { background: #004a99; }

// button.scss
.btn-primary { background: #2979ff; }

// card.scss
.card-border { border-color: #e0e0e0; }
.card-text { color: #464646; }
```

Esto genera:
- **Inconsistencia**: 18+ variaciones de gris usadas indistintamente
- **Imposibilidad de theming**: cambiar la paleta requiere editar 35+ archivos
- **Fragilidad**: un color "parecido" se copia con variaciones sutiles que rompen la coherencia

### La solución: Design Tokens centralizados

Todos los colores se definen en un único archivo (`src/theme/_tokens.scss`) como CSS custom properties. Los componentes **nunca** usan valores hex directamente:

```scss
// ✅ Correcto
.card-text { color: var(--q-text-primary); }

// ❌ Prohibido
.card-text { color: #464646; }
```

---

## Arquitectura de capas

El sistema de colores tiene **tres capas** con responsabilidades distintas:

```
┌─────────────────────────────────────────────────┐
│  CAPA 1 — Valores                               │
│  Definiciones absolutas de color                 │
│  --q-gray-800: #181c32                          │
│  --q-primary: #2979ff                           │
│  --q-comp-1: #ff3e84                            │
│  → Solo se usan DENTRO de _tokens.scss          │
└──────────────────────┬──────────────────────────┘
                       │ referencia
┌──────────────────────▼──────────────────────────┐
│  CAPA 2 — Semántica                              │
│  Asignación de significado                       │
│  --q-text-primary: var(--q-gray-800)            │
│  --q-surface: var(--q-white)                    │
│  --q-danger: #ff3e84                             │
│  → Es lo que se re-apunta al cambiar de tema    │
└──────────────────────┬──────────────────────────┘
                       │ uso
┌──────────────────────▼──────────────────────────┐
│  CAPA 3 — Componentes                           │
│  Consumo final                                   │
│  .titulo { color: var(--q-text-primary); }      │
│  .alerta { background: var(--q-danger-bg); }    │
│  → NUNCA tocan la Capa 1 directamente           │
└─────────────────────────────────────────────────┘
```

### ¿Por qué tres capas?

Cuando se cambia de tema, solo se modifica la **Capa 2**:

```scss
// Tema por defecto (light)
:root {
  --q-text-primary: var(--q-gray-800);  // Texto oscuro sobre fondo claro
  --q-surface: var(--q-white);          // Fondo blanco
}

// Tema oscuro — solo cambia la Capa 2
[data-theme="dark"] {
  --q-text-primary: var(--q-gray-100);  // Texto claro sobre fondo oscuro
  --q-surface: #1a1a2e;                 // Fondo oscuro
}
```

Los componentes no necesitan saber qué tema está activo. Siguen usando `var(--q-text-primary)` y el color se resuelve según el contexto.

### Cuándo usar cada capa

| Situación | Capa correcta | Ejemplo |
|---|---|---|
| Definir el hex de un color | Capa 1 (solo en `_tokens.scss`) | `--q-gray-600: #707070` |
| Asignar un significado funcional | Capa 2 (solo en `_tokens.scss`) | `--q-text-secondary: var(--q-gray-600)` |
| Aplicar color en un componente | Capa 3 (en el `.scss` del componente) | `color: var(--q-text-secondary)` |
| Override de Material Design | Capa 3 (en `_material.scss`) | `background: var(--q-surface)` |

---

## Catálogo completo de tokens

### Marca e identidad

| Token | Valor | Uso | Contraste sobre blanco |
|---|---|---|---|
| `--q-brand` | `#004a99` | Logo, identidad institucional, navbar | 7.2:1 ✅ AA |
| `--q-brand-light` | `rgba(0,74,153,0.05)` | Fondo sutil de marca | — |

### Primarios (interacción UI)

| Token | Valor | Uso |
|---|---|---|
| `--q-primary` | `#2979ff` | Botones, enlaces, estados activos |
| `--q-primary-dark` | `#2073ed` | Hover sobre primario |
| `--q-primary-darker` | `#2067ce` | Active/pressed sobre primario |
| `--q-primary-light` | `#b0cdfc` | Bordes activos, acentos suaves |
| `--q-primary-bg` | `#dfebff` | Fondos informativos, chips, badges |

### Complementarios (paleta decorativa)

Colores decorativos utilizados para temáticas, categorías y acentos visuales. Los nombres son **neutros** (numerados) porque en otro tema los colores pueden ser completamente distintos.

| Token | Valor actual | Variante clara | Uso actual |
|---|---|---|---|
| `--q-comp-1` | `#ff3e84` | `--q-comp-1-bg`: `#ffd9ea` | Temática 1, rosa/magenta |
| `--q-comp-2` | `#fab217` | `--q-comp-2-bg`: `#ffedca` | Temática 2, ámbar |
| `--q-comp-3` | `#70cacd` | `--q-comp-3-bg`: `#caede8` | Temática 3, teal |

> **Importante**: En el tema actual, los complementarios **coinciden** con los colores semánticos (comp-1 ≈ danger, comp-2 ≈ warning, comp-3 ≈ success). Esta coincidencia **no es estructural** — es una decisión de diseño del tema actual. En otro tema, los complementarios podrían ser violeta, naranja y verde mientras los semánticos se mantienen en rojo/amarillo/verde estándar.

### Semánticos (estados del sistema)

Colores con **significado funcional fijo**. Comunican estados del sistema al usuario. Tienen valores propios (no referencian a complementarios) para poder evolucionar de forma independiente.

| Token | Valor | Fondo | Significado |
|---|---|---|---|
| `--q-success` | `#70cacd` | `--q-success-bg`: `#caede8` | Operación exitosa, estado positivo |
| `--q-warning` | `#fab217` | `--q-warning-bg`: `#ffedca` | Atención requerida, estado intermedio |
| `--q-danger` | `#ff3e84` | `--q-danger-bg`: `#ffd9ea` | Error, acción destructiva, eliminación |
| `--q-info` | `#2979ff` | `--q-info-bg`: `#dfebff` | Información contextual, ayuda |
| `--q-highlight` | `#fff59d` | — | Resaltado de coincidencias (search/autocomplete) |

#### Colores de SnackBar (variantes oscuras para fondo)
| Token | Valor | Uso |
|---|---|---|
| `--q-snack-success` | `#2e7d32` | Fondo de snackbar de éxito |
| `--q-snack-error` | `#d32f2f` | Fondo de snackbar de error |
| `--q-snack-warn` | `#ed6c02` | Fondo de snackbar de advertencia |

> **¿Por qué colores distintos para snackbars?** Los snackbars tienen texto blanco sobre fondo de color. Los colores semánticos estándar (`#70cacd`, `#fab217`) no tienen suficiente contraste con texto blanco. Los colores de snackbar son variantes más oscuras y saturadas que garantizan legibilidad (ratio ≥ 4.5:1).

### Texto

| Token | Resolución actual | Contraste sobre blanco | Uso |
|---|---|---|---|
| `--q-text-primary` | `var(--q-gray-800)` = `#181c32` | 16.3:1 ✅ AAA | Títulos, texto principal |
| `--q-text-secondary` | `var(--q-gray-600)` = `#707070` | 4.9:1 ✅ AA | Subtítulos, texto complementario |
| `--q-text-muted` | `var(--q-gray-500)` = `#94a3b8` | 3.0:1 ⚠️ Solo grande | Hints, placeholders, timestamps |
| `--q-text-disabled` | `var(--q-gray-400)` = `#cccccc` | 1.6:1 ❌ Decorativo | Elementos deshabilitados |
| `--q-text-link` | `var(--q-primary)` = `#2979ff` | 3.5:1 ⚠️ Solo grande | Enlaces |
| `--q-text-on-primary` | `var(--q-white)` = `#ffffff` | — | Texto sobre fondos de color |

### Superficies

| Token | Resolución actual | Uso |
|---|---|---|
| `--q-surface` | `var(--q-white)` = `#ffffff` | Fondo principal de la app, cards, modales |
| `--q-surface-variant` | `var(--q-gray-100)` = `#f5f5f5` | Fondos alternos, sidebars, áreas secundarias |
| `--q-surface-hover` | `var(--q-gray-200)` = `#e6e6e6` | Estado hover sobre superficies |

### Bordes

| Token | Resolución actual | Uso |
|---|---|---|
| `--q-border-color` | `var(--q-gray-200)` = `#e6e6e6` | Separadores sutiles entre secciones |
| `--q-border-color-strong` | `var(--q-gray-300)` = `#e0e0e0` | Bordes visibles de cards y paneles |
| `--q-border-color-input` | `var(--q-gray-300)` = `#e0e0e0` | Bordes de campos de formulario |

### Escala de grises

| Token | Valor | Nivel perceptual |
|---|---|---|
| `--q-gray-900` | `#000000` | ████████ Negro puro |
| `--q-gray-800` | `#181c32` | ███████░ Casi negro (texto principal) |
| `--q-gray-700` | `#404040` | ██████░░ Gris muy oscuro |
| `--q-gray-600` | `#707070` | █████░░░ Gris oscuro (texto secundario) |
| `--q-gray-500` | `#94a3b8` | ████░░░░ Gris medio (texto muted) |
| `--q-gray-400` | `#cccccc` | ███░░░░░ Gris claro (disabled) |
| `--q-gray-300` | `#e0e0e0` | ██░░░░░░ Gris muy claro (bordes) |
| `--q-gray-200` | `#e6e6e6` | █░░░░░░░ Casi blanco (hover, bordes sutiles) |
| `--q-gray-100` | `#f5f5f5` | ░░░░░░░░ Casi blanco (fondos alternos) |
| `--q-white` | `#ffffff` | ░░░░░░░░ Blanco puro |

---

## Complementarios vs Semánticos

### ¿Por qué están separados?

Pensemos en dos escenarios de tema:

**Tema actual (UNCuyo)**:
```
Complementarios: rosa (#ff3e84), ámbar (#fab217), teal (#70cacd)
Semánticos:      danger=rosa, warning=ámbar, success=teal
→ Coinciden
```

**Tema hipotético (otra universidad)**:
```
Complementarios: violeta (#7c3aed), naranja (#f97316), lima (#84cc16)
Semánticos:      danger=rojo (#ef4444), warning=amarillo (#eab308), success=verde (#22c55e)
→ No coinciden
```

Si los semánticos referenciaran a los complementarios (`--q-danger: var(--q-comp-1)`), al cambiar de tema el botón de "Eliminar" pasaría de rosa a violeta — lo cual rompe la convención universal de rojo = peligro.

### Regla de uso

| Contexto | ¿Qué usar? | Ejemplo |
|---|---|---|
| Un estado del sistema (éxito, error, advertencia) | **Semántico** | `color: var(--q-danger)` |
| Un color decorativo para categorías/temáticas | **Complementario** | `background: var(--q-comp-2)` |
| Un badge que dice "Peligro" | **Semántico** | `background: var(--q-danger-bg)` |
| Un chip que identifica una categoría temática | **Complementario** | `background: var(--q-comp-1-bg)` |
| Un ícono de estado en un formulario | **Semántico** | `color: var(--q-success)` |
| El color de fondo de una card de temática | **Complementario** | `border-left: 4px solid var(--q-comp-3)` |

---

## Paleta de temáticas

Las categorías temáticas de la aplicación reciben colores de forma cíclica desde una paleta de 4 colores:

```
Temática 1 → --q-comp-1 (#ff3e84)
Temática 2 → --q-comp-2 (#fab217)
Temática 3 → --q-comp-3 (#70cacd)
Temática 4 → --q-primary (#2979ff)
Temática 5 → --q-comp-1 (ciclo)
...
```

### Implementación técnica

La paleta se resuelve en runtime leyendo los tokens CSS:

```typescript
// ThematicStateService
private resolveThematicPalette(): string[] {
  const root = getComputedStyle(document.documentElement);
  return [
    root.getPropertyValue('--q-comp-1').trim() || '#ff3e84',
    root.getPropertyValue('--q-comp-2').trim() || '#fab217',
    root.getPropertyValue('--q-comp-3').trim() || '#70cacd',
    root.getPropertyValue('--q-primary').trim() || '#2979ff',
  ];
}
```

Los fallbacks (`|| '#ff3e84'`) existen como protección para SSR o contextos donde `getComputedStyle` no esté disponible.

### ¿Por qué se lee en runtime?

Porque los colores de temáticas se pasan como valor hex a los componentes de visualización (gráficos, tablas dinámicas). Estas librerías no entienden `var(--q-comp-1)` — necesitan el valor resuelto. Leerlo via `getComputedStyle` garantiza que se obtiene el valor del tema activo.

---

## Guía para el diseñador

### Cuando propone un color nuevo

#### Paso 1 — ¿Es un color existente?

Antes de agregar un color, verificar si ya existe en la paleta:

| Si el color se parece a... | Probablemente ya es... |
|---|---|
| Azul brillante | `--q-primary` |
| Azul oscuro/institucional | `--q-brand` |
| Rosa/magenta | `--q-comp-1` o `--q-danger` |
| Ámbar/dorado | `--q-comp-2` o `--q-warning` |
| Teal/turquesa | `--q-comp-3` o `--q-success` |
| Gris oscuro para texto | `--q-text-primary` o `--q-text-secondary` |
| Gris claro para fondos | `--q-surface-variant` |
| Gris para bordes | `--q-border-color` o `--q-border-color-strong` |

**Frase sugerida**: *"El color que proponés es muy similar a --q-comp-2 (#fab217). ¿Podemos usar ese token o necesitás un color distinto por un motivo funcional específico?"*

#### Paso 2 — ¿Es semántico o decorativo?

- **Semántico**: Comunica un estado (éxito, error, info). Tiene un significado universal que los usuarios reconocen.
- **Decorativo/Complementario**: Embellece, categoriza o diferencia visualmente. No tiene significado funcional intrínseco.

**Frase sugerida**: *"Este color, ¿comunica un estado del sistema (como éxito o error) o es para categorizar/decorar? Porque eso define dónde lo ubicamos en la arquitectura de tokens."*

#### Paso 3 — Verificar contraste

Todo color para texto debe cumplir ratios WCAG:
- **≥ 4.5:1** para texto normal (< 24px)
- **≥ 3:1** para texto grande (≥ 24px o ≥ 18.66px bold)

Herramienta: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Frase sugerida**: *"El color que proponés tiene un ratio de contraste de X:1 sobre fondo blanco. Para texto de este tamaño necesitamos al menos 4.5:1. ¿Podemos oscurecerlo un poco?"*

### Cuando dice "este color no se ve bien"

1. **¿En qué contexto?** Un color puede verse bien como fondo pero mal como texto (o viceversa). Verificar si se está usando en el contexto correcto.
2. **¿Es un problema de contraste?** Si el texto se ve "lavado" sobre un fondo, el ratio de contraste es bajo.
3. **¿Es un problema de saturación?** Los colores de la paleta del diseñador son bastante saturados. En fondos grandes, un color muy saturado puede ser agresivo — para eso existen las variantes `*-bg` (versiones desaturadas).

---

## Cómo agregar un color

### 1. Validar la necesidad

Preguntas de validación:
- ¿Se puede resolver con un token existente? → No agregar
- ¿Se usa en más de un componente? → Es candidato a token
- ¿Es solo para un componente específico? → Dejarlo como variable local en ese componente
- ¿Tiene un significado funcional (estado)? → Va como semántico
- ¿Es decorativo/categorizador? → Va como complementario (y evaluar si los 3 actuales son suficientes)

### 2. Definir token y variantes

Todo color nuevo necesita:

| Propiedad | Obligatorio | Ejemplo |
|---|---|---|
| Color base | ✅ | `--q-nuevo: #7c3aed` |
| Variante de fondo (clara) | ✅ Si se usa en badges/chips | `--q-nuevo-bg: #ede9fe` |
| Nombre semántico | ✅ | Descriptivo del uso, no del color |
| Contraste verificado | ✅ | Ratio sobre `--q-surface` y `--q-surface-variant` |

### 3. Implementar

```scss
// 1. Agregar en _tokens.scss, en la sección correspondiente
--q-nuevo-estado: #7c3aed;
--q-nuevo-estado-bg: #ede9fe;

// 2. Usar en componentes
.estado-custom { 
  color: var(--q-nuevo-estado);
  background: var(--q-nuevo-estado-bg);
}
```

### 4. Actualizar documentación

Agregar el nuevo token a:
- `STYLE_GUIDE.md` — En la tabla de la categoría correspondiente
- Este documento (`docs/color-system.md`) — En el catálogo

---

## Soporte para temas

### Estructura de un tema

Un tema redefine **solo los tokens de Capa 2** (semánticos). Los de Capa 1 (valores) pueden agregarse nuevos si el tema necesita colores que no existen en la paleta base.

```scss
// _tokens.scss — Tema por defecto
:root {
  // Capa 1: Valores
  --q-primary: #2979ff;
  --q-comp-1: #ff3e84;
  --q-gray-800: #181c32;

  // Capa 2: Semántica
  --q-text-primary: var(--q-gray-800);
  --q-surface: var(--q-white);
  --q-danger: #ff3e84;
}

// Tema alternativo — solo Capa 2
[data-theme="dark"] {
  --q-text-primary: var(--q-gray-100);  // Re-apuntado
  --q-surface: #1a1a2e;                 // Valor nuevo
  --q-danger: #ef5350;                  // Valor propio
  --q-comp-1: #e040fb;                  // Complementario distinto
}
```

### Qué se puede cambiar por tema

| Categoría | ¿Cambiable? | Notas |
|---|---|---|
| Primarios | ✅ | Otra institución puede tener otro color principal |
| Complementarios | ✅ | Los 3 decorativos pueden ser totalmente distintos |
| Semánticos | ✅ | Pueden cambiar independiente de complementarios |
| Texto | ✅ | Se re-apuntan a otros grises |
| Superficies | ✅ | Fondos claros ↔ oscuros |
| Bordes | ✅ | Adaptar a contraste del tema |
| Grises (Capa 1) | ⚠️ Raro | La escala de grises suele mantenerse |
| SnackBar | ⚠️ Raro | Podrían adaptarse a fondo oscuro |

### Cómo la paleta de temáticas se adapta

Al cambiar `--q-comp-*` en un tema, `ThematicStateService.resolveThematicPalette()` lee automáticamente los nuevos valores porque usa `getComputedStyle`. No se necesita cambiar código TypeScript.

---

## Accesibilidad (WCAG)

### Requisitos de contraste

| Criterio WCAG | Texto | Ratio mínimo |
|---|---|---|
| **1.4.3** (AA) | Normal (< 24px o < 18.66px bold) | **4.5:1** |
| **1.4.3** (AA) | Grande (≥ 24px o ≥ 18.66px bold) | **3:1** |
| **1.4.6** (AAA) | Normal | **7:1** |
| **1.4.11** (AA) | Componentes UI y gráficos | **3:1** |

### Contrastes de nuestros tokens sobre fondo blanco (#ffffff)

| Token | Hex | Ratio | Nivel | ¿Apto para texto normal? |
|---|---|---|---|---|
| `--q-text-primary` | `#181c32` | **16.3:1** | ✅ AAA | Sí |
| `--q-text-secondary` | `#707070` | **4.9:1** | ✅ AA | Sí |
| `--q-text-muted` | `#94a3b8` | **3.0:1** | ⚠️ AA Large | Solo ≥24px o bold ≥18.66px |
| `--q-text-disabled` | `#cccccc` | **1.6:1** | ❌ | Solo decorativo |
| `--q-primary` | `#2979ff` | **3.5:1** | ⚠️ AA Large | Solo ≥24px o bold ≥18.66px |
| `--q-brand` | `#004a99` | **7.2:1** | ✅ AAA | Sí |
| `--q-danger` | `#ff3e84` | **3.9:1** | ⚠️ AA Large | Solo ≥24px o bold ≥18.66px |
| `--q-warning` | `#fab217` | **2.1:1** | ❌ | Solo como fondo/icono |
| `--q-success` | `#70cacd` | **2.5:1** | ❌ | Solo como fondo/icono |

### Implicaciones prácticas

1. **`--q-text-muted` no es apto para texto body regular (16px)**. Usarlo solo en texto ≥24px, bold ≥18.66px, o en contextos donde el texto es complementario (timestamps, hints que no son críticos para el usuario).

2. **`--q-primary` como color de texto requiere cuidado**. En enlaces y botones de texto, funciona si el texto es bold o grande. Para texto regular de 14px, preferir `--q-brand` (#004a99, ratio 7.2:1).

3. **Los colores semánticos (`success`, `warning`, `danger`) no son aptos como color de texto normal**. Usarlos como:
   - Color de fondo con texto oscuro encima: `background: var(--q-danger-bg); color: var(--q-text-primary);`
   - Color de íconos (los íconos tienen contraste por forma, no solo por color)
   - Bordes indicativos: `border-left: 3px solid var(--q-danger);`

4. **Los colores de SnackBar sí son aptos para texto blanco encima** — fueron elegidos específicamente para eso:
   - `--q-snack-success` (#2e7d32) sobre blanco: 6.5:1 ✅
   - `--q-snack-error` (#d32f2f) sobre blanco: 4.6:1 ✅
   - `--q-snack-warn` (#ed6c02) sobre blanco: 3.1:1 ⚠️ (borderline)

### Herramientas de verificación

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — Verificación rápida de ratio
- [Accessible Colors](https://accessible-colors.com/) — Sugiere ajustes al color más cercano que cumple
- Chrome DevTools → Inspect → el selector de color muestra el ratio de contraste en vivo
