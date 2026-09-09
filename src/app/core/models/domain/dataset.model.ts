/** Re-exportación de contratos de ngx-data-visualizer vinculados al dominio de datos */
export { Dataset, Dimension } from '@uncuyoapp/ngx-data-visualizer';

/**
 * @interface DatasetInfo
 * @description
 * Representa información básica y metadatos de un dataset disponible en la plataforma.
 */
export interface DatasetInfo {
  /** Identificador numérico único del dataset */
  id: number;

  /** Código alfanumérico del dataset */
  code: string;

  /** Nombre descriptivo del dataset */
  name: string;

  /** Descripción contextual o notas técnicas del dataset */
  description?: string;

  /** Dimensiones disponibles en el dataset */
  dimensions: string[];

  /** Indica si los valores corresponden a porcentajes */
  isPercentage: boolean;

  /** Indica si el dataset permite agregación/rollup de datos */
  enableRollUp: boolean;

  /** Unidad de medida de los datos */
  unit?: string;

  /** Periodicidad de actualización de los datos */
  periodicity: string;

  /** Rango temporal o cobertura temporal del dataset */
  temporal: string;

  /** Fecha de última modificación registrada */
  lastModified?: string;
}
