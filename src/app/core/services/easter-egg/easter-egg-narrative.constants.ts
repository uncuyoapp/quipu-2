/**
 * Constantes narrativas para el sistema del Anciano Quipu.
 * Centraliza todos los mensajes para facilitar cambios de tono o correcciones.
 */
export const EASTER_EGG_NARRATIVE = {
  /** Mensaje de bienvenida inicial */
  INTRO: '¡Saludos, buscador de verdades!\n Soy el Anciano de Quipu. Nuestra memoria ancestral está fragmentada... los hilos del Quipu se han enredado en el caos del tiempo.\n ¿Te gustaría ayudarme a restaurarlos?',

  /** Mensaje tras aceptar la misión */
  MISSION_CONFIRMED: '¡Excelente! Cada acción que realices nos acercará a la sabiduría olvidada. Ayúdame a reconstruir el Quipu explorando el sistema.',

  /** Hito: Completar la fase de Explorador (Viewer) */
  PHASE_EXPLORER_COMPLETED: '¡Felicidades!\nHas alcanzado el nivel de Explorador.',

  /** Hito: Desbloquear los objetivos de Guardián (v5) */
  PHASE_GUARDIAN_UNLOCKED: '¡Increíble!\nHas desbloqueado los objetivos del Guardián de Quipu.',

  /** Éxito al completar un objetivo individual */
  OBJECTIVE_SUCCESS: (description: string) => `¡Excelente! Hilo encontrado:\n "${description}"`,

  /** Mensaje de finalización total del juego */
  GAME_FINISHED: '¡Increíble!\nHas dominado todos los secretos del Quipu.\n¡Mira esta recompensa!',

  /** Prefijo para las pistas de inactividad */
  HINT_PREFIX: '¿Buscas un nuevo hilo?\n',

  /** Mensajes de ayuda/debug */
  DEBUG: {
    VIEWER_NEAR_COMPLETE: 'Atajo: Te falta 1 hilo de Explorador para completar la fase.',
    ADMIN_NEAR_COMPLETE: 'Atajo: Te falta 1 hilo de Guardián para completar la misión.'
  }
} as const;
