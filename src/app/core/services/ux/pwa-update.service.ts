import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { environment } from '@environments/environment';
import { filter } from 'rxjs';
import { AppNotificationService } from './app-notification.service';

/**
 * @class PwaUpdateService
 * @description
 * Servicio encargado de gestionar las actualizaciones de la PWA (Service Worker).
 * Determina si la aplicación debe recargarse automáticamente tras descargar una nueva
 * versión (entorno Testing) o si debe solicitar confirmación al usuario (entorno Producción).
 */
@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly notification = inject(AppNotificationService);

  constructor() {
    this.checkForUpdates();
  }

  /**
   * Inicializa el listener para detectar y manejar nuevas versiones de la aplicación.
   */
  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        // Consultar entorno: Si es producción (oficial) se recomienda avisar, sino (en dev/test) recargamos automáticamente.
        // const isOfficialProduction = environment.production && !environment.useMockData;

        this.promptUser();
        // if (isOfficialProduction) {
        //   this.promptUser();
        // } else {
        //   this.reloadApp();
        // }
      });
  }

  /**
   * Muestra un diálogo al usuario indicando que hay una nueva versión disponible.
   */
  private promptUser(): void {
    const snackRef = this.notification.info(
      'Hay una nueva versión de Quipu disponible.',
      'Actualizar',
      {
        duration: 0, // No se cierra automáticamente
        panelClass: 'update-snackbar'
      }
    );

    snackRef.onAction().subscribe(() => {
      this.reloadApp();
    });
  }

  /**
   * Fuerza la recarga completa del navegador para aplicar el nuevo Service Worker.
   */
  private reloadApp(): void {
    // Es posible forzar al SW a activarse inmediatamente, 
    // pero document.location.reload() basta si ya se descargó.
    document.location.reload();
  }
}
