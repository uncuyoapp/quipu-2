import { inject } from '@angular/core';
import { SessionStateService } from '@services';
import { Observable, throwError } from 'rxjs';

/**
 * Genera un wrapper para proteger acciones que requieren privilegios de administrador.
 * Debe ser invocado durante la fase de inicialización (propiedad de clase) para capturar el contexto de inyección.
 * 
 * @returns Función que envuelve un observable con validación de rol.
 */
export function useAdminGuard() {
  const sessionState = inject(SessionStateService);

  return <T>(action$: Observable<T>): Observable<T> => {
    const user = sessionState.user();

    if (user?.role !== 'admin') {
      console.error('[Seguridad] Acción denegada: se requiere rol admin.');
      return throwError(() => new Error('FORBIDDEN: Se requiere rol de administrador.'));
    }

    return action$;
  };
}
