/**
 * @interface BulkActionDto
 * @description
 * Payload estandarizado para operaciones transaccionales masivas (publicar, despublicar, borrar).
 */
export interface BulkActionDto {
  /** Identificadores de las entidades sobre las que impactar */
  ids: (number | string)[];
}
