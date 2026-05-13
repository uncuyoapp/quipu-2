import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { APP_ICONS } from '@core/config/icons.config';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ButtonPalette } from '@shared/components/button/button.config';

/**
 * Interfaz para los datos que recibe el diálogo de confirmación.
 */
export interface ConfirmDialogData {
  /** Título del diálogo. */
  title: string;
  /** Mensaje o descripción de la acción. */
  message: string;
  /** Texto del botón de confirmación. */
  confirmText?: string;
  /** Texto del botón de cancelación. */
  cancelText?: string;
  /** Paleta de color para el botón de confirmación. */
  confirmPalette?: ButtonPalette;
  /** Paleta de color para el botón de cancelación. */
  cancelPalette?: ButtonPalette;
}

/**
 * Componente genérico para diálogos de confirmación.
 * 
 * Permite mostrar un título, un mensaje y dos botones de acción parametrizables.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  /** Referencia al diálogo actual. */
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  /** Datos inyectados en el diálogo. */
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  protected readonly icons = APP_ICONS;

  /**
   * Maneja la acción de cancelar o cerrar sin confirmar.
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Maneja la acción de confirmar la operación.
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
