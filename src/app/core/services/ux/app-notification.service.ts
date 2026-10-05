import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationToastComponent, NotificationToastData, NotificationType } from '@shared/components/notification-toast/notification-toast.component';

/**
 * Opciones de configuración para las notificaciones.
 * Extiende MatSnackBarConfig para soportar todas las opciones nativas de Angular Material (ej. duration: 0)
 * y añade la propiedad opcional action para definir el texto del botón.
 */
export interface AppNotificationOptions extends MatSnackBarConfig {
  /** Texto opcional para el botón de acción (ej. 'Cerrar', 'Actualizar') */
  action?: string;
}

/**
 * @class AppNotificationService
 * @description
 * Servicio centralizado para la gestión de notificaciones tipo SnackBar (Toasts).
 * Proporciona una interfaz simplificada para mostrar mensajes informativos,
 * de éxito, advertencia o error, manteniendo la consistencia visual y semántica.
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
   * Método base para abrir un toast con el componente personalizado.
   */
  private openToast(type: NotificationType, message: string, action?: string, config?: MatSnackBarConfig): MatSnackBarRef<NotificationToastComponent> {
    const panelClasses = ['app-snack', `app-snack-${type}`];
    if (config?.panelClass) {
      if (Array.isArray(config.panelClass)) {
        panelClasses.push(...config.panelClass);
      } else {
        panelClasses.push(config.panelClass);
      }
    }

    return this.snackBar.openFromComponent<NotificationToastComponent, NotificationToastData>(
      NotificationToastComponent,
      {
        ...this.defaultConfig,
        ...config,
        panelClass: panelClasses,
        data: {
          message,
          action,
          type
        }
      }
    );
  }

  /**
   * Muestra un mensaje informativo básico.
   * @param message El mensaje a mostrar.
   * @param options Configuración opcional (duration, action, panelClass, etc.).
   * @returns Referencia al snackbar abierto para suscribirse a acciones.
   */
  info(message: string, options?: AppNotificationOptions) {
    return this.openToast('info', message, options?.action, options);
  }

  /**
   * Muestra un mensaje de éxito.
   * @param message El mensaje de éxito.
   * @param options Configuración opcional (duration, action: 'Cerrar' por defecto, panelClass, etc.).
   */
  success(message: string, options?: AppNotificationOptions) {
    return this.openToast('success', message, options?.action ?? 'Cerrar', options);
  }

  /**
   * Muestra un mensaje de error.
   * @param message El mensaje de error.
   * @param options Configuración opcional (duration: 8000 por defecto, action: 'Cerrar' por defecto, etc.).
   */
  error(message: string, options?: AppNotificationOptions) {
    return this.openToast('error', message, options?.action ?? 'Cerrar', {
      duration: 8000,
      ...options
    });
  }

  /**
   * Muestra un mensaje de advertencia.
   * @param message El mensaje de advertencia.
   * @param options Configuración opcional (duration, action: 'Cerrar' por defecto, etc.).
   */
  warn(message: string, options?: AppNotificationOptions) {
    return this.openToast('warn', message, options?.action ?? 'Cerrar', options);
  }
}

