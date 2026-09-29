import { HttpContextToken, HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { IAuthProvider } from '../data/auth.provider';
import { SessionPersistenceService } from '../services/persistence/session-persistence.service';
import { SessionStateService } from '../services/state/session-state.service';

/** Semáforo para controlar si ya existe un proceso de renovación en vuelo */
let isRefreshing = false;

/** Cola reactiva que emite el nuevo token a todas las peticiones bloqueadas */
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Token de contexto HTTP que indica si una petición debe ignorar la renovación
 * automática de tokens y la inyección de autorización (ej. login o recuperación).
 */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * Interceptor de autenticación y refresco silencioso de tokens JWT.
 * - Inyecta reactivamente Authorization: Bearer <token> y X-Information-Unit-Id en llamadas a la API.
 * - Captura errores 401 y renueva el Access Token de forma transparente (RTR) vía IAuthProvider.
 * - Encola solicitudes paralelas para evitar múltiples refrescos simultáneos (Mutex RxJS).
 * - Desconecta limpiamente al usuario emitiendo evento de sesión si no se puede recuperar.
 * - Cero dependencias de presentación (UI).
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<any> => {
  const sessionState = inject(SessionStateService);
  const authProvider = inject(IAuthProvider);
  const sessionPersistence = inject(SessionPersistenceService);

  const token = sessionState.token();
  const selectedIU = sessionState.selectedIUId();
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const skipAuthRefresh = req.context.get(SKIP_AUTH_REFRESH);

  let authReq = req;
  if (isApiRequest) {
    let headers = req.headers;
    if (!skipAuthRefresh && token && !headers.has('Authorization')) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (selectedIU !== null && selectedIU !== undefined && !headers.has('X-Information-Unit-Id')) {
      headers = headers.set('X-Information-Unit-Id', selectedIU.toString());
    }
    authReq = req.clone({ headers });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isApiRequest && error.status === 401) {
        return handle401Error(authReq, next, error, authProvider, sessionPersistence);
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
  authProvider: IAuthProvider,
  sessionPersistence: SessionPersistenceService
): Observable<any> {
  if (req.context.get(SKIP_AUTH_REFRESH)) {
    return throwError(() => error);
  }

  // Si no hay un refresco en marcha, iniciarlo
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authProvider.refreshToken().pipe(
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
