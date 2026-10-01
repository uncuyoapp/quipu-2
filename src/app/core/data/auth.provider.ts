import { InformationUnit } from '@models/domain/information-unit.model';
import { User } from '@models/domain/user.model';
import { Observable } from 'rxjs';

/**
 * Contrato abstracto para la gestión de autenticación, identidad y sesión de usuario.
 * Desacopla la seguridad de los proveedores de datos de negocio.
 */
export abstract class IAuthProvider {
  // --- Métodos de Autenticación y Ciclo de Sesión ---

  /**
   * Obtiene la información del usuario autenticado actualmente en la sesión.
   * 
   * @returns Un observable que contiene los datos del usuario actual.
   */
  abstract getCurrentUser(): Observable<User>;

  /**
   * Autentica al usuario en el sistema utilizando sus credenciales de acceso.
   * 
   * @param username Nombre de usuario o identificador de inicio de sesión.
   * @param password Contraseña en texto plano para validación.
   * @returns Un observable que contiene los datos del usuario autenticado.
   */
  abstract login(username: string, password: string): Observable<User>;

  /**
   * Cierra la sesión activa del usuario actual e invalida el token de acceso.
   * 
   * @returns Un observable que completa una vez finalizado el cierre de sesión.
   */
  abstract logout(): Observable<void>;

  /**
   * Invalida todas las sesiones activas del usuario en todos los dispositivos conectados.
   * 
   * @returns Un observable que completa una vez cerradas todas las sesiones.
   */
  abstract logoutAll(): Observable<void>;

  /**
   * Renueva el token de acceso (Access Token) mediante el mecanismo de refresco silencioso (RTR).
   * 
   * @returns Un observable que emite la nueva cadena de token JWT.
   */
  abstract refreshToken(): Observable<string>;

  /**
   * Comprueba de manera silenciosa si el navegador posee una sesión central de SSO
   * activa a través de la cookie de dominio compartido (quipu_sso).
   * 
   * @returns Un observable que emite el usuario autenticado e hidratado si la cookie
   *          es válida, o null si el usuario es anónimo o la sesión fue revocada.
   */
  abstract checkSsoSession(): Observable<User | null>;

  /**
   * Solicita un ticket efímero de salto administrativo (Handoff OTT) hacia el recurso y tenant indicados.
   *
   * @param target Ruta interna en adminUI (ej. '/dataset/12').
   * @param tenantId Identificador opcional de la unidad activa.
   * @returns Un observable que emite la redirectUrl firmada para salto inmediato.
   */
  abstract requestAdminHandoff(target: string, tenantId?: number): Observable<string>;

  // --- Métodos de Recuperación y Gestión de Contraseñas ---

  /**
   * Solicita el envío de un correo electrónico con instrucciones para recuperar la contraseña.
   * 
   * @param email Dirección de correo electrónico asociada a la cuenta.
   * @returns Un observable con el mensaje de confirmación del proceso de recuperación.
   */
  abstract recoveryPass(email: string): Observable<string>;

  /**
   * Valida si un token de recuperación de contraseña es legítimo y se encuentra vigente.
   * 
   * @param token Token de recuperación recibido en el enlace de correo.
   * @returns Un observable indicando si el token es válido.
   */
  abstract verifyRecoveryToken(token: string): Observable<boolean>;

  /**
   * Establece una nueva contraseña utilizando un token de recuperación válido.
   * 
   * @param token Token de recuperación validado previamente.
   * @param newPassword Nueva contraseña a asignar a la cuenta.
   * @returns Un observable indicando si el cambio fue exitoso.
   */
  abstract changePassword(token: string, newPassword: string): Observable<boolean>;

  /**
   * Actualiza la contraseña del usuario dentro de una sesión activa verificando la actual.
   * 
   * @param oldPassword Contraseña actual del usuario.
   * @param newPassword Nueva contraseña deseada.
   * @returns Un observable indicando si la actualización fue exitosa.
   */
  abstract updatePassword(oldPassword: string, newPassword: string): Observable<boolean>;

  // --- Métodos de Perfil de Usuario ---

  /**
   * Modifica la dirección de correo electrónico del usuario autenticado.
   * 
   * @param newEmail Nueva dirección de correo electrónico.
   * @returns Un observable indicando si la actualización fue exitosa.
   */
  abstract updateEmail(newEmail: string): Observable<boolean>;

  /**
   * Actualiza el nombre completo o de visualización del usuario autenticado.
   * 
   * @param newName Nuevo nombre a establecer.
   * @returns Un observable indicando si la actualización fue exitosa.
   */
  abstract updateName(newName: string): Observable<boolean>;

  /**
   * Actualiza el área de trabajo o dependencia asignada al usuario autenticado.
   * 
   * @param newArea Nombre o descripción de la nueva área de trabajo.
   * @returns Un observable indicando si la actualización fue exitosa.
   */
  abstract updateWorkArea(newArea: string): Observable<boolean>;

  // --- Métodos de Unidades de Información (Contexto / Tenant) ---

  /**
   * Obtiene la lista de Unidades de Información (tenants) a las que el usuario autenticado tiene acceso.
   * 
   * @returns Un observable que contiene el arreglo de unidades de información accesibles.
   */
  abstract getUserInformationUnits(): Observable<InformationUnit[]>;

  /**
   * Selecciona y activa una Unidad de Información específica para el contexto de la sesión actual.
   * 
   * @param unitId Identificador único de la Unidad de Información a activar.
   * @returns Un observable indicando si la selección fue exitosa.
   */
  abstract selectInformationUnit(unitId: number): Observable<boolean>;
}
