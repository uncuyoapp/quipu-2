/**
 * @interface Thematic
 * @description
 * Representa una temática o categoría principal dentro de Quipu.
 * Agrupa visualizaciones relacionadas y define atributos jerárquicos y gráficos.
 */
export interface Thematic {
  /** Identificador único de la temática */
  id: number;

  /** Nombre visible de la temática */
  name: string;

  /** Descripción contextual o tooltip */
  description: string;

  /** ID de la temática padre para estructuras jerárquicas */
  parentId?: number | null;

  /** Orden de visualización en listados y grillas */
  order: number;

  /** Ruta de navegación jerárquica (breadcrumb) */
  breadcrumb: string;

  /** Color representativo para la UI */
  color: string;

  /** Nombre de la ilustración configurada (ver thematic-illustrations.config) */
  illustration: string;

  /** Subtemáticas dependientes */
  childrens?: Thematic[];

  /** Lista de IDs de visualizaciones asociadas */
  visualizationIds?: (number | string)[];
}

/**
 * @interface ThematicRef
 * @description
 * Referencia ligera a una temática para evitar dependencias circulares en otros modelos.
 */
export interface ThematicRef {
  /** ID de la temática */
  id: number;
  /** Nombre de la temática */
  name: string;
}
