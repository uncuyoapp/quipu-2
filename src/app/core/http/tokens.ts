import { HttpContextToken } from '@angular/common/http';

/**
 * Token para indicar que la petición debe ser "silenciosa".
 * Si es true, los interceptores omitirán efectos visuales como el spinner de carga.
 */
export const SILENT_HTTP = new HttpContextToken<boolean>(() => false);

/**
 * Token para indicar que la petición gestiona sus propios errores visuales en la UI.
 * Si es true, el interceptor HTTP omitirá el SnackBar global de error.
 */
export const SKIP_GLOBAL_ERROR_SNACK = new HttpContextToken<boolean>(() => false);
