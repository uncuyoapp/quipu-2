import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, output, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService } from '@services';
import {
  Dataset,
  TableDirective,
  TableOptions
} from '@uncuyoapp/ngx-data-visualizer';

import { ButtonComponent } from '@shared/components/button/button.component';

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

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Referencia hacia la directiva hija subyacente de tabla para invocar métodos públicos directos */
  tableRendered = viewChild.required(TableDirective);

  /** Bandera interna de reflejo para saber si el visor se encuentra en fullscreen dom */
  isFullscreen = false;
  private readonly elementRef = inject(ElementRef);

  /**
   * Genera el llamado local a la directiva para exportar la cuadrícula a Microsoft Excel.
   */
  downloadExcel(): void {
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_TABLE_DOWNLOADED,
      payload: { id: this.visualizationId() }
    });
    this.tableRendered().export('xlsx');
  }

  /**
   * Interactúa nativamente con la API Screen de JS para llevar este wrapper
   * y su contenido hijo al 100% interactivo.
   */
  async toggleFullscreen(): Promise<void> {
    const element = this.elementRef.nativeElement.querySelector('.visualization-container');
    const willEnable = !document.fullscreenElement;

    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_TABLE_FULLSCREEN_TOGGLED,
      payload: { id: this.visualizationId(), enabled: willEnable }
    });

    if (willEnable) {
      await element.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  /**
   * Listener global de Windows Events para persistir el estado entre escapes de teclado o botones.
   */
  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }
}
