import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * @class AppNotificationService
 * @description
 * Servicio centralizado para la gestión de notificaciones tipo SnackBar (Toasts).
 * Proporciona una interfaz simplificada para mostrar mensajes informativos,
 * de éxito, advertencia o error, manteniendo la consistencia visual.
 */
@Injectable({
  providedIn: 'root'
})
export class AppNotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /** Configuración por defecto para las notificaciones */
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  /**
   * Muestra un mensaje informativo básico.
   * @param message El mensaje a mostrar.
   * @param action Texto opcional para el botón de acción.
   * @param config Configuración adicional opcional.
   * @returns Referencia al snackbar abierto para suscribirse a acciones.
   */
  info(message: string, action?: string, config?: MatSnackBarConfig) {
    return this.snackBar.open(message, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: config?.panelClass ? [...(Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass]), 'app-snack-info'] : 'app-snack-info'
    });
  }

  /**
   * Muestra un mensaje de éxito.
   * @param message El mensaje de éxito.
   */
  success(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      panelClass: 'app-snack-success'
    });
  }

  /**
   * Muestra un mensaje de error.
   * @param message El mensaje de error.
   */
  error(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: 8000,
      panelClass: 'app-snack-error'
    });
  }

  /**
   * Muestra un mensaje de advertencia.
   * @param message El mensaje de advertencia.
   */
  warn(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      panelClass: 'app-snack-warn'
    });
  }
}
