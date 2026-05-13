import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor de autenticación y manejo de errores globales.
 * - Redirige al login en caso de errores 401 (No autorizado).
 * - Muestra mensajes de error provenientes del servidor mediante un SnackBar.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 y no estamos ya en el login, redirigir
      if (error.status === 401 && router.url !== '/login') {
        router.navigate(['/login']);
      }

      // Mostrar mensaje de error si el servidor provee uno descriptivo
      if (error.error?.message) {
        showSnackMessage(error.error?.message);
      }

      return throwError(() => error);
    })
  );

  /**
   * Muestra un mensaje temporal en la parte inferior de la pantalla.
   * @param message Mensaje a mostrar.
   */
  function showSnackMessage(message: string) {
    snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
};
