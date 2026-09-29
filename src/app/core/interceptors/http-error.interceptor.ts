import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SKIP_GLOBAL_ERROR_SNACK } from '../http/tokens';
import { AppNotificationService } from '../services/ux/app-notification.service';

/**
 * Interceptor encargado de la captura y notificación de errores HTTP generales (no-401).
 * Notifica al usuario vía AppNotificationService salvo supresión explícita
 * mediante el token de contexto SKIP_GLOBAL_ERROR_SNACK.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  const notification = inject(AppNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const skipGlobalError = req.context.get(SKIP_GLOBAL_ERROR_SNACK);

      if (!skipGlobalError && error.error?.message && error.status !== 401) {
        notification.error(error.error.message);
      }

      return throwError(() => error);
    })
  );
};
