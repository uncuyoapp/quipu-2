import { HttpContextToken } from '@angular/common/http';

/**
 * Token para indicar que la petición debe ser "silenciosa".
 * Si es true, los interceptores omitirán efectos visuales como el spinner de carga.
 */
export const SILENT_HTTP = new HttpContextToken<boolean>(() => false);
