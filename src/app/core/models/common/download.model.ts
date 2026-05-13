/**
 * @interface DownloadOptions
 * @description
 * Opciones de configuración para la generación y descarga de reportes y recursos.
 */
export interface DownloadOptions {
  /** Indica si se debe incluir la ficha técnica en la descarga */
  fiche: boolean;
  /** Indica si se debe incluir el gráfico principal */
  chart: boolean;
  /** Indica si se debe incluir la tabla de datos */
  table: boolean;
  /** Indica si se deben incluir todos los gráficos por dimensión (si existen) */
  multiCharts: boolean;
}

/**
 * @interface DownloadAvailability
 * @description
 * Define la disponibilidad técnica de opciones de descarga para una visualización específica.
 */
export interface DownloadAvailability {
  /** Indica si el componente soporta descarga de gráfico */
  chart: boolean;
  /** Indica si el componente soporta descarga de tabla */
  table: boolean;
  /** Indica si el componente soporta descarga de múltiples gráficos */
  multiCharts: boolean;
}
