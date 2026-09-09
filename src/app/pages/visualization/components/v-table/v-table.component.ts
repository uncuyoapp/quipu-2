import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService, FullscreenService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { Dataset } from '@models/domain/dataset.model';
import { TableOptions } from '@models/domain/visualization.model';
import { TableDirective, ThemeService } from '@uncuyoapp/ngx-data-visualizer';

/**
 * @class VTableComponent
 * @description
 * Componente contenedor de la tabla de visualización directiva (ngx-data-visualizer).
 * Acredita funcionalidades de descarga (XLSX) y proyección expandida en pantalla completa.
 */
@Component({
  selector: 'app-v-table',
  standalone: true,
  imports: [
    CommonModule,
    TableDirective,
    NgIconComponent,
    ButtonComponent
  ],
  templateUrl: './v-table.component.html',
  styleUrl: './v-table.component.scss',
})
export class VTableComponent {
  /** Dataset computado inyectado por el componente padre para renderizar filas y columnas */
  dataset = input.required<Dataset>();

  /** Opciones de configuración de tabla estricta inyectadas según vista actual */
  tableOptions = input.required<TableOptions>();
  /** Emisor lanzado hacia el padre cuando ocurre una mutación interna mediante su grid editor */
  tableOptionsChange = output<TableOptions>();

  /** Habilitador de controles de edición */
  editMode = input<boolean>(false);

  /** Evento emitido cuando se solicita la eliminación del bloque */
  onRemove = output<void>();

  /** ID de la visualización para los eventos */
  visualizationId = input<string | number>('unknown');

  private readonly eventBus = inject(AppEventBusService);
  private readonly fullscreenService = inject(FullscreenService);
  private readonly elementRef = inject(ElementRef);
  private readonly tableTheme = inject(ThemeService);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Referencia hacia la directiva hija subyacente de tabla para invocar métodos públicos directos */
  tableRendered = viewChild(TableDirective);

  /** Determina si el componente está actualmente en modo pantalla completa */
  protected isFullscreen = computed(() => {
    const container = this.elementRef.nativeElement.querySelector('.visualization-container');
    return this.fullscreenService.isActive(container)();
  });

  /**
   * Cambia el modo de visualización de los valores de la tabla invocando la API del motor de tablas de la librería.
   *
   * @param event Evento de cambio generado por el select desplegable.
   */
  onValueDisplayChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'nominal' | 'percentOfTotal' | 'percentOfRow' | 'percentOfColumn';
    const table = this.tableRendered();
    if (table) {
      table.setValueDisplay(value);
    }
  }

  /**
   * Abre o cierra el panel de edición de configuración de la tabla
   * invocando la función expuesta por el motor de la librería.
   */
  toggleEditor(): void {
    const table = this.tableRendered();
    if (table) {
      table.toggleEditor();
    }
  }

  /**
   * Genera el llamado local a la directiva para exportar la cuadrícula a Microsoft Excel.
   */
  downloadExcel(): void {
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_TABLE_DOWNLOADED,
      payload: { id: this.visualizationId() }
    });
    this.tableRendered()?.export('xlsx');
  }

  /**
   * Alterna el estado de pantalla completa delegando la lógica al servicio centralizado.
   */
  async toggleFullscreen(): Promise<void> {
    const container = this.elementRef.nativeElement.querySelector('.visualization-container');
    const willEnable = !this.isFullscreen();

    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_TABLE_FULLSCREEN_TOGGLED,
      payload: { id: this.visualizationId(), enabled: willEnable }
    });

    await this.fullscreenService.toggle(container);

    // Forzamos un evento de resize global tras el cambio de estado de la UI
    // para que la librería recalcule sus dimensiones si fuera necesario.
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }
}
