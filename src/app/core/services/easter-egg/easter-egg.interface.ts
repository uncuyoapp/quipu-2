import { AppEventType } from "@models/events/app-event.types";

/**
 * Define los roles posibles para el juego.
 */
export type GameRole = 'viewer' | 'admin';

/**
 * Define las categorías de los objetivos para organización.
 */
export type GameObjectiveCategory = 'Buscador' | 'Visualización' | 'Temáticas' | 'Gestión' | 'Exploración' | 'Acciones' | 'Análisis' | 'Sistema' | 'Usuario' | 'Creación' | 'Estructura';

/**
 * Interfaz que representa un objetivo individual del juego.
 */
export interface GameObjective {
  /** Identificador único del objetivo */
  id: string;
  /** Descripción clara de lo que el usuario debe hacer */
  description: string;
  /** Pista que se muestra cuando el usuario está inactivo */
  hint: string;
  /** Indica si el objetivo ya fue completado */
  isCompleted: boolean;
  /** Rol mínimo o específico requerido para este objetivo */
  role: GameRole;
  /** Categoría a la que pertenece el objetivo */
  category: GameObjectiveCategory;
  /** Tipo de evento que dispara la completitud de este objetivo */
  eventType: AppEventType;
}

/**
 * Interfaz que representa el estado global del juego.
 */
export interface GameState {
  /** Indica si el juego está activo (personaje flotando) */
  isActive: boolean;
  /** Indica si el usuario ha completado todos sus objetivos */
  isFinished: boolean;
  /** Cantidad de objetivos completados */
  completedCount: number;
  /** Cantidad total de objetivos asignados según el rol */
  totalCount: number;
}
