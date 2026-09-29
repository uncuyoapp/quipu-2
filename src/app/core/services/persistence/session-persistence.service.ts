import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IAuthProvider } from '@core/data/auth.provider';
import { User } from '@models/domain/user.model';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { SessionStateService } from '../state/session-state.service';

/**
 * Servicio de persistencia y mutación para la sesión de usuario.
 * Orquesta el ciclo de vida de autenticación delegando en IAuthProvider
 * y sincronizando el estado reactivo en SessionStateService y localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionPersistenceService {
  private readonly authProvider = inject(IAuthProvider);
  private readonly router = inject(Router);
  private readonly sessionState = inject(SessionStateService);
  private readonly eventBus = inject(AppEventBusService);

  /**
   * Autentica a un usuario y sincroniza el estado.
   */
  login(username: string, password: string): Observable<User> {
    return this.authProvider.login(username, password).pipe(
      tap((user) => {
        this._updateUserState(user);

        this.eventBus.emit({
          type: AppEventType.LOGIN_SUCCESS,
          payload: {
            userId: user.id,
            username: user.username,
            role: user.role as 'admin' | 'editor' | 'viewer'
          }
        });
      })
    );
  }

  /**
   * Cierra la sesión activa.
   */
  logout(): void {
    this.authProvider
      .logout()
      .pipe(
        tap(() => {
          this._removeUserState();
          this.eventBus.emit({ type: AppEventType.LOGOUT });
          void this.router.navigate(['/login']);
        }),
        catchError((error) => {
          console.error('Logout error:', error);
          this._removeUserState();
          void this.router.navigate(['/login']);
          return of(void 0);
        })
      )
      .subscribe();
  }

  /**
   * Cierra la sesión activa en todos los dispositivos conectados.
   */
  logoutAll(): void {
    this.authProvider
      .logoutAll()
      .pipe(
        tap(() => {
          this._removeUserState();
          this.eventBus.emit({ type: AppEventType.LOGOUT });
          void this.router.navigate(['/login']);
        }),
        catchError((error) => {
          console.error('LogoutAll error:', error);
          this._removeUserState();
          void this.router.navigate(['/login']);
          return of(void 0);
        })
      )
      .subscribe();
  }

  /**
   * Actualiza el token de acceso en memoria y en localStorage tras una renovación exitosa.
   */
  updateAccessToken(newToken: string): void {
    const currentUser = this.sessionState.user();
    if (currentUser) {
      const updatedUser: User = { ...currentUser, token: newToken };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.sessionState._patchUser(updatedUser);
    }
  }

  /**
   * Maneja la expiración de sesión, limpiando credenciales, emitiendo eventos y redirigiendo al login.
   */
  handleSessionExpired(message: string = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'): void {
    this._removeUserState();
    this.eventBus.emit({ type: AppEventType.SESSION_EXPIRED, payload: { reason: message } });
    this.eventBus.emit({ type: AppEventType.LOGOUT });
    void this.router.navigate(['/login'], { queryParams: { expired: 'true' } });
  }

  /**
   * Cambia la Unidad de Información activa.
   */
  selectInformationUnit(unitId: number): Observable<boolean> {
    const user = this.sessionState.user();
    if (!user) return of(false);

    const hasAccess = user.informationUnits.includes(unitId);
    if (!hasAccess) return of(false);

    const unitDetails = this.sessionState.allInformationUnits().find(u => u.id === unitId);

    return this.authProvider.selectInformationUnit(unitId).pipe(
      tap(() => {
        const updatedUser: User = {
          ...user,
          selectedIU: unitId,
        };

        this._updateUserState(updatedUser);

        this.eventBus.emit({
          type: AppEventType.IU_SELECTED,
          payload: { id: unitId, name: unitDetails?.name ?? 'Desconocida' }
        });

        void this.router.navigate(['/home']);
      }),
      map(() => true),
      catchError((error) => {
        console.error('Error selecting information unit:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualiza el nombre del usuario.
   */
  updateName(newName: string): Observable<boolean> {
    return this.authProvider.updateName(newName).pipe(
      tap((success) => {
        if (success) {
          const user = this.sessionState.user();
          if (user) {
            this._updateUserState({ ...user, name: newName });
            this.eventBus.emit({
              type: AppEventType.USER_NAME_UPDATED,
              payload: { userId: user.id, name: newName }
            });
          }
        }
      })
    );
  }

  /**
   * Actualiza el área de trabajo (IU seleccionada).
   */
  updateWorkArea(newArea: string): Observable<boolean> {
    return this.authProvider.updateWorkArea(newArea).pipe(
      tap((success) => {
        if (success) {
          const user = this.sessionState.user();
          if (user) {
            const updatedUser: User = {
              ...user,
              workArea: newArea
            };
            this._updateUserState(updatedUser);
            this.eventBus.emit({
              type: AppEventType.USER_AREA_UPDATED,
              payload: { userId: user.id, area: newArea }
            });
          }
        }
      })
    );
  }

  /**
   * Actualiza el correo electrónico.
   */
  updateEmail(newEmail: string): Observable<boolean> {
    return this.authProvider.updateEmail(newEmail).pipe(
      tap((success) => {
        if (success) {
          const user = this.sessionState.user();
          if (user) {
            this._updateUserState({ ...user, email: newEmail });
            this.eventBus.emit({
              type: AppEventType.USER_EMAIL_UPDATED,
              payload: { userId: user.id, email: newEmail }
            });
          }
        }
      })
    );
  }

  /**
   * Actualiza la contraseña.
   */
  updatePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    return this.authProvider.updatePassword(oldPassword, newPassword).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.PASSWORD_CHANGED });
        }
      })
    );
  }

  /**
   * Verifica si un token de recuperación de contraseña es válido.
   */
  verifyRecoveryToken(token: string): Observable<boolean> {
    return this.authProvider.verifyRecoveryToken(token);
  }

  /**
   * Solicita el envío de un correo de recuperación de contraseña.
   */
  recoveryPass(email: string): Observable<string> {
    return this.authProvider.recoveryPass(email);
  }

  /**
   * Cambia la contraseña del usuario mediante un token de recuperación.
   */
  changePassword(token: string, newPassword: string): Observable<boolean> {
    return this.authProvider.changePassword(token, newPassword).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.PASSWORD_CHANGED });
        }
      })
    );
  }

  /**
   * Sincroniza los datos del usuario con el almacenamiento local y el estado reactivo.
   */
  private _updateUserState(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.sessionState._patchUser(user);
  }

  /**
   * Limpia los datos del usuario del almacenamiento local y el estado reactivo.
   */
  private _removeUserState(): void {
    localStorage.removeItem('currentUser');
    this.sessionState._clearUser();
  }
}
