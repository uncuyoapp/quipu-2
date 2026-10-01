import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IAuthProvider } from '@core/data/auth.provider';
import { asyncScheduler, fromEvent, merge, of } from 'rxjs';
import { catchError, filter, switchMap, throttleTime } from 'rxjs/operators';
import { SessionPersistenceService } from '../persistence/session-persistence.service';
import { SessionStateService } from '../state/session-state.service';

/**
 * Servicio encargado de sincronizar la vigencia de la sesión web central
 * al recuperar el foco o cambiar de pestaña en el navegador.
 *
 * Aplica el patrón Single Sign-Out (SLO) reactivo sin degradar el rendimiento
 * ni saturar la API gracias a un estrangulamiento controlado (throttleTime).
 */
@Injectable({
  providedIn: 'root',
})
export class SessionFocusDetectorService {
  private readonly authProvider = inject(IAuthProvider);
  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  /** Ventana mínima entre comprobaciones consecutivas (10 segundos) */
  private readonly CHECK_THROTTLE_MS = 10000;

  /** Bandera de control para garantizar inicialización única */
  private initialized = false;

  /**
   * Inicializa la escucha de eventos de foco y visibilidad en el navegador.
   * Debe ser invocado una única vez durante el ciclo de arranque de la aplicación.
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.initialized = true;

    this.ngZone.runOutsideAngular(() => {
      const visibilityEvents$ = fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible')
      );

      const windowFocusEvents$ = fromEvent(window, 'focus');

      merge(visibilityEvents$, windowFocusEvents$)
        .pipe(
          filter(() => this.sessionState.isAuthenticated()),
          throttleTime(this.CHECK_THROTTLE_MS, asyncScheduler, { leading: true, trailing: false }),
          switchMap(() => {
            return this.authProvider.checkSsoSession().pipe(
              catchError(() => of(null))
            );
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((user) => {
          if (!user && this.sessionState.isAuthenticated()) {
            this.ngZone.run(() => {
              this.sessionPersistence.handleSessionExpired(
                'Tu sesión ha finalizado en otro módulo o pestaña.'
              );
            });
          } else if (user?.token && this.sessionState.isAuthenticated()) {
            this.sessionPersistence.updateAccessToken(user.token);
          }
        });
    });
  }
}
