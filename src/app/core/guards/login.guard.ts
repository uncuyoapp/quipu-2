import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStateService } from '@services';

/**
 * Guardián para la página de login.
 * Evita que usuarios ya autenticados accedan nuevamente al formulario de inicio de sesión.
 * 
 * @returns true si el usuario no está autenticado, de lo contrario redirige al home.
 */
export const loginGuard = () => {
  const router = inject(Router);
  const sessionState = inject(SessionStateService);

  if (sessionState.hasValidSession()) {
    router.navigate(['/home']);
    return false;
  }
  return true;
};
