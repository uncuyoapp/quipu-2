import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@models/domain/user.model';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { DataReadService } from '../infrastructure/data-read.service';
import { DataWriteService } from '../infrastructure/data-write.service';
import { SessionStateService } from '../state/session-state.service';


/**
 * Servicio de persistencia y mutación para la sesión de usuario.
 * Maneja el ciclo de vida de autenticación (login/logout), la selección de IU
 * y las actualizaciones de perfil, sincronizando el estado local y remoto.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionPersistenceService {
  private readonly dataWrite = inject(DataWriteService);
  private readonly dataRead = inject(DataReadService);
  private readonly router = inject(Router);
  private readonly sessionState = inject(SessionStateService);
  private readonly eventBus = inject(AppEventBusService);

  /**
   * Autentica a un usuario y sincroniza el estado.
   */
  login(username: string, password: string): Observable<User> {
    return this.dataWrite.login(username, password).pipe(
      tap((user) => {
        this._updateUserState(user);
        this.dataWrite.setAuthToken(user.token);

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
    this.dataWrite
      .logout()
      .pipe(
        tap(() => {
          this._removeUserState();
          this.eventBus.emit({ type: AppEventType.LOGOUT });
          this.router.navigate(['/login']);
        }),
        catchError((error) => {
          console.error('Logout error:', error);
          this._removeUserState();
          this.router.navigate(['/login']);
          return of(void 0);
        })
      )
      .subscribe();
  }

  /**
   * Cierra la sesión activa en todos los dispositivos conectados.
   */
  logoutAll(): void {
    this.dataWrite
      .logoutAll()
      .pipe(
        tap(() => {
          this._removeUserState();
          this.eventBus.emit({ type: AppEventType.LOGOUT });
          this.router.navigate(['/login']);
        }),
        catchError((error) => {
          console.error('LogoutAll error:', error);
          this._removeUserState();
          this.router.navigate(['/login']);
          return of(void 0);
        })
      )
      .subscribe();
  }

  /**
   * Actualiza el token de acceso en memoria y en localStorage tras una renovación exitosa.
   */
  updateAccessToken(newToken: string): void {
    this.dataWrite.setAuthToken(newToken);
    const currentUser = this.sessionState.user();
    if (currentUser) {
      const updatedUser: User = { ...currentUser, token: newToken };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.sessionState._patchUser(updatedUser);
    }
  }

  /**
   * Maneja la expiración definitiva de la sesión, limpiando credenciales y redirigiendo al login.
   */
  handleSessionExpired(message: string = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'): void {
    this._removeUserState();
    this.eventBus.emit({ type: AppEventType.LOGOUT });
    this.router.navigate(['/login']);
  }

  /**
   * Cambia la Unidad de Información activa.
   */
  selectInformationUnit(unitId: number): Observable<boolean> {
    const user = this.sessionState.user();
    if (!user) return of(false);

    // Verificamos si el usuario tiene acceso a esta unidad (ahora es un array de numbers)
    const hasAccess = user.informationUnits.includes(unitId);
    if (!hasAccess) return of(false);

    // Obtenemos el objeto de la unidad para el evento (hidratación)
    const unitDetails = this.sessionState.allInformationUnits().find(u => u.id === unitId);

    return this.dataWrite.selectInformationUnit(unitId).pipe(
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

        this.router.navigate(['/home']);
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
    return this.dataWrite.updateName(newName).pipe(
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
    return this.dataWrite.updateWorkArea(newArea).pipe(
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
    return this.dataWrite.updateEmail(newEmail).pipe(
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
    return this.dataWrite.updatePassword(oldPassword, newPassword).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.PASSWORD_CHANGED });
        }
      })
    );
  }

  /**
   * Verifica si un token de recuperación de contraseña es válido.
   * @param token Token obtenido del enlace de recuperación.
   * @returns Observable que indica si el token es válido.
   */
  verifyRecoveryToken(token: string): Observable<boolean> {
    return this.dataRead.verifyRecoveryToken(token);
  }

  /**
   * Solicita el envío de un correo de recuperación de contraseña.
   * @param email Correo electrónico del usuario.
   * @returns Observable con el resultado de la operación.
   */
  recoveryPass(email: string): Observable<string> {
    return this.dataWrite.recoveryPass(email);
  }

  /**
   * Cambia la contraseña del usuario mediante un token de recuperación.
   * @param token Token de recuperación válido.
   * @param newPassword Nueva contraseña a establecer.
   * @returns Observable que indica si el cambio fue exitoso.
   */
  changePassword(token: string, newPassword: string): Observable<boolean> {
    return this.dataWrite.changePassword(token, newPassword).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.PASSWORD_CHANGED });
        }
      })
    );
  }

  /**
   * Sincroniza los datos del usuario con el almacenamiento local y el estado reactivo.
   * @private
   */
  private _updateUserState(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.sessionState._patchUser(user);
  }

  /**
   * Limpia los datos del usuario del almacenamiento local y el estado reactivo.
   * @private
   */
  private _removeUserState(): void {
    localStorage.removeItem('currentUser');
    this.dataWrite.removeAuthToken();
    this.sessionState._clearUser();
  }
}
