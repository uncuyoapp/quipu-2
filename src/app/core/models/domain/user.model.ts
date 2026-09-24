/**
 * @interface User
 * @description
 * Representa a un usuario autenticado dentro de la plataforma.
 * Contiene información de perfil, tokens de acceso y contexto de unidades de información.
 */
export interface User {
  /** Identificador único para el usuario */
  id: number;
  /** Nombre de usuario para inicio de sesión */
  username: string;
  /** Dirección de correo electrónico */
  email: string;
  /** Nombre completo del usuario */
  name: string;
  /** Token de autenticación JWT */
  token: string;
  /** Contraseña del usuario (opcional, usada en flujos de login) */
  password?: string;
  /** Lista de IDs de unidades de información con acceso permitido */
  informationUnits: number[];
  /** ID de la unidad de información activa actualmente */
  selectedIU: number | null;
  /** Rol del usuario en la unidad activa o global (determina permisos de edición y administración) */
  role?: 'admin' | 'editor' | 'viewer';
  /** Área de trabajo o unidad de gestión específica */
  workArea?: string;
}

/** 
 * @interface LoginCredentials
 * @description Credenciales básicas para el flujo de autenticación 
 */
export interface LoginCredentials {
  /** Nombre de usuario o legajo */
  username: string;
  /** Contraseña de acceso */
  password: string;
}
