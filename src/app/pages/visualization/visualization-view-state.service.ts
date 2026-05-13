import { Injectable, computed, inject, model, signal } from '@angular/core';
import {
  ChartOptions,
  Dataset,
  Dimension,
  FiltersConfig,
  Series,
  TableOptions,
} from '@uncuyoapp/ngx-data-visualizer';
import { Visualization } from '@models/domain/visualization.model';
import { VisualizationStateService } from '@services';
import { VisualizationFactory } from './visualization.factory';

/**
 * @class VisualizationViewStateService
 * @description
 * Servicio encargado de gestionar el estado interno y reactivo de la vista de visualización.
 * Encapsula la gestión de Trellis (Small Multiples), opciones de gráficos/tablas y 
 * la orquestación de la carga de datos.
 */
@Injectable()
export class VisualizationViewStateService {
  private readonly visualizationState = inject(VisualizationStateService);

  /** Entidad global de metadatos de visualización */
  public readonly visualization = signal<Visualization | null>(null);

  /** Entidad estructurada con el dataset actual */
  public readonly dataset = signal<Dataset | null>(null);

  /** Configuración local reactiva de diseño o características de la tabla */
  public readonly tableOptions = signal<TableOptions | null>(null);

  /** Configuración local reactiva de diseño o características del gráfico */
  public readonly chartOptions = signal<ChartOptions | null>(null);

  /** Dimensiones habilitadas localmente (soporta binding bidireccional) */
  public readonly dimensions = signal<Dimension[]>([]);

  /** Arreglo de series para aplicar visibilidades o agregaciones */
  public readonly series = signal<Series[]>([]);

  /** Arreglo local con la colección de dimensiones separadas para los Small Multiples (Trellis) */
  public readonly splitedDimensions = signal<Dimension[]>([]);

  /** Una copia del Dataset orientada explícitamente a evitar referencias del MultiChart */
  public readonly multiDataset = signal<Dataset | null>(null);

  /** Copia independiente renderizada sobre una visualización múltiple */
  public readonly multiChartOptions = signal<ChartOptions | null>(null);

  /** Indica si se están cargando los datos */
  public readonly loading = signal<boolean>(false);

  /**
   * Señal computada que determina si existen filtros "activos" en la visualización.
   */
  public readonly hasActiveFilters = computed(() => {
    const dims = this.dimensions();
    const filters = this.visualizationState.getFiltersFromDimensions(dims);
    return this.visualizationState.hasActiveFilters(filters);
  });

  /**
   * Inicializa el estado con una visualización y opcionalmente un dataset.
   * @param viz Entidad de visualización.
   * @param externalDataset Dataset opcional si ya está disponible.
   */
  public initialize(viz: Visualization, externalDataset?: Dataset): void {
    this.visualization.set(viz);

    // Configurar opciones iniciales de visual blocks
    if (viz.visualBlocks?.length > 0) {
      const firstBlock = viz.visualBlocks[0];
      this.chartOptions.set(firstBlock.chartOptions || null);
      this.tableOptions.set(firstBlock.tableOptions || null);

      if (this.chartOptions()) {
        this.multiChartOptions.set(structuredClone(this.chartOptions()));
      }
    }

    if (externalDataset) {
      this.handleExternalDataset(viz, externalDataset);
    } else {
      this.loadVisualizationData(viz);
    }
  }

  /**
   * Procesa un dataset inyectado externamente.
   */
  private handleExternalDataset(viz: Visualization, data: Dataset): void {
    let processedData = data;
    if (viz.dataConfig?.baseFilters) {
      processedData = VisualizationFactory.transformDataset(data, viz.dataConfig.baseFilters);
    }

    const dimensions = processedData.getAllDimensions();
    VisualizationFactory.syncStoredFiltersToDimensions(viz, dimensions);

    this.updateState(processedData, dimensions);
  }

  /**
   * Carga los datos desde el servicio de dominio.
   */
  private loadVisualizationData(viz: Visualization): void {
    this.loading.set(true);
    this.visualizationState.getPreparedDataset(viz).subscribe({
      next: (data) => {
        const dimensions = data.getAllDimensions();
        VisualizationFactory.syncStoredFiltersToDimensions(viz, dimensions);
        this.updateState(data, dimensions);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('VisualizationViewState: Error loading data:', error);
        this.loading.set(false);
      },
    });
  }

  /**
   * Actualiza el estado reactivo con un nuevo dataset y dimensiones.
   */
  private updateState(data: Dataset, dimensions: Dimension[]): void {
    this.dataset.set(data);
    this.dimensions.set(dimensions);

    // Inicializar multiDataset como una copia independiente para Trellis
    this.multiDataset.set(new Dataset({
      id: data.id,
      dimensions: structuredClone(data.getAllDimensions()),
      enableRollUp: data.enableRollUp,
      rowData: structuredClone(data.getRawData()),
    }));
  }

  /**
   * Añade o elimina dinámicamente dimensiones del modo Trellis.
   */
  public toggleTrellisDimension(dimension: Dimension): void {
    this.splitedDimensions.update((dims) => {
      if (dims.some((d) => d.id === dimension.id)) {
        return dims.filter((dim) => dim.id !== dimension.id);
      } else {
        return [...dims, dimension];
      }
    });
  }
}
