import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStateService } from '@services';

/**
 * Guardián de autenticación para proteger rutas privadas.
 * Verifica si existe una sesión válida y confirmada antes de permitir el acceso.
 * 
 * @returns true si el usuario está autenticado, de lo contrario redirige al login.
 */
export const authGuard = () => {
  const router = inject(Router);
  const sessionState = inject(SessionStateService);

  if (sessionState.hasValidSession() && sessionState.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
