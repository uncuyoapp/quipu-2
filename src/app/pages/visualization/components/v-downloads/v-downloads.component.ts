import { Component, inject, input, output } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { DownloadAvailability, DownloadOptions } from '@models/common/download.model';
import { NgIconComponent } from '@ng-icons/core';
import { Dimension } from '@uncuyoapp/ngx-data-visualizer';
import { VDownloadsModalComponent } from './v-downloads-modal/v-downloads-modal.component';

/**
 * @class VDownloadsComponent
 * @description
 * Componente que presenta el banner de acción para iniciar el proceso de descarga.
 * Abre una ventana modal modal para que el usuario seleccione qué elementos del
 * reporte desea incluir (gráfico, tabla, gráficos por dimensión, etc.).
 */
@Component({
  selector: 'app-v-downloads',
  standalone: true,
  imports: [NgIconComponent, MatDialogModule],
  templateUrl: './v-downloads.component.html',
  styleUrls: ['./v-downloads.component.scss'],
})
export class VDownloadsComponent {
  /** Arreglo de dimensiones disponibles en el dataset actual */
  dimensions = input.required<Dimension[]>();

  /** Configuración gráfica centralizada */
  public readonly graphics = SECTION_GRAPHICS.visualizations;

  /** 
   * Objeto que determina qué bloques lógicos de descarga están disponibles 
   * en el momento de la ejecución (ej: si hay tabla habilitada, si hay chart base).
   */
  availability = input.required<DownloadAvailability>();

  /** Evento emitido con la selección consolidada del usuario para aplicar la descarga */
  download = output<DownloadOptions>();

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  private readonly dialog = inject(MatDialog);

  /**
   * Abre el modal de configuración de descargas.
   * Si el usuario finaliza exitosamente el wizard, emite el evento con formato
   * y opciones seleccionadas; de lo contrario se ignora (cierre o cancelación).
   */
  onClickDownload(): void {
    const dialogRef = this.dialog.open(VDownloadsModalComponent, {
      width: '600px',
      panelClass: 'downloads-dialog',
      data: {
        dimensions: this.dimensions(),
        availability: this.availability(),
      },
    });

    dialogRef.afterClosed().subscribe((result: DownloadOptions | undefined) => {
      if (result) {
        this.download.emit(result);
      }
    });
  }
}
