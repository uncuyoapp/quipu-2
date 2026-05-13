import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';

export type AlertBadgePalette = 'info' | 'success' | 'warning' | 'alert';

/**
 * Componente AlertBadge para mostrar mensajes de alerta o información con un icono automátic.
 * Diseñado para ser reutilizable en diversas partes de la aplicación.
 */
@Component({
  selector: 'app-alert-badge',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './alert-badge.component.html',
  styleUrls: ['./alert-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertBadgeComponent {
  protected readonly icons = APP_ICONS;

  /** Mensaje a mostrar en el badge */
  readonly message = input.required<string>();

  /** Paleta de colores para el badge (determina el icono automáticamente) */
  readonly palette = input<AlertBadgePalette>('info');

  /** Icono seleccionado automáticamente según la paleta */
  protected icon = computed(() => {
    const iconsMap: Record<AlertBadgePalette, string> = {
      info: this.icons.status.info,
      success: this.icons.status.success,
      warning: this.icons.status.warning,
      alert: this.icons.status.alert
    };
    return iconsMap[this.palette()];
  });

  /** Color hexadecimal para el icono (algunos iconos de ng-icons no heredan color) */
  protected iconColor = computed(() => {
    const colors: Record<AlertBadgePalette, string> = {
      info: 'var(--q-info)',
      success: 'var(--q-success)',
      warning: 'var(--q-warning)',
      alert: 'var(--q-danger)'
    };
    return colors[this.palette()];
  });
}
