import { CacheOptions } from "./cache.model";

/** 
 * @interface ApiRequestOptions
 * @description
 * Opciones adicionales para configurar el comportamiento de las peticiones HTTP a la API.
 */
export interface ApiRequestOptions {
  /** Determina si se debe intentar recuperar/guardar la respuesta en la caché */
  useCache?: boolean;
  /** Configuración específica para el almacenamiento de esta petición en caché */
  cacheOptions?: CacheOptions;
  /** Si es true, omite la notificación global de carga o errores en la UI */
  silent?: boolean;
}

/** 
 * @type ApiParams
 * @description
 * Estructura para definir parámetros de consulta (query params) tipados para la API.
 */
export type ApiParams = Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
