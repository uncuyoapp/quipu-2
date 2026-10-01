import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { InformationUnit } from '@models/domain/information-unit.model';
import { User } from '@models/domain/user.model';
import { Observable, concatMap, delay, of, throwError } from 'rxjs';
import { IAuthProvider } from '../auth.provider';
import {
  CURRENT_MOCK_USER,
  MOCK_INFORMATION_UNITS,
  MOCK_USERS,
  VALID_MOCK_CREDENTIALS,
  VALID_RECOVERY_TOKENS
} from '../mock';

/**
 * Implementación Mock de IAuthProvider para desarrollo offline y pruebas.
 * Simula autenticación, emisión de tokens y gestión de sesión en memoria.
 */
@Injectable()
export class MockAuthProvider implements IAuthProvider {
  /** Usuario actualmente autenticado en el estado mock en memoria */
  private currentUser: User | null = null;

  /** Token de autenticación JWT simulado */
  private authToken: string | null = null;

  /** Identificador de la Unidad de Información activa seleccionada */
  private selectedInformationUnit: number = 1;

  // --- Métodos de Autenticación y Ciclo de Sesión ---

  /**
   * Obtiene la información del usuario mock autenticado con un retardo simulado.
   * Si no hay sesión iniciada previamente, devuelve el usuario predeterminado de pruebas.
   * 
   * @returns Un observable que contiene una copia profunda de los datos del usuario.
   */
  getCurrentUser(): Observable<User> {
    return of(void 0).pipe(
      delay(200),
      concatMap(() => {
        if (this.currentUser) return of(this.deepClone(this.currentUser));
        return of({ ...CURRENT_MOCK_USER });
      })
    );
  }

  /**
   * Autentica al usuario validando sus credenciales contra el catálogo estático VALID_MOCK_CREDENTIALS.
   * Genera un token mock aleatorio y almacena el estado de sesión en memoria.
   * 
   * @param username Nombre de usuario para validar.
   * @param password Contraseña de acceso.
   * @returns Un observable con el usuario autenticado o un error si las credenciales no coinciden.
   */
  login(username: string, password: string): Observable<User> {
    return of(void 0).pipe(
      delay(300),
      concatMap(() => {
        const isValid = VALID_MOCK_CREDENTIALS.some(
          c => c.username === username && c.password === password
        );

        if (!isValid) {
          return throwError(() => new Error('Credenciales inválidas.'));
        }

        const user = MOCK_USERS.find(u => u.username === username);
        if (!user) {
          return throwError(() => new Error('Usuario no encontrado en los perfiles.'));
        }

        const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substring(7);
        this.currentUser = { ...user, token: mockToken };
        this.authToken = mockToken;
        return of(this.deepClone(this.currentUser));
      })
    );
  }

  /**
   * Cierra la sesión activa en el entorno mock, limpiando el usuario y token en memoria.
   * 
   * @returns Un observable que completa tras un retardo simulado.
   */
  logout(): Observable<void> {
    return of(void 0).pipe(
      delay(150),
      concatMap(() => {
        this.currentUser = null;
        this.authToken = null;
        return of(void 0);
      })
    );
  }

  /**
   * Simula el cierre de sesión en todos los dispositivos para el entorno mock.
   * 
   * @returns Un observable que completa tras un retardo simulado.
   */
  logoutAll(): Observable<void> {
    return of(void 0).pipe(
      delay(150),
      concatMap(() => {
        this.currentUser = null;
        this.authToken = null;
        return of(void 0);
      })
    );
  }

  /**
   * Simula la renovación del Access Token generando un nuevo token JWT simulado con timestamp.
   * 
   * @returns Un observable que emite la nueva cadena de token renovada.
   */
  refreshToken(): Observable<string> {
    const mockNewToken = 'mock_jwt_token_refreshed_' + Date.now();
    this.authToken = mockNewToken;
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, token: mockNewToken };
    }
    return of(mockNewToken).pipe(delay(200));
  }

  // --- Métodos de Recuperación y Gestión de Contraseñas ---

  /**
   * Simula la solicitud de recuperación de contraseña devolviendo un mensaje exitoso.
   * 
   * @param email Dirección de correo electrónico mock.
   * @returns Un observable con el mensaje de confirmación simulado.
   */
  recoveryPass(email: string): Observable<string> {
    return of('Se ha enviado un correo de recuperación').pipe(delay(200));
  }

  /**
   * Valida si el token provisto existe en el listado VALID_RECOVERY_TOKENS.
   * 
   * @param token Cadena del token de recuperación a validar.
   * @returns Un observable booleano indicando si el token está registrado.
   */
  verifyRecoveryToken(token: string): Observable<boolean> {
    return of(VALID_RECOVERY_TOKENS.includes(token)).pipe(delay(200));
  }

  /**
   * Simula el cambio exitoso de contraseña mediante token de recuperación.
   * 
   * @param token Token de recuperación validado.
   * @param newPassword Nueva contraseña simulada.
   * @returns Un observable que emite true.
   */
  changePassword(token: string, newPassword: string): Observable<boolean> {
    return of(true).pipe(delay(200));
  }

  /**
   * Simula la actualización de contraseña en sesión activa.
   * 
   * @param oldPassword Contraseña actual mock.
   * @param newPassword Nueva contraseña mock.
   * @returns Un observable que emite true.
   */
  updatePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    return of(true).pipe(delay(200));
  }

  // --- Métodos de Perfil de Usuario ---

  /**
   * Actualiza el correo electrónico del usuario activo en memoria.
   * 
   * @param newEmail Nuevo correo electrónico a registrar.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updateEmail(newEmail: string): Observable<boolean> {
    return of(void 0).pipe(
      delay(150),
      concatMap(() => {
        if (this.currentUser) this.currentUser.email = newEmail;
        return of(true);
      })
    );
  }

  /**
   * Actualiza el nombre del usuario activo en memoria.
   * 
   * @param newName Nuevo nombre a registrar.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updateName(newName: string): Observable<boolean> {
    return of(void 0).pipe(
      delay(150),
      concatMap(() => {
        if (this.currentUser) this.currentUser.name = newName;
        return of(true);
      })
    );
  }

  /**
   * Actualiza el área de trabajo o dependencia asignada al usuario en memoria.
   * 
   * @param newArea Nombre de la nueva área laboral.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updateWorkArea(newArea: string): Observable<boolean> {
    return of(void 0).pipe(
      delay(150),
      concatMap(() => {
        if (this.currentUser) this.currentUser.workArea = newArea;
        return of(true);
      })
    );
  }

  // --- Métodos de Unidades de Información (Contexto / Tenant) ---

  /**
   * Devuelve las Unidades de Información accesibles para el usuario mock actual.
   * 
   * @returns Un observable que contiene el arreglo de unidades de información del usuario.
   */
  getUserInformationUnits(): Observable<InformationUnit[]> {
    const userUnitsIds = this.currentUser?.informationUnits ?? [];
    const units = MOCK_INFORMATION_UNITS.filter(u => userUnitsIds.includes(u.id));
    return of(this.deepClone(units.length > 0 ? units : MOCK_INFORMATION_UNITS)).pipe(delay(100));
  }

  /**
   * Simula la selección y cambio de la Unidad de Información activa para el usuario mock.
   * 
   * @param unitId Identificador único de la Unidad de Información a activar.
   * @returns Un observable booleano indicando el éxito de la selección.
   */
  selectInformationUnit(unitId: number): Observable<boolean> {
    return of(void 0).pipe(
      delay(100),
      concatMap(() => {
        this.selectedInformationUnit = unitId;
        if (this.currentUser) {
          this.currentUser.selectedIU = unitId;
        }
        return of(true);
      })
    );
  }

  /**
   * Comprueba la existencia de sesión central en modo mock (siempre null por ser entorno desconectado).
   */
  checkSsoSession(): Observable<User | null> {
    return of(null);
  }

  /**
   * Genera la URL de salto administrativo simulado para el entorno mock.
   *
   * @param target Ruta interna en adminUI.
   * @param tenantId Identificador opcional de la unidad activa.
   */
  requestAdminHandoff(target: string, tenantId?: number): Observable<string> {
    const adminUrl = environment.adminUiUrl || 'http://localhost:8082';
    return of(`${adminUrl}${target}`);
  }

  // --- Métodos Utilitarios Privados ---

  /**
   * Clona profundamente una estructura de datos para asegurar inmutabilidad entre llamadas mock.
   * 
   * @param obj Estructura a clonar.
   * @returns Nueva instancia clonada.
   */
  private deepClone<T>(obj: T): T {
    return structuredClone(obj);
  }
}
