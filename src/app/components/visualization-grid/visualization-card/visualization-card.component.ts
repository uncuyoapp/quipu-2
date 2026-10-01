import { Component, computed, inject, input } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { Visualization } from '@models/domain/visualization.model';
import { NgIconComponent } from '@ng-icons/core';
import { VisualizationFactory } from '@pages/visualization/visualization.factory';
import { AppDialogService, AppEventBusService, EditModeService, SessionPersistenceService, ThematicStateService } from '@services';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { TagComponent } from '@shared/components/tag/tag.component';
import { VisualizationGridEditService } from '../visualization-grid-edit.service';

/**
 * Componente responsable de mostrar una tarjeta que resume una visualización.
 * Muestra metadatos y una ilustración, y abre la visualización completa al hacer clic.
 */
@Component({
  selector: 'app-visualization-card',
  standalone: true,
  imports: [NgIconComponent, CheckboxComponent, TagComponent],
  templateUrl: './visualization-card.component.html',
  styleUrl: './visualization-card.component.scss',
})
export class VisualizationCardComponent {
  /** Los datos de la visualización a mostrar en la tarjeta. */
  visualization = input.required<Visualization>();

  /** Servicio opcional para gestión de edición/selección en la grilla. */
  public readonly editService = inject(VisualizationGridEditService, { optional: true });

  /** Servicio global de modo de edición. */
  public readonly editModeService = inject(EditModeService);

  /** Servicio de temáticas para resolver breadcrumbs. */
  private readonly thematicState = inject(ThematicStateService);

  /** Servicio especializado de diálogos. */
  private readonly dialogs = inject(AppDialogService);

  /** Servicio de eventos global. */
  private readonly eventBus = inject(AppEventBusService);

  /** Servicio de persistencia y saltos intercapa de sesión. */
  private readonly sessionPersistence = inject(SessionPersistenceService);

  /** Configuración gráfica centralizada */
  public readonly graphics = SECTION_GRAPHICS.visualizations;

  /** Configuración de iconos centralizada */
  public readonly icons = APP_ICONS;

  /** 
   * Computed que determina si se deben mostrar los breadcrumbs de las temáticas.
   * Se muestran si el modo edición global está activo o si el componente es seleccionable.
   */
  showBreadcrumbs = computed(() => this.editModeService.isEditModeEnabled() || this.editService?.isSelectable());

  /** 
   * Computed que resuelve los breadcrumbs completos para todas las temáticas asociadas.
   */
  thematicBreadcrumbs = computed(() => {
    if (!this.showBreadcrumbs()) return [];

    return this.visualization().thematics
      .map(t => this.thematicState.getBreadcrumb(t.id))
      .filter(b => !!b);
  });

  /** 
   * Computed que determina la ruta de la ilustración basada en el tipo de visualización. 
   * Por ahora retorna un tipo 'line' por defecto si no se especifica.
   */
  visualizationImage = computed(() => {
    return VisualizationFactory.getVisualizationIcon(this.visualization());
  });

  /**
   * Abre un diálogo en pantalla completa con la visualización interactiva detallada.
   */
  openVisualization() {
    const visualization = this.visualization();

    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_OPENED,
      payload: { id: visualization.id }
    });

    this.dialogs.openVisualization(visualization).subscribe((result) => {
      // Notificar al servicio de la grilla solo si se guardaron cambios
      if (result?.saved) {
        this.editService?.notifyActionSuccess();
      }
    });
  }

  /**
   * Alterna la selección de esta visualización si el servicio está disponible.
   */
  toggleSelection(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const id = this.visualization().id;
    if (id !== undefined) {
      this.editService?.toggleSelection(id);
    }
  }

  /**
   * Dispara el traspaso administrativo seguro hacia la pantalla del dataset en backend.
   */
  public onManageDataset(datasetId: number | string, event: MouseEvent): void {
    event.stopPropagation();
    this.sessionPersistence.openAdminHandoff(`/dataset/${datasetId}`);
  }
}
