import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataReadService, SessionStateService } from '@services';

/**
 * Guardián de autenticación para proteger rutas privadas.
 * Verifica si existe una sesión válida y confirmada antes de permitir el acceso.
 * 
 * @returns true si el usuario está autenticado, de lo contrario redirige al login.
 */
export const authGuard = () => {
  const router = inject(Router);
  const sessionState = inject(SessionStateService);
  const dataRead = inject(DataReadService);

  // Primero verifica si tenemos una sesión válida (usuario + token)
  if (sessionState.hasValidSession()) {
    // Verificación adicional: estado de autenticación con el proveedor de datos
    if (dataRead.isAuthenticated()) {
      return true;
    }
  }

  // Si no hay sesión o no está autenticado, redirigir al login y limpiar datos
  router.navigate(['/login']);
  return false;
};
