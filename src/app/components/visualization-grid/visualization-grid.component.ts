import { Component, computed, effect, inject, input, model, output, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { VisualizationFilterPipe } from '@core/pipes/visualization-filter.pipe';
import { VisualizationOrderPipe } from '@core/pipes/visualization-order.pipe';
import { Visualization, VisualizationFilter, VisualizationOrder } from '@models/domain/visualization.model';
import { EditModeService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { VisualizationActionsComponent } from './visualization-actions/visualization-actions.component';
import { VisualizationCardComponent } from './visualization-card/visualization-card.component';

import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { AppDialogService } from '@services';
import { VisualizationGridEditService } from './visualization-grid-edit.service';

/**
 * Componente responsable de renderizar una grilla responsiva de tarjetas de visualización.
 * Incluye acciones de filtrado, búsqueda y ordenamiento.
 */
@Component({
  selector: 'app-visualization-grid',
  standalone: true,
  imports: [
    VisualizationCardComponent,
    VisualizationActionsComponent,
    ButtonComponent
  ],
  templateUrl: './visualization-grid.component.html',
  styleUrl: './visualization-grid.component.scss'
})
export class VisualizationGridComponent {
  /** Referencia al componente de acciones para poder limpiar sus estados internos. */
  readonly actionsComponent = viewChild(VisualizationActionsComponent);

  /** Servicio opcional para gestión de edición/selección en la grilla. */
  public readonly editService = inject(VisualizationGridEditService, { optional: true });

  /** Servicio de modo edición global. */
  private readonly editModeService = inject(EditModeService);

  /** Servicio especializado de diálogos. */
  private readonly dialogs = inject(AppDialogService);

  /** Configuración gráfica centralizada */
  public readonly graphics = SECTION_GRAPHICS.visualizations;

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** La lista de visualizaciones a mostrar dentro de la grilla. */
  visualizations = input.required<Visualization[]>();

  /** Determina si se muestra la barra de búsqueda en las acciones. */
  enableSearchBar = input<boolean>(true);

  /** Determina si se habilitan los filtros en las acciones. */
  enableFilter = input<boolean>(true);

  /** Determina si se habilita el ordenamiento en las acciones. */
  enableOrder = input<boolean>(true);

  /** Estado del filtro actual (permite comunicación bidireccional). */
  filter = model<VisualizationFilter>({});

  /** Criterio de ordenamiento actual (permite comunicación bidireccional). */
  order = model<VisualizationOrder>('default');

  /** Label para el botón de acción opcional. */
  actionButtonLabel = input<string | undefined>();
  /** Icono para el botón de acción opcional. */
  actionButtonIcon = input<string | undefined>();
  /** Evento que se dispara al hacer clic en el botón de acción. */
  actionButtonClick = output<void>();

  /** Acciones por lote visibles (ej: ['publish', 'unpublish', 'delete']) */
  visibleActions = input<string[]>([]);

  /** Indica si los datos de la grilla se están cargando. */
  loading = input<boolean>(false);

  /**
   * Sincroniza las acciones visibles con el servicio de edición.
   */
  private syncActions = effect(() => {
    const actions = this.visibleActions();
    if (this.editService) {
      this.editService.visibleActions.set(actions);
    }
  }, { allowSignalWrites: true });

  /** Determina si hay filtros activos (excluyendo el thematicId estructural). */
  hasFilters = computed(() => {
    const f = this.filter();
    return (
      (f.dimensions && f.dimensions.length > 0) ||
      !!f.measureUnit ||
      !!f.periodicity ||
      (f.search && f.search.trim().length > 0)
    );
  });

  /**
   * Listado de visualizaciones filtradas y ordenadas actualmente visibles en la grilla.
   * Se utiliza tanto en la plantilla como para acciones masivas (Seleccionar todas).
   */
  filteredVisualizations = computed(() => {
    const filterPipe = new VisualizationFilterPipe();
    const orderPipe = new VisualizationOrderPipe();
    const isEditMode = this.editModeService.isEditModeEnabled();

    // Inyectamos el estado de edición en el filtro para que el pipe decida si mostrar borradores
    const filter = {
      ...this.filter(),
      showDrafts: isEditMode
    };

    const filtered = filterPipe.transform(this.visualizations(), filter);
    return orderPipe.transform(filtered, this.order());
  });

  /**
   * Selecciona todas las visualizaciones que están actualmente visibles (filtradas).
   */
  selectAllVisible() {
    const ids = this.filteredVisualizations()
      .map(v => v.id)
      .filter((id): id is number => id !== undefined);

    this.editService?.selectAll(ids);
  }

  /**
   * Limpia toda la selección actual.
   */
  clearAllSelection() {
    this.editService?.clearSelection();
  }

  /**
   * Resetea todos los filtros aplicados por el usuario.
   * Delega la limpieza al componente de acciones para sincronizar su estado interno.
   */
  resetFilters() {
    this.actionsComponent()?.clearFilters();
    // Limpieza defensiva si la acción no está disponible
    this.filter.set({
      thematicIds: this.filter().thematicIds,
    });
  }

  /**
   * Abre el diálogo de creación de visualización y notifica éxito si corresponde.
   */
  openCreateModal() {
    this.dialogs.openVisualizationCreate().subscribe(created => {
      if (created) {
        this.editService?.notifyActionSuccess();
      }
    });
  }
}
