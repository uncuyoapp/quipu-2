import {
  ChartOptions,
  FiltersConfig,
  TableOptions
} from '@uncuyoapp/ngx-data-visualizer';
import { ThematicRef } from './thematic.model';

/**
 * @interface Visualization
 * @description
 * Representa una visualización completa (gráfico, tabla y metadatos) dentro de Quipu.
 */
export interface Visualization {
  /** Identificador único de la visualización */
  id: number | string;

  /** Indica si la visualización está publicada para los usuarios finales */
  published: boolean;

  /** Título visible en la tarjeta y en la vista expandida */
  title: string;

  /** Breve descripción o resumen contextual de la visualización */
  summary?: string;

  /** Unidad de información propietaria de los datos (ej: Rectorado, Facultad, etc.) */
  informationUnitName: string;

  /** Referencia opcional a la unidad de información propietaria (ID) */
  informationUnitId?: number;

  /** Unidad de medida utilizada (ej: “Pesos corrientes”, “Cantidad de estudiantes”) */
  measureUnit: string;

  /** Periodicidad de los datos (ej: “Anual”, “Mensual”, “Trimestral”) */
  periodicity: string;

  /** Rango temporal que abarca la visualización (ej: “2015–2019”, “2022”) */
  timeRange: string;

  /** Dimensiones activas (ej: Condición de estudiante, Espacio curricular, Año) */
  dimensions: string[];

  /** Identificador del dataset que provee los datos */
  datasetId: string;

  /** Orden opcional para ser utilizado dentro de una grilla */
  order?: number;

  /** Lista de temáticas a las que pertenece esta visualización (relación N:M) */
  thematics: ThematicRef[];

  /** Bloques visuales que componen la visualización */
  visualBlocks: VisualizationBlock[];

  /** Ficha técnica con información cualitativa detallada */
  technicalSheet: {
    /** Descripción extendida de la visualización */
    description?: string;
    /** Fórmula de cálculo de los indicadores */
    formula?: string;
    /** Área productora de la información */
    producerArea?: string;
    /** Fecha de última actualización de los datos */
    lastUpdate?: string;
    /** Modo de registro de la información */
    registrationMode?: string;
    /** Responsables institucionales */
    responsible?: string[];
    /** Responsable directo de los datos */
    dataResponsible?: string;
  };

  /** Metadatos de sistema y categorización */
  metadata?: {
    /** Etiquetas para búsqueda y filtrado */
    tags?: string[];
    /** Fecha de creación en el sistema */
    createdAt?: string;
    /** Fecha de última modificación en el sistema */
    updatedAt?: string;
  };

  /** Configuración técnica de origen de datos */
  dataConfig?: {
    /** Filtros base aplicados permanentemente al dataset */
    baseFilters: FiltersConfig;
  };
}

/**
 * @interface VisualizationFilter
 * @description
 * Estructura de filtros aplicables a una lista o grilla de visualizaciones.
 */
export interface VisualizationFilter {
  /** Dimensiones por las cuales filtrar */
  dimensions?: string[];
  /** Unidad de medida específica */
  measureUnit?: string;
  /** Periodicidad de los datos */
  periodicity?: string;
  /** IDs de temáticas para filtrado por categoría */
  thematicIds?: number[];
  /** Cadena de búsqueda para título y descripción */
  search?: string;
  /** Determina si se incluyen visualizaciones en estado borrador */
  showDrafts?: boolean;
}

/**
 * @type VisualizationOrder
 * @description
 * Criterios de ordenamiento disponibles para las visualizaciones.
 */
export type VisualizationOrder =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'recent'
  | 'serie-recent'
  | 'serie-old'
  | 'dimensions-more'
  | 'dimensions-less';

/**
 * @interface VisualizationBlock
 * @description
 * Bloque visual individual que agrupa configuración de gráfico, tabla y filtros locales.
 */
export interface VisualizationBlock {
  /** ID único del bloque */
  id: string;
  /** Título del bloque (opcional) */
  title?: string;
  /** Configuración de gráfico (ngx-data-visualizer) */
  chartOptions?: ChartOptions;
  /** Configuración de tabla (ngx-data-visualizer) */
  tableOptions?: TableOptions;
  /** Filtros específicos para este bloque */
  filters?: FiltersConfig;
}

/**
 * @interface InformationEditEvent
 * @description
 * Evento emitido por los componentes de edición de información cualitativa.
 */
export interface InformationEditEvent {
  /** Nombre del campo editado */
  field: string;
  /** Nuevo valor asignado */
  value: string | string[];
  /** Indica si el campo pertenece a la ficha técnica */
  isTechnicalSheet: boolean;
}

/** 
 * @interface VisualizationPage
 * @description
 * Estructura de respuesta paginada para listas de visualizaciones. 
 */
export interface VisualizationPage {
  /** Lista de visualizaciones de la página actual */
  content: Visualization[];
  /** Total de elementos en el servidor */
  totalElements: number;
  /** Total de páginas disponibles */
  totalPages: number;
}
