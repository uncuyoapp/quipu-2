import { Component, DestroyRef, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionSyncOutline } from '@ng-icons/ionicons';
import { ScreenOrientationService } from '@services';

/**
 * @class OrientationWarningComponent
 * @description
 * Componente reutilizable que muestra un aviso de rotación de pantalla
 * cuando el dispositivo está en modo portrait y la aplicación requiere landscape.
 */
@Component({
  selector: 'app-orientation-warning',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './orientation-warning.component.html',
  styleUrl: './orientation-warning.component.scss',
  viewProviders: [provideIcons({ ionSyncOutline })]
})
export class OrientationWarningComponent {
  private readonly orientationService = inject(ScreenOrientationService);
  private readonly destroyRef = inject(DestroyRef);

  /** Indica si la pantalla está en sentido vertical */
  public readonly isPortrait = this.orientationService.isPortrait;

  /** Indica si falló el intento de forzar la horizontalidad por hardware (requiere giro manual) */
  public readonly rotationFailed = this.orientationService.rotationFailed;

  /** Indica si el dispositivo es móvil o tablet */
  public readonly isMobile = this.orientationService.isMobile;

  constructor() {
    // Gestión automática de la orientación basada en el ciclo de vida del componente
    this.orientationService.autoManageOrientation(this.destroyRef);
  }
}
