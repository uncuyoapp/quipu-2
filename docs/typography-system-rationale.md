# Sistema Tipográfico Web — Consideraciones de implementación

## Contexto

Este documento detalla las variables y complejidades que intervienen en la definición de un sistema tipográfico para una aplicación web responsive. El objetivo es fundamentar por qué adoptamos una escala tipográfica estandarizada (basada en Bootstrap 5 + RFS) en lugar de definir valores de tamaño de fuente completamente a medida.

---

## ¿Qué define un sistema tipográfico web?

Un sistema tipográfico no es solo una lista de tamaños. Para cada "estilo de texto" se deben definir **7 propiedades** que interactúan entre sí:

| Propiedad | Qué controla | Ejemplo |
|---|---|---|
| `font-size` | Tamaño visual del texto | `1.5rem` (24px) |
| `line-height` | Espacio vertical entre líneas | `1.25` (30px para 24px) |
| `font-weight` | Grosor del trazo | `600` (semi-bold) |
| `letter-spacing` | Espacio horizontal entre caracteres | `-0.02em` |
| `font-family` | Familia tipográfica | `Roboto`, `monospace` |
| **Escalado responsive** | Cómo se adapta a pantallas chicas/grandes | `clamp(1.25rem, 1rem + 0.75vw, 1.75rem)` |
| **Contraste de color** | Legibilidad sobre fondos claros/oscuros (WCAG) | Ratio mínimo 4.5:1 |

### Ejemplo: un solo "Heading 2"

Para que un título secundario funcione correctamente en web se necesita:

```
Heading 2:
  - Tamaño base: 24px (1.5rem)
  - Tamaño en móvil (<576px): 20px (escalado automático)
  - Tamaño en desktop (>1200px): 28px (escalado automático)
  - Line-height: 1.25 (30px efectivos en desktop)
  - Peso: 600
  - Letter-spacing: -0.01em (los títulos grandes se ven mejor con tracking negativo)
  - Margen inferior: proporcional al tamaño (ej: 0.5em)
  - Color: ratio ≥ 4.5:1 sobre fondo blanco (#181c32 = ratio 16.3:1 ✅)
```

Multiplicar esto por **6 niveles de heading + 4 estilos de body + 2 de caption + 1 de código** = **13 estilos tipográficos** × **7 propiedades** = **91 decisiones de diseño** que deben ser coherentes entre sí.

---

## ¿Qué resuelve una librería como Bootstrap?

Bootstrap 5 incluye un sistema llamado **RFS (Responsive Font Sizes)** que:

1. **Escala fluida**: Los headings se adaptan automáticamente al ancho del viewport usando `calc()`. Un H1 puede ser 28px en móvil y 40px en desktop, con una transición suave.

2. **Escala probada**: Los ratios entre tamaños siguen progresiones armónicas validadas por años de uso en millones de sitios.

3. **Line-height pareado**: Cada tamaño tiene su line-height óptimo para legibilidad.

4. **Accesibilidad**: Los tamaños mínimos cumplen WCAG 2.1 (texto legible sin zoom).

### Escala de Bootstrap 5 (con RFS)

| Nivel | Móvil (375px) | Tablet (768px) | Desktop (1200px+) | Line-height |
|---|---|---|---|---|
| H1 | 28px | 34px | 40px | 1.2 |
| H2 | 25px | 28px | 32px | 1.2 |
| H3 | 22px | 25px | 28px | 1.2 |
| H4 | 20px | 22px | 24px | 1.2 |
| H5 | 18px | 19px | 20px | 1.2 |
| H6 | 16px | 16px | 16px | 1.2 |
| Body | 16px | 16px | 16px | 1.5 |
| Small | 14px | 14px | 14px | 1.5 |

> **Nota**: Los tamaños intermedios se calculan automáticamente con `calc(X + Yvw)`, no son breakpoints fijos. La transición es fluida.

### Escala de Material Design 3 (referencia avanzada)

Material Design define **15 estilos** agrupados en 5 roles:

| Rol | Large | Medium | Small |
|---|---|---|---|
| Display | 57px / lh 1.12 / ls -0.25 | 45px / lh 1.16 / ls 0 | 36px / lh 1.22 / ls 0 |
| Headline | 32px / lh 1.25 / ls 0 | 28px / lh 1.29 / ls 0 | 24px / lh 1.33 / ls 0 |
| Title | 22px / lh 1.27 / ls 0 | 16px / lh 1.5 / ls 0.15 | 14px / lh 1.43 / ls 0.1 |
| Body | 16px / lh 1.5 / ls 0.5 | 14px / lh 1.43 / ls 0.25 | 12px / lh 1.33 / ls 0.4 |
| Label | 14px / lh 1.43 / ls 0.1 | 12px / lh 1.33 / ls 0.5 | 11px / lh 1.45 / ls 0.5 |

Cada combinación es el resultado de investigación en legibilidad y accesibilidad. Replicar esto manualmente requeriría testear **cada estilo en al menos 5 tamaños de pantalla** y validar contrastes.

---

## ¿Qué se necesitaría para superar a estas librerías?

Para que un sistema tipográfico propio sea **superador** a Bootstrap o Material, debería cubrir:

### 1. Escala armónica
Los ratios entre tamaños deben seguir una progresión matemática (ej: Mayor Tercera = 1.25, Cuarta Perfecta = 1.333). Esto garantiza armonía visual.

### 2. Escalado responsive
Cada tamaño de heading debe tener un rango mínimo-máximo que se adapte fluidamente al viewport. Sin esto, los títulos se ven desproporcionados en móvil o tímidos en desktop.

### 3. Line-height pareado
Cada tamaño necesita su propio line-height. Texto grande (32px+) necesita lh ≈ 1.2, texto medio (16px) necesita lh ≈ 1.5, texto pequeño (12px) necesita lh ≈ 1.33.

### 4. Letter-spacing ajustado
Headings grandes se benefician de letter-spacing negativo (más compactos). Captions y labels necesitan letter-spacing positivo (más legibles).

### 5. Validación de contraste (WCAG)
Todo estilo debe verificarse contra los fondos de la app para cumplir ratios mínimos de 4.5:1 (texto normal) y 3:1 (texto grande).

### 6. Testing multi-dispositivo
Validar en: iPhone SE (375px), iPhone 14 (390px), iPad (768px), laptop (1366px), monitor (1920px), ultrawide (2560px).

---

## Recomendación

**Adoptar la escala tipográfica de Bootstrap como base** (ya incluida en el proyecto) y personalizar los valores donde el diseño institucional lo requiera. Esto nos da:

- ✅ Escalado responsive automático (RFS)
- ✅ Ratios probados en millones de sitios
- ✅ Accesibilidad validada
- ✅ Sin costo de mantenimiento adicional
- ✅ Compatibilidad con nuestra arquitectura de tokens

Los tokens tipográficos (`--q-fs-*`) se re-apuntarían a las variables de Bootstrap cuando corresponda, manteniendo la capa semántica intacta.

Si en el futuro se requiere una escala tipográfica completamente custom, se recomienda que el diseñador defina las 7 propiedades para cada uno de los 13+ estilos, incluyendo su comportamiento responsive en al menos 3 breakpoints.
