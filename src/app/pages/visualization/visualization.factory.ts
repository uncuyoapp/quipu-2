import { VISUALIZATION_TYPES_ICONS } from '@core/config/illustrations.config';
import { Dataset, DatasetInfo, Dimension } from '@models/domain/dataset.model';
import { ChartOptions, FiltersConfig, TableOptions, Visualization } from '@models/domain/visualization.model';
import { SaveVisualizationDto } from '@models/dto/visualization-mutation.dto';
import { normalizeDimensions } from '@core/utils/dimension.utils';

/**
 * @class VisualizationFactory
 * @description
 * Factory encargada de generar configuraciones por defecto para los distintos
 * tipos de visualizaciones (gráficos y tablas).
 */
export class VisualizationFactory {
  /**
   * Determina la ruta del icono/ilustración que debe representar a la visualización.
   * Evalúa la presencia de bloques visuales, tipos de gráficos y tablas.
   * 
   * @param visualization La visualización a evaluar.
   * @returns La ruta del recurso gráfico.
   */
  static getVisualizationIcon(visualization: Visualization): string {
    const firstBlock = visualization.visualBlocks?.[0];

    // 1. Si tiene bloques configurados
    if (firstBlock) {
      // Prioridad 1: Gráfico
      if (firstBlock.chartOptions?.type) {
        const type = firstBlock.chartOptions.type;
        return VISUALIZATION_TYPES_ICONS[type] || VISUALIZATION_TYPES_ICONS['default'];
      }

      // Prioridad 2: Tabla
      if (firstBlock.tableOptions) {
        return VISUALIZATION_TYPES_ICONS['table'];
      }
    }

    // 2. Fallback por defecto
    return VISUALIZATION_TYPES_ICONS['default'];
  }

  /**
   * Genera una configuración de gráfico por defecto.
   * @param title Título de la visualización.
   * @param dataset Dataset para inferir dimensiones iniciales.
   * @returns Objeto ChartOptions configurado.
   */
  static createDefaultChartOptions(title: string, dataset: Dataset | null): ChartOptions {
    let firstLevelId: number | string | undefined;
    const dims = dataset?.getAllDimensions() || [];
    const yearDim = dims.find(d => d.name.toLowerCase() === 'year' || d.nameView.toLowerCase() === 'año');

    if (yearDim) {
      firstLevelId = yearDim.id;
    } else if (dims.length > 0) {
      firstLevelId = dims[0].id;
    }

    return {
      title: title,
      type: 'bar',
      stacked: null,
      xAxis: {
        title: '',
        rotateLabels: 0,
        firstLevel: firstLevelId as number,
        secondLevel: null
      },
      yAxis: {
        title: '',
        max: null
      },
      tooltip: {
        shared: false,
        decimals: null,
        suffix: null,
        format: null,
        showTotal: false
      },
      legends: {
        enabled: true,
        show: true,
        position: 'right'
      },
      navigator: {
        show: false,
        start: null,
        end: null
      },
      width: null,
      height: null,
      filterLastYear: false,
      showYearsLegend: false,
      toPercent: false,
      measureUnit: '',
      isPreview: false,
      disableAutoUpdate: false
    } as ChartOptions;
  }

  /**
   * Genera una configuración de tabla por defecto.
   * @param dataset Dataset para inferir distribución inicial de filas/columnas.
   * @returns Objeto TableOptions configurado.
   */
  static createDefaultTableOptions(dataset: Dataset | null): TableOptions {
    const dims = dataset?.getAllDimensions() || [];
    const half = Math.ceil(dims.length / 2);
    const cols = dims.slice(0, half).map(d => d.id);
    const rows = dims.slice(half).map(d => d.id);

    return {
      digitsAfterDecimal: 0,
      sorters: [],
      totalRow: true,
      totalCol: true,
      cols: cols,
      rows: rows,
      suffix: '',
      valueDisplay: 'nominal'
    } as TableOptions;
  }

  /**
   * Genera el objeto base para una nueva visualización.
   * @param dataset El dataset configurado para la visualización.
   * @param info Información y metadatos complementarios del dataset.
   * @param baseFilters Filtros base opcionales que definen el recorte de datos.
   * @returns Objeto Visualization inicializado con bloques vacíos.
   */
  static createInitialVisualization(dataset: Dataset, info?: DatasetInfo, baseFilters?: FiltersConfig): Visualization {
    const viz: Visualization = {
      id: 0,
      published: false,
      title: info?.name || '',
      informationUnitName: 'S/D',
      measureUnit: info?.unit || '',
      periodicity: info?.periodicity || 'Anual',
      timeRange: info?.temporal || 'S/D',
      dimensions: dataset.getAllDimensions().map(d => d.nameView),
      datasetId: dataset.id?.toString() || '0',
      thematics: [],
      visualBlocks: [],
      technicalSheet: {
        description: info?.description || '',
        formula: '',
        producerArea: '',
        lastUpdate: new Date().toISOString(),
        registrationMode: 'S/D',
        responsible: [],
        dataResponsible: 'S/D'
      }
    };

    if (baseFilters) {
      viz.dataConfig = { baseFilters };
    }

    return viz;
  }

  /**
   * Realiza un "corte físico" del dataset original basándose en una configuración de filtros.
   * @param dataset Dataset original completo.
   * @param config Configuración de filtros base (rollup e ítems).
   * @returns Una nueva instancia de Dataset que solo contiene los datos e ítems seleccionados.
   */
  static transformDataset(dataset: Dataset, config: FiltersConfig | undefined): Dataset {
    if (!config) return dataset;

    // 1. Aplicar filtros al dataset original para que genere los datos agregados internamente
    dataset.applyFilters(config);
    const rowData = dataset.getCurrentData();

    // 2. Filtrar el esquema de dimensiones
    // Excluimos las dimensiones que están en Rollup
    const activeDimensions = dataset.getAllDimensions()
      .filter(dim => !(config.rollUp || []).includes(dim.id))
      .map(dim => {
        // Para las dimensiones activas, filtramos sus ítems para que solo existan los seleccionados
        const filterEntry = (config.filter || []).find(f => f.name === dim.id);
        const activeItems = filterEntry
          ? dim.items.filter(item => filterEntry.items.includes(item.name))
          : dim.items.map(item => ({ ...item })); // Clonamos ítems para evitar mutación

        return {
          ...dim,
          selected: true,
          items: activeItems.map(item => ({ ...item, selected: true }))
        };
      });

    // 3. Crear el nuevo dataset "reducido" que será el origen de verdad para la visualización
    return new Dataset({
      id: dataset.id,
      dimensions: activeDimensions,
      enableRollUp: dataset.enableRollUp ?? false,
      rowData: rowData
    });
  }

  /**
   * Retorna una copia profunda e inmutable de las dimensiones garantizando
   * que tanto cada dimensión como cada ítem tengan 'selected: true' por defecto.
   *
   * @param dims Arreglo de dimensiones crudas o parciales.
   * @returns Nuevo arreglo de dimensiones con objetos e ítems normalizados.
   */
  static normalizeDimensions(dims: Dimension[]): Dimension[] {
    return normalizeDimensions(dims);
  }

  /**
   * Sincroniza los filtros almacenados en los metadatos con un arreglo de dimensiones,
   * retornando una copia profunda e inmutable con los estados 'selected' resueltos.
   *
   * @param visualization La visualización que contiene los bloques y filtros.
   * @param dims Las dimensiones a sincronizar.
   * @returns Un nuevo arreglo inmutable de Dimension con su estado de selección actualizado.
   */
  static syncStoredFiltersToDimensions(visualization: Visualization | null, dims: Dimension[]): Dimension[] {
    const firstBlock = visualization?.visualBlocks?.[0];
    const filters = firstBlock?.filters;

    return (dims || []).map((dim) => {
      const isSelected = filters?.rollUp
        ? !filters.rollUp.includes(dim.id)
        : (dim.selected ?? true);

      const dimFilter = filters?.filter?.find((f) => f.name === dim.id);

      return {
        ...dim,
        selected: isSelected,
        items: (dim.items || []).map((item) => ({
          ...item,
          selected: dimFilter
            ? dimFilter.items.includes(item.name)
            : (item.selected ?? true),
        })),
      };
    });
  }

  /**
   * Transforma un arreglo de dimensiones en una configuración de filtros estructurada.
   * @param dimensions Arreglo de dimensiones actuales.
   * @returns Configuración Estructurada de filtros (rollUp e ítems seleccionados).
   */
  static getFiltersFromDimensions(dimensions: Dimension[]): FiltersConfig {
    return {
      rollUp: dimensions
        .filter((dimension: Dimension) => dimension.selected === false)
        .map((dimension: Dimension) => dimension.id),
      filter: dimensions
        .filter((dimension: Dimension) =>
          dimension.items.some((item) => item.selected === false)
        )
        .map((dimension: Dimension) => ({
          name: dimension.id,
          items: dimension.items
            .filter((item) => item.selected ?? true)
            .map((item) => item.name),
        })),
    };
  }

  /**
   * Determina si una configuración de filtros tiene selecciones activas que recorten el dataset.
   * @param filters Configuración de filtros a evaluar.
   * @returns true si hay rollUp o ítems filtrados.
   */
  static hasActiveFilters(filters: FiltersConfig): boolean {
    const hasRollUp = (filters.rollUp?.length ?? 0) > 0;
    const hasItemFilters = (filters.filter?.length ?? 0) > 0;
    return hasRollUp || hasItemFilters;
  }

  /**
   * Transforma una entidad de dominio o estado parcial en un DTO
   * para operaciones de guardado en el proveedor de datos.
   *
   * @param source Objeto parcial o completo de Visualización.
   * @returns DTO de mutación fuertemente tipado.
   */
  static toSaveDto(source: Partial<Visualization>): SaveVisualizationDto {
    return {
      title: source.title?.trim() ?? '',
      datasetId: Number(source.datasetId),
      summary: source.technicalSheet?.description?.trim() || undefined,
      formula: source.technicalSheet?.formula?.trim() || undefined,
      published: source.published ?? false,
      baseFilters: source.dataConfig?.baseFilters,
      visualBlocks: source.visualBlocks?.map(b => ({
        id: b.id || 'main-block',
        title: b.title,
        chartOptions: b.chartOptions,
        tableOptions: b.tableOptions,
        filters: b.filters
      })) ?? []
    };
  }
}
