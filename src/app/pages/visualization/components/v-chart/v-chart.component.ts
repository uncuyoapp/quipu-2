import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, input, model, OnInit, output, signal, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService, FullscreenService } from '@services';
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
export class VChartComponent implements OnInit {
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

  /** Título o nombre de la visualización para usar como fallback en el nombre de archivo descargado */
  visualizationName = input<string>('grafico');

  private readonly eventBus = inject(AppEventBusService);
  private readonly fullscreenService = inject(FullscreenService);
  private readonly elementRef = inject(ElementRef);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** 
   * Referencia reactiva a la instancia interna de la directiva ChartDirective
   * para poder ejecutar acciones directas sobre ella mediante la API de visualización.
   */
  chartRendered = viewChild(ChartDirective);

  /** Señal de control para retrasar el renderizado del gráfico y evitar desajustes de tamaño en el DOM */
  protected isChartVisible = signal<boolean>(false);

  ngOnInit(): void {
    // Retrasamos el primer renderizado para que la caja contenedora en el DOM termine de estructurarse
    setTimeout(() => {
      this.isChartVisible.set(true);
    }, 150);
  }

  /** Determina si el componente está actualmente en modo pantalla completa */
  protected isFullscreen = computed(() => {
    const container = this.elementRef.nativeElement.querySelector('.visualization-container');
    return this.fullscreenService.isActive(container)();
  });

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
   * Alterna programáticamente la proyección apilada del gráfico 
   * para computarla al 100% de la base.
   */
  toPercentage(): void {
    const chart = this.chartRendered();
    if (chart) {
      chart.toPercentage();
    }
  }

  /**
   * Abre o cierra el panel de edición de configuración del gráfico
   * invocando la función expuesta por el motor de la librería.
   */
  toggleEditor(): void {
    const chart = this.chartRendered();
    if (chart) {
      chart.toggleEditor();
    }
  }

  /**
   * Exporta e inicia la descarga local de la imagen del gráfico en formato PNG.
   */
  downloadPNG(): void {
    const chart = this.chartRendered();
    if (!chart) {
      return;
    }
    chart.export('png');
  }

  /**
   * Alterna el estado de pantalla completa delegando la lógica al servicio centralizado.
   */
  async toggleFullscreen(): Promise<void> {
    const container = this.elementRef.nativeElement.querySelector('.visualization-container');
    const willEnable = !this.isFullscreen();

    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_CHART_FULLSCREEN_TOGGLED,
      payload: { id: this.visualizationId(), enabled: willEnable }
    });

    // Ocultamos temporalmente el gráfico para evitar redibujados con dimensiones intermedias durante la animación
    this.isChartVisible.set(false);

    await this.fullscreenService.toggle(container);

    // Forzamos un resize y volvemos a renderizar el gráfico una vez que la animación y estilos se asienten
    setTimeout(() => {
      //window.dispatchEvent(new Event('resize'));
      this.isChartVisible.set(true);
    }, 300);
  }
}
