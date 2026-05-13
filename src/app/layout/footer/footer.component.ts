import { Component, inject } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { environment } from '@environments/environment';
import { NgIconComponent } from '@ng-icons/core';
import { EditModeService } from '@services';

/**
 * Componente de pie de página (Footer).
 * Proporciona acceso al interruptor de modo de edición y muestra información de versión.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  // ============================================
  // Dependencias (inject)
  // ============================================

  /** Configuración gráfica centralizada para el Footer */
  protected readonly graphics = SECTION_GRAPHICS.footer;

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Servicio para gestionar el estado del modo de edición y permisos de usuario. */
  public readonly editModeService = inject(EditModeService);

  /** Versión actual de la aplicación extraída del entorno */
  public readonly version = environment.appVersion;
}
