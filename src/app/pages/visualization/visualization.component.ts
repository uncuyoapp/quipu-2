import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { DownloadAvailability, DownloadOptions } from '@models/common/download.model';
import { InformationEditEvent, Visualization } from '@models/domain/visualization.model';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService, EditModeService, VisualizationStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SwitchComponent } from '@shared/components/switch/switch.component';
import {
  Dataset,
  Dimension,
  FiltersConfig,
  Series
} from '@uncuyoapp/ngx-data-visualizer';
import { VActionsComponent } from './components/v-actions/v-actions.component';
import { VChartComponent } from './components/v-chart/v-chart.component';
import { VDownloadsComponent } from './components/v-downloads/v-downloads.component';
import { VInformationComponent } from './components/v-information/v-information.component';
import { VMultiChartComponent } from './components/v-multi-chart/v-multi-chart.component';
import { VTableComponent } from './components/v-table/v-table.component';

import { ScreenOrientationService } from '@services';
import { OrientationWarningComponent } from '@shared/components/orientation-warning/orientation-warning.component';
import { VisualizationEditService } from './visualization-edit.service';
import { VisualizationViewStateService } from './visualization-view-state.service';

/**
 * @class VisualizationComponent
 * @description
 * Componente principal (Page) encargado de orquestar la visualización completa
 * obtenida desde la API. Gestiona el ciclo de vida de los datos, los modos de 
 * edición y la inyección a los componentes hijos (gráficos, tablas y filtros).
 */
@Component({
  selector: 'app-visualization',
  standalone: true,
  providers: [VisualizationEditService, VisualizationViewStateService],
  imports: [
    MatSidenavModule,
    ButtonComponent,
    MatIconModule,
    MatProgressSpinnerModule,
    VInformationComponent,
    VChartComponent,
    VTableComponent,
    VMultiChartComponent,
    VDownloadsComponent,
    VActionsComponent,
    NgIconComponent,
    OrientationWarningComponent,
    SwitchComponent,
  ],
  templateUrl: './visualization.component.html',
  styleUrl: './visualization.component.scss',
})
export class VisualizationComponent implements OnInit {
  /** Referencia a la barra lateral de configuración/filtros */
  actionsSidenav = viewChild.required<MatSidenav>('actionsSidenav');

  /** Datos iniciales inyectados en la apertura modal (si aplica) */
  data = inject(MAT_DIALOG_DATA, { optional: true });

  private readonly dialogRef = inject(MatDialogRef<VisualizationComponent>, { optional: true });
  private readonly visualizationState = inject(VisualizationStateService);
  private readonly eventBus = inject(AppEventBusService);

  /** Visualización base inyectada desde afuera si se usa como componente incrustado */
  visualizationInput = input<Visualization>();
  /** Dataset base inyectado desde afuera si ya se dispone de él */
  datasetInput = input<Dataset>();
  /** Determina si se muestran los controles flotantes de interacción */
  showControls = input<boolean>(true);
  /** Determina si se muestra el botón de cierre */
  showCloseButton = input<boolean>(true);
  /** Determina si se muestra el botón de guardado en modo edición */
  showSaveButton = input<boolean>(true);
  /** Indica si la metadata debe expandirse por defecto */
  expandMetadata = input<boolean>(false);
  /** Indica si el componente se está usando dentro del wizard de creación */
  isWizard = input<boolean>(false);

  /** Servicio accesible para activar/desactivar controles de edición visual */
  public readonly editMode = inject(EditModeService);

  /** Servicio para gestionar la orientación de la pantalla */
  private readonly orientationService = inject(ScreenOrientationService);

  /** Servicio especializado en la gestión de estado de vista */
  public readonly viewState = inject(VisualizationViewStateService);

  multiChartWrapper = viewChild<VMultiChartComponent>('multiChartWrapper');
  chartWrapper = viewChild<VChartComponent>('chartWrapper');
  publicationSwitch = viewChild<SwitchComponent>('publicationSwitch');

  /** Servicio especializado en la gestión de persistencia y cambios (Editor) */
  public readonly editService = inject(VisualizationEditService);

  /** Configuración de iconos centralizada */
  public readonly icons = APP_ICONS;

  /** Shortcuts reactivos al estado de vista para simplificar el template */
  public readonly visualization = this.viewState.visualization;
  public readonly dataset = this.viewState.dataset;
  public readonly tableOptions = this.viewState.tableOptions;
  public readonly chartOptions = this.viewState.chartOptions;
  public readonly dimensions = this.viewState.dimensions;
  public readonly series = this.viewState.series;
  public readonly splitedDimensions = this.viewState.splitedDimensions;
  public readonly multiDataset = this.viewState.multiDataset;
  public readonly multiChartOptions = this.viewState.multiChartOptions;
  public readonly hasActiveFilters = this.viewState.hasActiveFilters;

  /**
   * Señal computada que determina si existe contenido visual (gráfico o tabla)
   * habilitado para mostrar acciones.
   */
  hasVisualContent = computed(() => !!this.chartOptions() || !!this.tableOptions());

  /**
   * Señal computada que determina si la acción de vista porcentual debe estar habilitada.
   * Se habilita solo si existe un gráfico y posee una configuración de series apiladas.
   */
  canShowPercentageView = computed(() => {
    const opts = this.chartOptions();
    return !!opts && opts.stacked !== null;
  });

  /**
   * Señal computada que determina si la acción de múltiples gráficos debe estar habilitada.
   * Se habilita solo si existe un gráfico principal configurado.
   */
  canShowMultiChart = computed(() => this.chartOptions() !== null);

  /** Shortcut reactivo para saber si hay cambios pendientes (vía el Editor) */
  hasUnsavedChanges = this.editService.hasUnsavedChanges;

  /**
   * Señal computada que calcula el padding inferior necesario para no ser solapado
   * por la barra de modo edición cuando está visible.
   */
  public readonly paddingBottom = computed(() => {
    const isBarVisible =
      this.editMode.isEditModeEnabled() &&
      !this.editMode.isTemporarilyHidden();
    return isBarVisible ? 80 : 16;
  });

  /**
   * Señal computada que calcula la posición inferior (bottom) para elementos
   * fijos (fixed) para que no sean tapados por la barra de modo edición.
   */
  public readonly bottomOffset = computed(() => {
    const isBarActive =
      this.editMode.isEditModeEnabled() &&
      !this.editMode.isTemporarilyHidden();
    return isBarActive ? 80 : 20;
  });

  /**
   * Señal computada que formatea la fecha de última actualización.
   */
  public readonly lastUpdate = computed(() => {
    const viz = this.visualization();
    const dateStr = viz?.metadata?.updatedAt || viz?.technicalSheet?.lastUpdate;
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  });

  /** Indica si el dispositivo es móvil o tablet */
  public readonly isMobile = this.orientationService.isMobile;

  constructor() {
    // Effect para sincronizar cambios de dimensiones al dataset
    effect(() => {
      const dims = this.dimensions();
      const currentDataset = this.dataset();
      if (currentDataset && dims.length > 0) {
        this.filter();
      }
    }, { allowSignalWrites: true });

    // Effect para inicializar el editor solo cuando el modo edición está activo y los metadatos listos
    effect(() => {
      if (this.editMode.isEditModeEnabled() && this.visualization()) {
        untracked(() => {
          this.editService.initialize({
            visualization: this.visualization,
            dataset: this.dataset.asReadonly(),
            dimensions: this.dimensions,
            chartOptions: this.chartOptions,
            tableOptions: this.tableOptions,
            isWizard: this.isWizard()
          });
        });
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Gatilla el intento de cerrar el modal visor base.
   * Delega la lógica de confirmación al servicio editor.
   */
  closeDialog(): void {
    if (this.dialogRef) {
      const filters = this.getCurrentFilters();
      const hasVisualFilters = this.visualizationState.hasActiveFilters(filters);
      this.editService.closeDialog(this.dialogRef, filters, hasVisualFilters);
    }
  }

  /**
   * Verifica si hay filtros aplicados actualmente.
   * (Método de compatibilidad para otros componentes)
   * @returns true si hay filtros activos.
   */
  checkIfFiltersAreActive(): boolean {
    const filters = this.getCurrentFilters();
    return this.visualizationState.hasActiveFilters(filters);
  }

  /** Delegación de toggles al servicio editor */
  toggleChart(): void {
    this.editService.toggleChart();
  }

  /** Delegación de toggles al servicio editor */
  toggleTable(): void {
    this.editService.toggleTable();
  }

  /** Orquesta el guardado de cambios delegando al servicio editor. */
  saveChanges(): void {
    const filters = this.getCurrentFilters();
    const hasVisualFilters = this.visualizationState.hasActiveFilters(filters);
    this.editService.saveChanges(filters, hasVisualFilters);
  }

  /**
   * Cambia el estado de publicación de la visualización.
   */
  togglePublished(): void {
    this.editService.togglePublished().subscribe(confirmed => {
      if (!confirmed) {
        // Si no se confirmó, revertimos el valor del switch al estado actual de la visualización
        this.publicationSwitch()?.setValue(this.visualization()?.published || false);
      }
    });
  }

  /**
   * Maneja los cambios de información (título, ficha técnica) emitidos por VInformationComponent.
   * @param event Datos del cambio.
   */
  onInformationEdited(event: InformationEditEvent): void {
    this.editService.updateInformation(event);
  }

  /**
   * Abre o contrae el menú lateral material para la gestión de dimensiones o atributos.
   */
  toggleActionsSidenav(): void {
    const isOpening = !this.actionsSidenav().opened;
    if (isOpening) {
      this.eventBus.emit({
        type: AppEventType.VISUALIZATION_ACTIONS_OPENED,
        payload: { id: this.visualization()?.id || 'unknown' }
      });
    }
    this.actionsSidenav().toggle();
  }

  /**
   * Ciclo de vida inicial: Delegar la inicialización del estado al ViewStateService.
   */
  ngOnInit(): void {
    const initialViz = this.visualizationInput() || this.data?.visualization();

    if (!initialViz) {
      console.error('VisualizationComponent: No visualization provided');
      return;
    }

    // Inicializar el servicio de estado de vista (carga datos interna o externamente)
    this.viewState.initialize(initialViz, this.datasetInput());
  }

  /**
   * Evalúa la capa de RollUp y Filtramiento activo dentro de la configuración visual del panel flotante
   * para re-aplicar o quitar filtros al dataset interactivo actual.
   */
  filter(): void {
    const filtersConfig = this.getCurrentFilters();
    this.dataset()?.applyFilters(filtersConfig);
  }

  /**
   * Obtiene la configuración de filtros actual basada en el estado de las dimensiones.
   * @returns Objeto FiltersConfig con rollUp y filtros por ítem.
   */
  getCurrentFilters(): FiltersConfig {
    return this.visualizationState.getFiltersFromDimensions(this.dimensions());
  }

  /**
   * Añade o elimina dinámicamente dimensiones objetivo de la matriz iterativa.
   * @param dimension Dimension iterativa para gráficos distribuidos.
   */
  onMultipleGraphsChange(dimension: Dimension): void {
    this.viewState.toggleTrellisDimension(dimension);
  }

  /** Notifica al wrapper a mutar su eje Y base al orden de los 100%. */
  onPercentageViewChange(value: boolean): void {
    this.chartWrapper()?.toPercentage();
  }

  /** Calculo reactivo para las descargas base dependiente de las presencias globales. */
  downloadAvailability = computed<DownloadAvailability>(() => ({
    chart: this.chartOptions() !== null,
    table: this.tableOptions() !== null,
    multiCharts: this.splitedDimensions().length > 0,
  }));

  /** Ejecuta la solicitud documentada de la descarga de partes de pantalla por el user. */
  onDownload(options: DownloadOptions): void {
    const viz = this.editMode.isEditModeEnabled()
      ? this.editService.getUpdatedVisualization()
      : this.visualization();

    if (viz) {
      this.visualizationState.download(viz, options);
    }
  }
}
