import { HttpErrorResponse } from '@angular/common/http';

const HTTP_STATUS_MESSAGES: Readonly<Record<number, string>> = {
  0: 'No se pudo establecer conexión con el servidor. Por favor, verifica tu conexión a internet.',
  403: 'No tienes permisos suficientes para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
};

/**
 * Extrae la propiedad "message" del payload de error si es una cadena válida.
 */
function extractMessageProperty(payload: unknown): string | null {
  const message = (payload as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message.trim().length > 0 ? message : null;
}

/**
 * Procesa errores de validación estructurados (ej. 422) con arreglo o diccionario de campos.
 */
function extractValidationErrors(payload: unknown): string | null {
  const errors = (payload as { errors?: unknown } | null)?.errors;
  if (!errors || typeof errors !== 'object') {
    return null;
  }

  const messages = Object.values(errors).flatMap(fieldErrors => {
    if (Array.isArray(fieldErrors)) {
      return fieldErrors.filter((msg): msg is string => typeof msg === 'string');
    }
    return typeof fieldErrors === 'string' ? [fieldErrors] : [];
  });

  return messages.length > 0 ? messages.join('. ') : null;
}

/**
 * Extrae el cuerpo si es un string plano (evitando páginas de error HTML).
 */
function extractStringPayload(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim().length > 0 && !payload.startsWith('<!DOCTYPE')) {
    return payload;
  }
  return null;
}

/**
 * Traduce códigos de estado HTTP estándar a mensajes en español.
 */
function getHttpStatusMessage(status: number): string | null {
  if (HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status];
  }
  if (status >= 500) {
    return 'Ocurrió un error inesperado en el servidor. Por favor, intenta nuevamente más tarde.';
  }
  return null;
}

/**
 * Procesa de forma secuencial las posibles fuentes de mensaje de un HttpErrorResponse.
 */
function extractFromHttpError(error: HttpErrorResponse): string | null {
  return (
    extractMessageProperty(error.error) ??
    extractValidationErrors(error.error) ??
    extractStringPayload(error.error) ??
    getHttpStatusMessage(error.status)
  );
}

/**
 * Extrae mensaje de un Error estándar de JS (omitiendo cadenas técnicas de Angular).
 */
function extractStandardErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message && !error.message.startsWith('Http failure response')) {
    return error.message;
  }
  return null;
}

/**
 * Extrae un mensaje de error legible para el usuario a partir de un error HTTP o genérico.
 * Prioriza el payload de la API backend (message o errors de validación 422),
 * traduce códigos de estado de red (0, 403, 404, 500+) y evita exponer mensajes técnicos de Angular.
 *
 * @param error El objeto de error capturado en el bloque error/catchError.
 * @param fallback Mensaje por defecto en español si no se puede extraer un mensaje específico.
 * @returns Cadena con el mensaje de error para mostrar en la interfaz de usuario.
 */
export function extractHttpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    return extractFromHttpError(error) ?? fallback;
  }

  return extractStandardErrorMessage(error) ?? fallback;
}
