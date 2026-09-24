import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { SKIP_GLOBAL_ERROR_SNACK } from '../http/tokens';
import { DataWriteService } from '../services/infrastructure/data-write.service';
import { SessionPersistenceService } from '../services/persistence/session-persistence.service';
import { AppNotificationService } from '../services/ux/app-notification.service';

/** Semáforo para controlar si ya existe un proceso de renovación en vuelo */
let isRefreshing = false;

/** Cola reactiva que emite el nuevo token a todas las peticiones bloqueadas */
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Interceptor de autenticación y refresco silencioso de tokens JWT.
 * - Captura errores 401 y renueva el Access Token de forma transparente (RTR).
 * - Encola solicitudes paralelas para evitar múltiples refrescos simultáneos (Mutex RxJS).
 * - Desconecta limpiamente al usuario si la sesión no puede recuperarse.
 * - Notifica errores globales formateados vía AppNotificationService salvo supresión explícita.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<any> => {
  const injector = inject(Injector);
  const notification = inject(AppNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(req, next, error, injector, notification);
      }

      const skipGlobalError = req.context.get(SKIP_GLOBAL_ERROR_SNACK);

      // Mostrar mensaje del servidor si existe, no es 401 y no fue suprimido por la vista llamadora
      if (!skipGlobalError && error.error?.message && error.status !== 401) {
        notification.error(error.error.message);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Gestiona el error 401: decide si renueva o desconecta al usuario.
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  error: HttpErrorResponse,
  injector: Injector,
  notification: AppNotificationService
): Observable<any> {
  const url = req.url.toLowerCase();

  // Si la petición que falló fue el login o el propio refresh, no reintentar
  if (url.includes('auth/login') || url.includes('auth/refresh')) {
    return throwError(() => error);
  }

  const dataWrite = injector.get(DataWriteService);
  const sessionPersistence = injector.get(SessionPersistenceService);

  // Si no hay un refresco en marcha, iniciarlo
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return dataWrite.refreshToken().pipe(
      switchMap((newToken: string) => {
        isRefreshing = false;
        sessionPersistence.updateAccessToken(newToken);
        refreshTokenSubject.next(newToken);

        // Reintentar la solicitud original con el nuevo token
        return next(addTokenToRequest(req, newToken));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        const failedSubject = refreshTokenSubject;
        refreshTokenSubject = new BehaviorSubject<string | null>(null);
        failedSubject.error(refreshError);

        sessionPersistence.handleSessionExpired('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        notification.warn('Tu sesión ha expirado. Por favor, ingresa nuevamente.');
        return throwError(() => refreshError);
      })
    );
  }

  // Si ya hay un refresco en curso, esperar al BehaviorSubject y luego reintentar
  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token: string) => next(addTokenToRequest(req, token)))
  );
}

/**
 * Clona una petición inyectando el nuevo token Bearer en el encabezado Authorization.
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
