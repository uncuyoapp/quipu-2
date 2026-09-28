import { FiltersConfig } from '@uncuyoapp/ngx-data-visualizer';

/**
 * @interface VisualizationBlockMutationDto
 * @description
 * Representa la configuración de un bloque visual para operaciones de creación o edición.
 */
export interface VisualizationBlockMutationDto {
  /** Identificador único del bloque */
  id: string;

  /** Título opcional o epígrafe específico del bloque */
  title?: string;

  /** Opciones de configuración de gráficos */
  chartOptions?: Record<string, any>;

  /** Opciones de configuración de tablas */
  tableOptions?: Record<string, any>;

  /** Filtros y agrupamientos locales propios del bloque */
  filters?: FiltersConfig;
}

/**
 * @interface SaveVisualizationDto
 * @description
 * DTO para crear o actualizar una visualización en el proveedor de datos.
 */
export interface SaveVisualizationDto {
  /** Título principal de la visualización (obligatorio) */
  title: string;

  /** Identificador numérico del dataset que provee los datos (obligatorio) */
  datasetId: number;

  /** Resumen descriptivo contextual */
  summary?: string;

  /** Fórmula de cálculo para la ficha técnica */
  formula?: string;

  /** Estado de visibilidad para usuarios finales */
  published: boolean;

  /** Filtros base y rollup aplicados al dataset en la visualización */
  baseFilters?: FiltersConfig;

  /** Lista de bloques visuales configurados */
  visualBlocks?: VisualizationBlockMutationDto[];
}
