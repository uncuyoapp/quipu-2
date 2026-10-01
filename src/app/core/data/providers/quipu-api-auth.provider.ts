import { HttpClient, HttpBackend, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SKIP_AUTH_REFRESH } from '@core/interceptors/auth.interceptor';
import { environment } from '@environments/environment';
import { InformationUnit } from '@models/domain/information-unit.model';
import { User } from '@models/domain/user.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IAuthProvider } from '../auth.provider';

/**
 * Proveedor de autenticación e identidad respaldado por la API REST v2 de Quipu.
 * Las peticiones técnicas de refresco de token se ejecutan de forma directa a través
 * de HttpBackend para evitar la tubería de interceptores y prevenir bucles o recursión.
 */
@Injectable()
export class QuipuApiAuthProvider implements IAuthProvider {
  private readonly http = inject(HttpClient);
  private readonly rawHttp = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = `${environment.apiUrl}/${environment.apiVersion}`;

  /** Mapeo centralizado de endpoints del módulo de autenticación y perfil */
  private readonly endpoints = {
    currentUser: 'auth/me',
    login: 'auth/login',
    logout: 'auth/logout',
    logoutAll: 'auth/logout-all',
    refresh: 'auth/refresh',
    informationUnits: 'auth/information-units',
    selectInformationUnit: 'auth/select-information-unit',
    recoveryPass: 'auth/recovery-pass',
    verifyRecoveryToken: 'auth/verify-recovery-token',
    changePassword: 'auth/change-password',
    updatePassword: 'auth/update-password',
    updateEmail: 'profile/email',
    updateName: 'profile/name',
    updateWorkArea: 'profile/work-area',
    adminHandoff: 'auth/admin-handoff',
  };

  // --- Métodos de Autenticación y Ciclo de Sesión ---

  /**
   * Obtiene la información del usuario autenticado actualmente desde el endpoint 'auth/me'.
   * 
   * @returns Un observable que contiene los datos normalizados del usuario.
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<any>(`${this.baseUrl}/${this.endpoints.currentUser}`).pipe(
      map(res => this.unwrap(res)),
      map(user => this.normalizeUser(user))
    );
  }

  /**
   * Autentica al usuario en el backend mediante credenciales contra 'auth/login'.
   * Envía withCredentials para soportar cookies httpOnly de Refresh Token si aplica.
   * 
   * @param username Nombre de usuario o identificador de acceso.
   * @param password Contraseña en texto plano.
   * @returns Un observable con el usuario autenticado y su Access Token JWT.
   */
  login(username: string, password: string): Observable<User> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.login}`,
      { username, password },
      {
        withCredentials: true,
        context: new HttpContext().set(SKIP_AUTH_REFRESH, true)
      }
    ).pipe(
      map(res => this.unwrap(res)),
      map(data => {
        const user = data.user || data;
        const token = data.token || user.token;
        return this.normalizeUser({ ...user, token });
      })
    );
  }

  /**
   * Cierra la sesión activa en el backend revocando el token de refresco actual.
   * 
   * @returns Un observable que completa una vez efectuada la revocación.
   */
  logout(): Observable<void> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.logout}`,
      {},
      { withCredentials: true }
    ).pipe(map(() => void 0));
  }

  /**
   * Cierra todas las sesiones activas del usuario en todos los dispositivos conectados.
   * 
   * @returns Un observable que completa una vez revocadas todas las sesiones.
   */
  logoutAll(): Observable<void> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.logoutAll}`,
      {},
      { withCredentials: true }
    ).pipe(map(() => void 0));
  }

  /**
   * Renueva el Access Token expirado ejecutando una llamada directa vía HttpBackend.
   * Al eludir la cadena de interceptores HTTP, se eliminan dependencias circulares y recursión.
   * 
   * @returns Un observable que emite la nueva cadena de token JWT renovada.
   */
  refreshToken(): Observable<string> {
    return this.rawHttp.post<any>(
      `${this.baseUrl}/${this.endpoints.refresh}`,
      {},
      { withCredentials: true }
    ).pipe(
      map(res => this.unwrap(res)),
      map(data => {
        const token = data?.token || data;
        if (token && typeof token === 'string') {
          return token;
        }
        throw new Error('Formato de token inválido recibido desde refresh.');
      })
    );
  }

  /**
   * Comprueba si existe una cookie central quipu_sso vigente en el navegador
   * ejecutando una llamada a POST /auth/refresh con withCredentials: true.
   * Si el backend responde 200 con el DTO de usuario, normaliza la entidad.
   * Si responde 401 u otro error, retorna null de forma silenciosa.
   */
  checkSsoSession(): Observable<User | null> {
    return this.rawHttp.post<any>(
      `${this.baseUrl}/${this.endpoints.refresh}`,
      {},
      { withCredentials: true }
    ).pipe(
      map(res => this.unwrap(res)),
      map(data => {
        if (!data || !data.token) {
          return null;
        }

        if (data.user) {
          const user = { ...data.user, token: data.token };
          return this.normalizeUser(user);
        }

        return null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Solicita un ticket de traspaso administrativo efímero a la API v2.
   *
   * @param target Ruta interna en adminUI (ej. '/dataset/12').
   * @param tenantId Identificador opcional de la unidad activa.
   * @returns Un observable que emite la redirectUrl firmada para salto inmediato.
   */
  requestAdminHandoff(target: string, tenantId?: number): Observable<string> {
    const payload = {
      tenantId: tenantId ?? 0,
      target,
      subsystem: 'adminUI',
    };
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.adminHandoff}`,
      payload
    ).pipe(
      map(res => this.unwrap(res)),
      map(data => data.redirectUrl)
    );
  }

  // --- Métodos de Recuperación y Gestión de Contraseñas ---

  /**
   * Solicita el envío de un correo de recuperación de contraseña para la dirección indicada.
   * 
   * @param email Correo electrónico registrado de la cuenta.
   * @returns Un observable con el mensaje de confirmación devuelto por la API.
   */
  recoveryPass(email: string): Observable<string> {
    return this.http.get<any>(
      `${this.baseUrl}/${this.endpoints.recoveryPass}`,
      {
        params: { email },
        context: new HttpContext().set(SKIP_AUTH_REFRESH, true)
      }
    ).pipe(map(res => this.unwrap(res)));
  }

  /**
   * Verifica en el backend la validez y vigencia de un token de recuperación.
   * 
   * @param token Cadena del token de recuperación recibida por URL/correo.
   * @returns Un observable booleano indicando si el token es válido.
   */
  verifyRecoveryToken(token: string): Observable<boolean> {
    return this.http.get<any>(
      `${this.baseUrl}/${this.endpoints.verifyRecoveryToken}`,
      {
        params: { token },
        context: new HttpContext().set(SKIP_AUTH_REFRESH, true)
      }
    ).pipe(map(res => !!this.unwrap(res)));
  }

  /**
   * Establece una nueva contraseña utilizando un token de recuperación validado.
   * 
   * @param token Token de recuperación vigente.
   * @param newPassword Nueva contraseña a asignar.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  changePassword(token: string, newPassword: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.changePassword}`,
      { token, newPassword },
      { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) }
    ).pipe(map(() => true));
  }

  /**
   * Modifica la contraseña del usuario dentro de una sesión activa previa verificación de la actual.
   * 
   * @param oldPassword Contraseña actual del usuario.
   * @param newPassword Nueva contraseña deseada.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updatePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.updatePassword}`,
      { oldPassword, newPassword }
    ).pipe(map(() => true));
  }

  // --- Métodos de Perfil de Usuario ---

  /**
   * Actualiza el correo electrónico del usuario autenticado.
   * 
   * @param newEmail Nueva dirección de correo electrónico.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updateEmail(newEmail: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.updateEmail}`,
      { email: newEmail }
    ).pipe(map(() => true));
  }

  /**
   * Actualiza el nombre de visualización del usuario autenticado.
   * 
   * @param newName Nuevo nombre a asignar.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updateName(newName: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.updateName}`,
      { name: newName }
    ).pipe(map(() => true));
  }

  /**
   * Actualiza el área de trabajo o dependencia asignada al usuario.
   * 
   * @param newArea Nombre o descripción del área laboral.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  updateWorkArea(newArea: string): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.updateWorkArea}`,
      { workArea: newArea }
    ).pipe(map(() => true));
  }

  // --- Métodos de Unidades de Información (Contexto / Tenant) ---

  /**
   * Recupera las Unidades de Información a las que el usuario autenticado tiene acceso.
   * 
   * @returns Un observable con el arreglo de Unidades de Información disponibles.
   */
  getUserInformationUnits(): Observable<InformationUnit[]> {
    return this.http.get<any>(`${this.baseUrl}/${this.endpoints.informationUnits}`).pipe(
      map(res => this.unwrap(res))
    );
  }

  /**
   * Notifica a la API la selección de una Unidad de Información activa para el usuario.
   * 
   * @param unitId Identificador único de la Unidad de Información a activar.
   * @returns Un observable booleano indicando el éxito de la operación.
   */
  selectInformationUnit(unitId: number): Observable<boolean> {
    return this.http.post<any>(
      `${this.baseUrl}/${this.endpoints.selectInformationUnit}`,
      { unitId }
    ).pipe(map(() => true));
  }

  // --- Métodos Utilitarios Privados ---

  /**
   * Desempaqueta la respuesta HTTP estándar de la API extrayendo la propiedad 'data' si existe.
   * 
   * @param response Respuesta cruda devuelta por HttpClient.
   * @returns Payload interno desempaquetado.
   */
  private unwrap(response: any): any {
    return (response && typeof response === 'object' && 'data' in response)
      ? response.data
      : response;
  }

  /**
   * Normaliza la estructura del modelo User asegurando que informationUnits contenga IDs numéricos.
   * 
   * @param user Objeto de usuario recibido desde la API.
   * @returns Entidad User normalizada.
   */
  private normalizeUser(user: any): User {
    return {
      ...user,
      informationUnits: (user.informationUnits || []).map((u: any) =>
        typeof u === 'object' ? u.id : u
      )
    };
  }
}
