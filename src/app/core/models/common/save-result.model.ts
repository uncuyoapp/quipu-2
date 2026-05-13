/** 
 * @interface SaveResult
 * @description
 * Representa el resultado estándar de una operación de persistencia (creación o edición).
 */
export interface SaveResult {
  /** Indica si la operación fue exitosa y los datos fueron guardados */
  saved: boolean;
}
