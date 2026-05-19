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
   * Ordena a la directiva interna de gráfico alternar visualmente 
   * la línea o barra correspondiente a una serie específica (usado desde v-actions).
   * 
   * @param serie La serie de datos que se desea alternar.
   */
  toggleSerie(serie: Series): void {
    const chart = this.chartRendered();
    if (chart) {
      chart.chartComponent.onSelectSeries(serie);
    }
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
   * Exporta e inicia la descarga local de la imagen rasterizada del gráfico en formato PNG.
   * Obtiene la estructura vectorial SVG del gráfico, la convierte en un mapa de bits y gatilla la descarga.
   */
  downloadPNG(): void {
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_CHART_DOWNLOADED,
      payload: { id: this.visualizationId() }
    });

    const chart = this.chartRendered();
    if (!chart) {
      console.warn('El gráfico no está disponible para exportar.');
      return;
    }

    const svgResult = chart.export('svg');
    if (typeof svgResult === 'string' && svgResult.trim() !== '') {
      // Priorizamos el título configurado en el gráfico, si no existe o está vacío usamos el nombre de la visualización
      const chartTitle = this.chartOptions()?.title;
      const baseName = (chartTitle && chartTitle.trim() !== '')
        ? chartTitle
        : this.visualizationName();

      // Sanitizamos el nombre del archivo para remover caracteres especiales no válidos o problemáticos en sistemas operativos
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-_]/g, '').trim() || 'grafico';
      this.convertSVGToPNGAndDownload(svgResult, `${sanitizedName}.png`);
    } else {
      console.warn('La exportación falló debido a que la instancia del gráfico aún no está lista o retornó un contenido vacío.');
    }
  }

  /**
   * Convierte una cadena de texto XML que representa un SVG a una imagen en formato PNG
   * y desencadena la descarga local del archivo resultante en el navegador del usuario.
   * 
   * @param svgString Cadena con el contenido XML del SVG generado por el gráfico.
   * @param fileName Nombre por defecto con el que se guardará el archivo PNG.
   */
  private convertSVGToPNGAndDownload(svgString: string, fileName: string): void {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('No se pudo inicializar el contexto 2D del Canvas para la exportación.');
        URL.revokeObjectURL(url);
        return;
      }

      // Definimos un tamaño de alta resolución por defecto para que la imagen no pierda calidad.
      const width = img.naturalWidth || 1280;
      const height = img.naturalHeight || 720;
      canvas.width = width;
      canvas.height = height;

      // Coloreamos un fondo blanco sólido para que el gráfico no sea transparente y se lea correctamente.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Renderizamos la estructura vectorial del SVG sobre el canvas de píxeles.
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const pngDataUrl = canvas.toDataURL('image/png');

        const downloadLink = document.createElement('a');
        downloadLink.href = pngDataUrl;
        downloadLink.download = fileName;
        downloadLink.click();
      } catch (error) {
        console.error('Ocurrió un error al intentar codificar el Canvas a formato PNG:', error);
      } finally {
        // Revocamos la URL temporal para prevenir pérdidas de memoria (memory leaks).
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = (error) => {
      console.error('Ocurrió un error al intentar cargar el recurso SVG en el elemento de imagen temporal:', error);
      URL.revokeObjectURL(url);
    };

    img.src = url;
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
