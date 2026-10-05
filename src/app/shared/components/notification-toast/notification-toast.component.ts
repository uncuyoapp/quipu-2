import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';

export type NotificationType = 'info' | 'success' | 'warn' | 'error';

export interface NotificationToastData {
  message: string;
  action?: string;
  type: NotificationType;
}

/**
 * Componente Toast para Angular Material MatSnackBar.
 * Presenta una tarjeta con fondo claro, borde lateral de color semántico,
 * icono correspondiente y botón de acción opcional.
 */
@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    MatButtonModule,
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarAction
  ],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent {
  readonly data: NotificationToastData = inject(MAT_SNACK_BAR_DATA);
  readonly snackBarRef = inject(MatSnackBarRef<NotificationToastComponent>);
  protected readonly icons = APP_ICONS;

  protected readonly iconName = computed(() => {
    switch (this.data.type) {
      case 'success':
        return this.icons.status.success;
      case 'warn':
        return this.icons.status.warning;
      case 'error':
        return this.icons.status.error;
      case 'info':
      default:
        return this.icons.status.info;
    }
  });

  protected readonly iconColor = computed(() => {
    switch (this.data.type) {
      case 'success':
        return 'var(--q-snack-success)';
      case 'warn':
        return 'var(--q-snack-warn)';
      case 'error':
        return 'var(--q-snack-error)';
      case 'info':
      default:
        return 'var(--q-primary)';
    }
  });

  onAction(): void {
    this.snackBarRef.dismissWithAction();
  }
}
