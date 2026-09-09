import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { APP_ICONS } from '@core/config/icons.config';
import { DownloadAvailability, DownloadOptions } from '@models/common/download.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { Dimension } from '@models/domain/dataset.model';

/**
 * @class VDownloadsModalComponent
 * @description
 * Componente modal que muestra un wizard de selección de partes del reporte a descargar.
 * Permite filtrar opciones deshabilitadas por contexto de la visualización actual
 * (ej: no se puede descargar un gráfico si este no está referenciado).
 */
@Component({
  selector: 'app-v-downloads-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ButtonComponent,
    CheckboxComponent
  ],
  templateUrl: './v-downloads-modal.component.html',
  styleUrl: './v-downloads-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VDownloadsModalComponent implements OnInit {
  /** Referencia inyectada para controlar el cierre y pase de retornos de la ventana */
  private readonly dialogRef = inject(MatDialogRef<VDownloadsModalComponent>);

  protected readonly icons = APP_ICONS;

  /** Datos de contexto inicial pasados a la apertura del modal (ej: qué descargar) */
  data = inject<{ dimensions: Dimension[], availability: DownloadAvailability }>(MAT_DIALOG_DATA);

  /** Colección local de dimensiones analizadas */
  dimensions: Dimension[] = [];

  /** Reflejo reactivo de las disponibilidades de descarga inyectadas en la apertura */
  availability: DownloadAvailability = { chart: false, table: false, multiCharts: false };

  /** Objeto reactivo (bidireccional por ngModel) con la selección activa de descargas */
  options: DownloadOptions = {
    fiche: true,
    chart: true,
    table: true,
    multiCharts: true
  };

  /**
   * Ciclo de vida de inicialización. 
   * Prepara los valores default y oculta forzosamente (checkbox en false)
   * las opciones de descarga que no tengan disponibilidad en el bloque.
   */
  ngOnInit(): void {
    this.dimensions = this.data.dimensions;
    this.availability = this.data.availability;

    // Reset options based on availability
    if (!this.availability.chart) this.options.chart = false;
    if (!this.availability.table) this.options.table = false;
    if (!this.availability.multiCharts) this.options.multiCharts = false;
  }

  /**
   * Verifica dinámicamente si existe al menos una opción de descarga tildada.
   * Utilizado para bloquear/desbloquear el botón primario del diálogo.
   * 
   * @returns Verdadero si hay algo seleccionado para ser derivado a PDF/Excel/Imagen.
   */
  get isAnyOptionSelected(): boolean {
    return Object.values(this.options).some(value => value === true);
  }

  /**
   * Cierra ordenadamente la pantalla delegando al padre el objeto procesado.
   */
  onConfirm(): void {
    this.dialogRef.close(this.options);
  }

  /**
   * Cierra el modal sin retornar datos.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
