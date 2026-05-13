/** 
 * @interface CacheOptions
 * @description
 * Opciones de configuración para el motor de almacenamiento en caché del sistema.
 */
export interface CacheOptions {
  /**
   * Tiempo de vida de la caché (TTL) en milisegundos.
   * Si se establece en 0, la caché se considera persistente hasta limpieza manual.
   */
  ttl: number;
}
