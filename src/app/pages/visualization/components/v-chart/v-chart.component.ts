import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, model, output, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService } from '@services';
import {
  ChartDirective,
  ChartOptions,
  Dataset,
  Series,
} from '@uncuyoapp/ngx-data-visualizer';

import { ButtonComponent } from '@shared/components/button/button.component';

/**
 * @class VChartComponent
 * @description
 * Componente contenedor que orquesta la directiva de gráficos (ngx-data-visualizer).
 * Incorpora funcionalidades de descarga, vista en pantalla completa y 
 * delegación de vistas porcentuales.
 */
@Component({
  selector: 'app-v-chart',
  standalone: true,
  imports: [CommonModule, ChartDirective, NgIconComponent, ButtonComponent],
  templateUrl: './v-chart.component.html',
  styleUrl: './v-chart.component.scss',
})
export class VChartComponent {
  /** Dataset inyectado desde el componente padre con los datos computados */
  dataset = input.required<Dataset>();

  /** Opciones de configuración base para renderizar el gráfico inicial */
  chartOptions = input.required<ChartOptions>();

  /** Evento emitido hacia el padre cuando se guarda una modificación desde el editor embebido */
  chartOptionsChange = output<ChartOptions>();

  /** Arreglo bidireccional de series para el renderizado del gráfico */
  series = model<Series[]>();

  /** 
   * Determina si se habilitan las interacciones de UI de configuración.
   * Por defecto es falso (modo de solo visualización).
   */
  editMode = input<boolean>(false);

  /** Evento emitido cuando se solicita la eliminación del bloque */
  onRemove = output<void>();

  /** ID de la visualización para los eventos */
  visualizationId = input<string | number>('unknown');

  private readonly eventBus = inject(AppEventBusService);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** 
   * Referencia reactiva a la instancia interna de la directiva ChartDirective
   * para poder ejecutar acciones directas sobre ella mediante la API de visualización.
   */
  chartRendered = viewChild.required(ChartDirective);

  /** Estado interno que rige la visualización condicional de UI en pantalla completa */
  isFullscreen = false;
  private readonly elementRef = inject(ElementRef);

  /**
   * Captura el evento de mutación en la selección local de series 
   * y sincroniza de regreso el modelo hacia el padre (v-actions o layout).
   * 
   * @param series El nuevo estado arreglo de series.
   */
  onSeriesChange(series: Series[]): void {
    this.series.set(series);
  }

  /**
   * Ordena a la directiva interna de gráfico alternar visualmente 
   * la línea o barra correspondiente a una serie específica (usado desde v-actions).
   * 
   * @param serie La serie de datos que se desea alternar.
   */
  toggleSerie(serie: Series): void {
    this.chartRendered().chartComponent.onSelectSeries(serie);
  }

  /**
   * Alterna programáticamente la proyección apilada del gráfico 
   * para computarla al 100% de la base.
   */
  toPercentage(): void {
    this.chartRendered().toPercentage();
  }

  /**
   * Exporta e inicia la descarga local de la imagen rastrerizada del gráfico.
   */
  downloadPNG(): void {
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_CHART_DOWNLOADED,
      payload: { id: this.visualizationId() }
    });
    this.chartRendered().export('jpg');
  }

  /**
   * Solicita asincrónicamente al navegador elevar el contexto de esta vista a pantalla completa,
   * o bien, salir de pantalla completa si ya se encontrara activa.
   */
  async toggleFullscreen(): Promise<void> {
    const element = this.elementRef.nativeElement.querySelector('.visualization-container');
    const willEnable = !document.fullscreenElement;

    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_CHART_FULLSCREEN_TOGGLED,
      payload: { id: this.visualizationId(), enabled: willEnable }
    });

    if (willEnable) {
      await element.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  /**
   * Listener global de ventana para sincronizar nuestro estado local `isFullscreen` 
   * cuando el usuario entra o sale de este modo, inclusive si pulsa (ESC).
   */
  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;

    // Disparar un evento de redimensionamiento global para que ECharts se ajuste
    // Se usa un pequeño delay para asegurar que el DOM ya aplicó los nuevos estilos
    if (this.isFullscreen) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }
}
