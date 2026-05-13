/**
 * Registro centralizado de recursos gráficos de la aplicación.
 * Permite mantener las rutas estáticas fuera de los componentes y abstraer
 * la configuración visual por secciones.
 */

// ----------------------------------------------------------------------
// 1. Recursos Base (Logos y Fondos)
// ----------------------------------------------------------------------

export const APP_LOGOS = {
  main: 'assets/img/logo.svg',
  white: 'assets/img/logo-white.svg',
  university: 'assets/img/logo-uncuyo.svg',
  universityArea: 'assets/img/logo-uncuyo-app.svg'
} as const;

export const APP_BACKGROUNDS = {
  main: 'assets/img/background.svg',
  visualization: 'assets/img/visualizations/v-background.svg'
} as const;

export const APP_ILLUSTRATIONS = {
  loginHero: 'assets/img/ilustraciones/loginHero.svg',
  homeHero: 'assets/img/ilustraciones/homeHero.svg',
  homeThematicsEmpty: 'assets/img/ilustraciones/homeThematicsEmpty.svg',
  userInfoHero: 'assets/img/ilustraciones/userInfoHero.svg',
  thematicFallback: 'assets/img/ilustraciones/thematicFallback.svg',
  gridEmpty: 'assets/img/ilustraciones/gridEmpty.svg',
  multiChartEmpty: 'assets/img/ilustraciones/multiChartEmpty.svg',
  downloadsMain: 'assets/img/ilustraciones/downloadsMain.svg',
} as const;

// ----------------------------------------------------------------------
// 2. Iconos de Tipos de Visualización
// ----------------------------------------------------------------------

export const VISUALIZATION_TYPES_ICONS: Record<string, string> = {
  area: 'assets/img/visualizations/v-area.svg',
  areaspline: 'assets/img/visualizations/v-area.svg',
  bar: 'assets/img/visualizations/v-bar.svg',
  column: 'assets/img/visualizations/v-column.svg',
  line: 'assets/img/visualizations/v-line.svg',
  spline: 'assets/img/visualizations/v-line.svg',
  pie: 'assets/img/visualizations/v-pie.svg',
  table: 'assets/img/visualizations/v-table.svg',
  default: 'assets/img/visualizations/v-default.svg'
};

// ----------------------------------------------------------------------
// 3. Ilustraciones Temáticas
// ----------------------------------------------------------------------

/**
 * Catálogo exclusivo para las temáticas (domain/thematics).
 * Solo se almacenan los nombres de los archivos para facilitar su gestión.
 */
export const THEMATIC_ILLUSTRATIONS = [
  'cat-01.svg',
  'cat-02.svg',
  'cat-03.svg',
  'cat-04.svg',
  'cat-05.svg',
  'cat-06.svg',
  'cat-07.svg',
  'cat-08.svg',
  'cat-09.svg',
  'cat-10.svg',
  'cat-11.svg',
  'cat-12.svg',
  'cat-13.svg',
  'cat-14.svg',
] as const;

/**
 * Retorna la ruta completa para una ilustración temática.
 * @param fileName Nombre del archivo (ej. 'cat-01.svg')
 * @returns Ruta completa del asset
 */
export const getThematicIllustrationPath = (fileName: string): string => {
  return `assets/img/ilustraciones/thematics/${fileName}`;
};

// ----------------------------------------------------------------------
// 4. Mapeo de Ilustraciones por Sección (SECTION_GRAPHICS)
// ----------------------------------------------------------------------

/**
 * Configuración visual estática asignada por sección.
 * Los componentes consumen este diccionario para evitar rutas hardcodeadas.
 */
export const SECTION_GRAPHICS = {
  login: {
    hero: APP_ILLUSTRATIONS.loginHero,
    background: APP_BACKGROUNDS.main,
    logoMain: APP_LOGOS.main,
    logoUniversity: APP_LOGOS.university
  },
  home: {
    hero: APP_ILLUSTRATIONS.homeHero,
    thematicsEmpty: APP_ILLUSTRATIONS.homeThematicsEmpty,
    background: APP_BACKGROUNDS.main,
    logoWhite: APP_LOGOS.white,
  },
  userInfo: {
    hero: APP_ILLUSTRATIONS.userInfoHero
  },
  thematic: {
    fallback: APP_ILLUSTRATIONS.thematicFallback
  },
  visualizations: {
    gridEmpty: APP_ILLUSTRATIONS.gridEmpty,
    multiChartEmpty: APP_ILLUSTRATIONS.multiChartEmpty,
    downloadsMain: APP_ILLUSTRATIONS.downloadsMain,
    background: APP_BACKGROUNDS.visualization
  },
  about: {
    logoMain: APP_LOGOS.main,
    logoUniversity: APP_LOGOS.university,
    logoUniversityArea: APP_LOGOS.universityArea
  },
  navBar: {
    logoMain: APP_LOGOS.main,
    logoWhite: APP_LOGOS.white
  },
  footer: {
    logoMain: APP_LOGOS.main
  }
} as const;
