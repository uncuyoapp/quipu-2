/**
 * @interface SaveThematicDto
 * @description
 * DTO para crear o actualizar una temática en el proveedor de datos.
 */
export interface SaveThematicDto {
  /** Nombre visible de la temática (obligatorio) */
  name: string;

  /** Descripción o tooltip contextual */
  description?: string;

  /** Identificador de la temática padre para estructuras jerárquicas */
  parentId?: number | null;

  /** Orden relativo de despliegue */
  order?: number;

  /** Color representativo para la interfaz */
  color?: string;

  /** Nombre del archivo o identificador de ilustración */
  illustration?: string;
}

/**
 * @interface ReorderThematicsDto
 * @description
 * Payload para persistir un nuevo orden secuencial de temáticas.
 */
export interface ReorderThematicsDto {
  /** Lista ordenada de identificadores de temáticas */
  order: number[];
}

/**
 * @interface AssignVisualizationsDto
 * @description
 * Payload para asociar visualizaciones a una temática específica.
 */
export interface AssignVisualizationsDto {
  /** Lista de identificadores de las visualizaciones asociadas */
  visualizationIds: (number | string)[];
}
