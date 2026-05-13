# Sistema Tipográfico — Quipu

## Índice

1. [Cómo funciona](#cómo-funciona)
2. [Arquitectura técnica](#arquitectura-técnica)
3. [Por qué es una elección superadora](#por-qué-es-una-elección-superadora)
4. [Escala tipográfica completa](#escala-tipográfica-completa)
5. [Guía para el diseñador](#guía-para-el-diseñador)
6. [Cómo agregar un tamaño custom](#cómo-agregar-un-tamaño-custom)
7. [Accesibilidad (WCAG)](#accesibilidad-wcag)

---

## Cómo funciona

### El problema de los tamaños fijos

En la web, `1rem = 16px` (tamaño por defecto del navegador). Cuando se escribe `font-size: 2rem`, el navegador calcula `16 × 2 = 32px`. Ese valor es **fijo** — se renderiza igual en un celular de 375px que en un monitor de 2560px.

Para texto de cuerpo (16px) esto es correcto. Pero para headings grandes es un problema:

- Un H1 de 40px se ve proporcionado en desktop pero **devora la pantalla** en un celular
- Un H1 de 28px se ve bien en móvil pero **tímido** en desktop

La solución es que los headings **escalen fluidamente** según el ancho de la pantalla.

### Escalado fluido con RFS

Nuestro sistema utiliza **RFS (Responsive Font Sizes)** de Bootstrap 5. Cuando un mixin de heading se compila, no genera un valor fijo:

```scss
// Lo que escribimos en SCSS:
.titulo { @include q-heading-2; }

// Lo que genera Bootstrap RFS en el CSS final:
.titulo {
  font-size: calc(1.325rem + 0.9vw);   // ← Fluido: interpola entre 25px y 32px
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
```

La fórmula `calc(Xrem + Yvw)` hace que el tamaño **interpole suavemente** entre un mínimo (en pantallas de ~375px) y un máximo (en pantallas de ≥1200px). No hay saltos bruscos entre breakpoints.

**Regla clave**: RFS solo escala valores mayores a `1.25rem` (20px). Todo lo que sea ≤20px permanece fijo. Esto es correcto: body text, labels y captions no necesitan adaptarse al viewport.

### Qué escala y qué no

| Nivel | ¿Escala? | Móvil (375px) | Desktop (1200px+) |
|---|---|---|---|
| H1 (2.5rem) | ✅ Sí | ~28px | 40px |
| H2 (2rem) | ✅ Sí | ~25px | 32px |
| H3 (1.75rem) | ✅ Sí | ~22px | 28px |
| H4 (1.5rem) | ✅ Sí | ~20px | 24px |
| H5 (1.25rem) | ✅ Sí (mínimo) | ~18px | 20px |
| Body (1rem) | ❌ Fijo | 16px | 16px |
| Small (0.875rem) | ❌ Fijo | 14px | 14px |
| Caption (0.75rem) | ❌ Fijo | 12px | 12px |

---

## Arquitectura técnica

### Cadena de dependencias

```
Bootstrap RFS (vendor/_rfs.scss)
  └── Provee el mixin font-size() que genera calc()
        │
Nuestros mixins (_typography.scss)
  └── q-heading-1 combina:
        ├── @include font-size(2.5rem)     ← RFS genera el calc()
        ├── font-weight: var(--q-fw-bold)  ← Token propio
        ├── line-height: var(--q-lh-tight) ← Token propio
        └── letter-spacing: var(--q-ls-tight) ← Token propio
              │
Componentes (.scss)
  └── .titulo { @include q-heading-2; }  ← Una sola línea
```

### Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/theme/_tokens.scss` | Define los valores de referencia (`--q-fs-*`, `--q-fw-*`, `--q-lh-*`, `--q-ls-*`) |
| `src/theme/_typography.scss` | Define los mixins que combinan tamaño + peso + line-height + letter-spacing |
| `src/theme/themes.scss` | Importa `_type.scss` de Bootstrap (activa RFS en tags `<h1>`–`<h6>` nativos) |
| `node_modules/bootstrap/scss/vendor/_rfs.scss` | Motor de escalado fluido (no lo tocamos) |

### Qué reutilizamos de Bootstrap

1. **El mixin `font-size()`** — Genera la fórmula `calc()` responsive
2. **El módulo `_type.scss`** — Aplica RFS a los tags HTML nativos (`<h1>`–`<h6>`)
3. **Las variables de calibración** (`$rfs-base-value: 1.25rem`, `$rfs-breakpoint: 1200px`) — Definen el umbral de escalado y el punto máximo

### Qué personalizamos nosotros

1. **Los valores de la escala** — Nuestros tokens definen qué tamaño corresponde a cada nivel
2. **Line-heights pareados** — Bootstrap usa `1.2` para todos los headings; nosotros diferenciamos `1.2` (tight, H1-H3) y `1.3` (snug, H4-H5)
3. **Letter-spacing** — Bootstrap no define letter-spacing; nosotros usamos `-0.02em` (headings grandes), `0` (body) y `0.025em` (captions)
4. **Mixins compuestos** — Bootstrap solo maneja `font-size`; nuestros mixins agrupan las 4 propiedades tipográficas

---

## Por qué es una elección superadora

### vs. Tamaños fijos del diseñador

| Aspecto | Tamaños fijos (px) | Nuestro sistema |
|---|---|---|
| Adaptación a móvil | ❌ Requiere media queries manuales | ✅ Automático |
| Coherencia | ⚠️ Depende de disciplina humana | ✅ Forzada por la escala |
| Mantenimiento | ❌ Cambiar un tamaño = editar N archivos | ✅ Cambiar un token = afecta todo |
| Accesibilidad | ⚠️ Fácil olvidar contrastes y mínimos | ✅ Tamaños mínimos validados |
| Soporte temas | ❌ No previsto | ✅ Tokens re-apuntables |

### vs. Definir escalado propio con `clamp()`

| Aspecto | `clamp()` manual | Nuestro sistema (RFS) |
|---|---|---|
| Complejidad | Alta — hay que calcular cada `clamp()` | ✅ Baja — RFS lo genera |
| Consistencia | ⚠️ Fácil desalinear valores | ✅ Algoritmo uniforme |
| Dependencia | Ninguna | Bootstrap (ya incluido) |
| Resultado | Idéntico si se calcula bien | ✅ Idéntico, sin esfuerzo |

### vs. Usar Bootstrap puro sin tokens

| Aspecto | Bootstrap puro | Nuestro sistema |
|---|---|---|
| Escalado responsive | ✅ Sí (RFS) | ✅ Sí (RFS) |
| Line-height pareado | ❌ Único (1.2) para todos | ✅ Diferenciado (1.2 / 1.3) |
| Letter-spacing | ❌ No incluido | ✅ Incluido |
| Semántica propia | ❌ Clases genéricas (`.h1`, `.lead`) | ✅ Mixins con significado (`q-heading-2`) |
| Control de escala | ⚠️ Hay que sobreescribir variables SASS | ✅ Tokens CSS propios |
| Soporte temas | ⚠️ Parcial (solo colores vía CSS vars) | ✅ Completo (toda la tipografía en vars) |

---

## Escala tipográfica completa

### Tokens de referencia (`_tokens.scss`)

```scss
// Tamaños (usados como referencia, los mixins de heading usan RFS directo)
--q-fs-3xl: 2.5rem;     // 40px — H1
--q-fs-2xl: 2rem;        // 32px — H2
--q-fs-xl: 1.75rem;      // 28px — H3
--q-fs-lg: 1.5rem;       // 24px — H4
--q-fs-md: 1.25rem;      // 20px — H5 / Lead
--q-fs-base: 1rem;       // 16px — Body
--q-fs-sm: 0.875rem;     // 14px — Small
--q-fs-xs: 0.75rem;      // 12px — Caption

// Pesos
--q-fw-regular: 400;     // Cuerpo de texto
--q-fw-medium: 500;      // Etiquetas, botones
--q-fw-semibold: 600;    // Subtítulos, campos
--q-fw-bold: 700;        // Títulos principales

// Line-height
--q-lh-tight: 1.2;       // Headings grandes (H1-H3)
--q-lh-snug: 1.3;        // Headings medianos (H4-H5)
--q-lh-normal: 1.5;      // Body text
--q-lh-relaxed: 1.6;     // Párrafos largos

// Letter-spacing
--q-ls-tight: -0.02em;   // Headings grandes (compacta visualmente)
--q-ls-normal: 0;         // Body
--q-ls-wide: 0.025em;    // Captions, labels uppercase
```

### Mixins disponibles (`_typography.scss`)

| Mixin | Tamaño | Peso | Line-height | Letter-spacing | ¿RFS? |
|---|---|---|---|---|---|
| `q-heading-1` | 2.5rem (40px) | 700 (bold) | 1.2 (tight) | -0.02em | ✅ |
| `q-heading-2` | 2rem (32px) | 600 (semibold) | 1.2 (tight) | -0.02em | ✅ |
| `q-heading-3` | 1.75rem (28px) | 500 (medium) | 1.2 (tight) | -0.02em | ✅ |
| `q-heading-4` | 1.5rem (24px) | 600 (semibold) | 1.3 (snug) | — | ✅ |
| `q-heading-5` | 1.25rem (20px) | 500 (medium) | 1.3 (snug) | — | ✅ |
| `q-body` | 1rem (16px) | 400 (regular) | 1.5 (normal) | — | ❌ |
| `q-body-sm` | 0.875rem (14px) | 400 (regular) | 1.5 (normal) | — | ❌ |
| `q-caption` | 0.75rem (12px) | 400 (regular) | 1.3 (snug) | 0.025em | ❌ |
| `q-label` | 0.875rem (14px) | 500 (medium) | 1.5 (normal) | — | ❌ |
| `q-code` | 0.875rem (14px) | — | 1.5 (normal) | — | ❌ |
| `q-lead` | 1.25rem (20px) | 400 (regular) | 1.6 (relaxed) | — | ✅ |

### Uso en componentes

```scss
// Opción 1: Mixin completo (preferido cuando la combinación existe)
.titulo { @include q-heading-2; }

// Opción 2: Tokens individuales (cuando se necesita personalizar)
.mi-texto {
  font-size: var(--q-fs-sm);
  font-weight: var(--q-fw-medium);
  line-height: var(--q-lh-normal);
}

// Opción 3: Token de tamaño + mixin RFS (para tamaños custom responsive)
.subtitulo {
  @include font-size(1.375rem);  // Bootstrap RFS genera calc() responsive
  font-weight: var(--q-fw-semibold);
}
```

---

## Guía para el diseñador

### Cuando dice "este texto está chico" o "está grande"

#### Paso 1 — Preguntar en qué dispositivo

El texto tiene tamaños distintos según la pantalla. Un heading puede ser 25px en móvil y 32px en desktop. Si lo ve chico en Figma (que trabaja en tamaños fijos), puede que en el navegador se vea bien.

#### Paso 2 — Mostrar la escala y pedir que elija un nivel

No existen tamaños intermedios arbitrarios. La escala tiene niveles discretos:

| Nivel | Desktop | Móvil | Cuándo usarlo |
|---|---|---|---|
| **H1** | 40px | ~28px | Título principal de una página |
| **H2** | 32px | ~25px | Título de una sección grande |
| **H3** | 28px | ~22px | Subtítulo dentro de una sección |
| **H4** | 24px | ~20px | Título de una card, modal o panel |
| **H5** | 20px | ~18px | Título de un panel lateral o subsección |
| **Body** | 16px | 16px | Texto general, inputs |
| **Small** | 14px | 14px | Metadatos, botones, etiquetas |
| **Caption** | 12px | 12px | Notas al pie, timestamps |

**Frase sugerida**: *"¿Cuál de estos niveles querés que use? Si me decís 'un poco más grande que body', la respuesta es H5 (20px). No hay 17px ni 19px porque una escala con saltos armónicos mantiene la coherencia visual en toda la app."*

#### Paso 3 — Si ningún nivel funciona

Ver la sección [Cómo agregar un tamaño custom](#cómo-agregar-un-tamaño-custom).

#### Paso 4 — Si el problema no es el tamaño sino el peso o espaciado

A veces el texto no se ve "chico" por su tamaño sino por su peso (`400` vs `600`) o su line-height. Antes de cambiar el tamaño:

- ¿Necesita más peso? Cambiar `--q-fw-regular` por `--q-fw-medium` o `--q-fw-semibold`
- ¿Las líneas están muy juntas? Revisar que use `--q-lh-normal` (1.5) para body o `--q-lh-relaxed` (1.6) para párrafos largos
- ¿Las letras están muy pegadas? Agregar `letter-spacing: var(--q-ls-wide)` para abrir el texto

**Frase sugerida**: *"Antes de aumentar el tamaño, probemos cambiar el peso de fuente. A veces un texto en 500 (medium) se percibe más grande que uno en 400 (regular) del mismo tamaño."*

---

## Cómo agregar un tamaño custom

Si la escala existente no satisface un requerimiento legítimo de diseño, se puede agregar un nivel. Pero hay un protocolo:

### 1. Validar que sea un nuevo nivel de la escala, no un parche

Preguntas de validación:
- ¿Se va a usar en **más de un componente**? Si es solo para un lugar, no es un nivel de escala — es un ajuste puntual que va en el SCSS del componente
- ¿Se puede resolver con un nivel existente + cambio de peso/spacing? Si sí, no agregar un nivel nuevo
- ¿Encaja armónicamente entre los niveles existentes? El ratio entre niveles consecutivos debería ser consistente (~1.2–1.33×)

### 2. Definir las 7 propiedades

Un nuevo nivel de la escala requiere definir:

| Propiedad | Qué especificar |
|---|---|
| `font-size` | Valor en rem (ej: `1.375rem` = 22px) |
| `line-height` | Proporción unitless (entre 1.2 y 1.6 según el contexto) |
| `font-weight` | 400, 500, 600 o 700 |
| `letter-spacing` | Em negativo para grandes, positivo para chicos, 0 para medios |
| `¿Escala con RFS?` | Sí si es ≥20px, No si es <20px |
| `Nombre del nivel` | Ej: `body-lg`, `heading-6` |
| `Contexto de uso` | Dónde se usa (ej: "precio en cards de producto") |

### 3. Implementar

```scss
// 1. Agregar token en _tokens.scss
--q-fs-body-lg: 1.125rem;  // 18px

// 2. Agregar mixin en _typography.scss
@mixin q-body-lg {
  font-size: var(--q-fs-body-lg);
  font-weight: var(--q-fw-regular);
  line-height: var(--q-lh-normal);
}

// 3. Usar en el componente
.precio { @include q-body-lg; }
```

### 4. Verificar accesibilidad

Antes de mergear, verificar que el nuevo tamaño cumple los requisitos de la sección siguiente.

---

## Accesibilidad (WCAG)

### Tamaños mínimos

| Criterio WCAG | Requisito | Nuestra escala |
|---|---|---|
| **1.4.4 Resize Text** (AA) | El texto debe ser legible al 200% de zoom | ✅ Usamos `rem` — escala con zoom |
| **Texto mínimo** (recomendación) | ≥12px para texto funcional | ✅ Caption = 12px (mínimo) |
| **Texto preferido** (buena práctica) | ≥14px para texto que se lee regularmente | ✅ Body-sm = 14px |
| **Texto de cuerpo** (estándar) | 16px para lectura sostenida | ✅ Body = 16px |

### Contraste de color

| Criterio WCAG | Requisito | Cómo verificar |
|---|---|---|
| **1.4.3** (AA) | Ratio ≥ **4.5:1** para texto normal (<24px o <18.66px bold) | Verificar `--q-text-primary` sobre `--q-surface` |
| **1.4.3** (AA) | Ratio ≥ **3:1** para texto grande (≥24px o ≥18.66px bold) | Verificar headings sobre fondos claros |
| **1.4.6** (AAA) | Ratio ≥ **7:1** para texto normal | Nuestro `#181c32` sobre `#ffffff` = **16.3:1** ✅ |

Herramienta recomendada: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Contrastes de nuestros tokens

| Texto sobre fondo blanco | Hex | Ratio | Nivel |
|---|---|---|---|
| `--q-text-primary` (`--q-gray-800`) | `#181c32` | **16.3:1** | ✅ AAA |
| `--q-text-secondary` (`--q-gray-600`) | `#757575` | **4.6:1** | ✅ AA |
| `--q-text-muted` (`--q-gray-500`) | `#94a3b8` | **3.0:1** | ⚠️ Solo grande |
| `--q-text-disabled` (`--q-gray-400`) | `#bdbdbd` | **1.9:1** | ❌ Decorativo |
| `--q-primary` | `#2979ff` | **3.5:1** | ⚠️ Solo grande |

> **Regla**: `--q-text-muted` y `--q-primary` solo pasan AA cuando el texto es **grande** (≥24px o ≥18.66px bold). Para texto body regular (16px), usar `--q-text-primary` o `--q-text-secondary`.

### Line-height y legibilidad

| Criterio WCAG | Requisito | Nuestra escala |
|---|---|---|
| **1.4.12** (AA) | Line-height ≥ 1.5× para body text | ✅ `--q-lh-normal: 1.5` |
| **Buena práctica** | Line-height ≥ 1.2× para headings | ✅ `--q-lh-tight: 1.2` |
| **1.4.12** (AA) | Letter-spacing ajustable por usuario | ✅ Usamos `em` (relativo) |

### Unidades relativas

Toda la escala usa `rem` (relativo al tamaño base del navegador). Si un usuario configura su navegador para que el tamaño base sea 18px en lugar de 16px, toda nuestra escala se ajusta proporcionalmente. Esto es un requisito de WCAG 1.4.4.

**Nunca usar `px` para `font-size`** en producción. Los `px` que aparecen en la documentación son solo de referencia para comunicación con diseño.
