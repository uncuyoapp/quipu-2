import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AppEventType } from '@core/models/events/app-event.types';
import { Dataset, Dimension } from '@models/domain/dataset.model';
import {
  ChartOptions,
  FiltersConfig,
  InformationEditEvent,
  TableOptions,
  Visualization
} from '@models/domain/visualization.model';
import { SaveResult } from '@models/common/save-result.model';
import { AppDialogService, AppEventBusService, EditModeService, VisualizationPersistenceService, VisualizationStateService } from '@services';
import { map, Observable } from 'rxjs';
import type { VisualizationComponent } from './visualization.component';
import { VisualizationFactory } from './visualization.factory';

export interface VisualizationEditState {
  visualization: WritableSignal<Visualization | null>;
  dataset: Signal<Dataset | null>;
  dimensions: Signal<Dimension[]>;
  chartOptions: WritableSignal<ChartOptions | null>;
  tableOptions: WritableSignal<TableOptions | null>;
  isWizard?: boolean;
}

/**
 * @class VisualizationEditService
 * @description
 * Servicio encargado de gestionar el ciclo de vida de edición de una visualización.
 * Encapsula la detección de cambios (snapshots), el guardado, los toggles de vista y filtros.
 */
@Injectable()
export class VisualizationEditService {
  private readonly visualizationState = inject(VisualizationStateService);
  private readonly persistence = inject(VisualizationPersistenceService);
  private readonly dialogs = inject(AppDialogService);
  private readonly editMode = inject(EditModeService);
  private readonly eventBus = inject(AppEventBusService);

  private state!: VisualizationEditState;
  private readonly stateSnapshot = signal<string>('');
  private readonly wasSavedDuringSession = signal<boolean>(false);

  /** Determina si existen cambios sin guardar comparando el estado actual con el snapshot */
  public readonly hasUnsavedChanges = computed(() => {
    // Es vital acceder a las señales al inicio para que Angular registre la dependencia reactiva,
    // incluso si el resto del método no se ejecuta por los guardas iniciales (short-circuit).
    const isEditing = this.editMode.isEditModeEnabled();
    const snapshot = this.stateSnapshot();

    if (!isEditing || !this.state) {
      return false;
    }

    const currentState = this.serializeCurrentState();

    const changed = currentState !== snapshot;

    return changed;
  });

  /** Determina si la visualización actual tiene errores de validación (campos obligatorios vacíos) */
  public readonly hasErrors = computed(() => {
    const viz = this.state?.visualization();
    if (!viz) return false;

    return !viz.title?.trim() || !viz.measureUnit?.trim();
  });

  private isInitialized = false;

  /**
   * Inicializa el servicio con las referencias a los estados del componente.
   * @param state Estado inicial y señales del componente host.
   */
  initialize(state: VisualizationEditState): void {
    if (this.isInitialized) return;

    this.state = state;
    this.takeStateSnapshot();
    this.isInitialized = true;
  }

  /** Captura el estado actual como punto de referencia para cambios */
  takeStateSnapshot(): void {
    if (!this.state) return;
    this.stateSnapshot.set(this.serializeCurrentState());
  }


  /**
   * Activa o desactiva la visualización del bloque de GRÁFICO.
   */
  toggleChart(): void {
    if (!this.state) return;

    if (this.state.chartOptions()) {
      this.dialogs.confirm({
        title: '¿Eliminar gráfico?',
        message: 'Se perderá la configuración actual del gráfico. ¿Deseas continuar?',
        confirmText: 'Eliminar gráfico',
        confirmPalette: 'blue'
      }).subscribe(result => {
        if (result) {
          this.state.chartOptions.set(null);
          if (this.state.isWizard) {
            this.eventBus.emit({ type: AppEventType.VISUALIZATION_WIZARD_CHART_REMOVED });
          }
        }
      });
    } else {
      const viz = this.state.visualization();
      this.state.chartOptions.set(
        VisualizationFactory.createDefaultChartOptions(
          viz?.title || 'Gráfico',
          this.state.dataset()
        )
      );
      if (this.state.isWizard) {
        this.eventBus.emit({ type: AppEventType.VISUALIZATION_WIZARD_CHART_ADDED });
      }
    }
  }

  /**
   * Activa o desactiva la visualización del bloque TABULAR.
   */
  toggleTable(): void {
    if (!this.state) return;

    if (this.state.tableOptions()) {
      this.dialogs.confirm({
        title: '¿Eliminar tabla?',
        message: 'Se perderá la configuración actual de la tabla. ¿Deseas continuar?',
        confirmText: 'Eliminar tabla',
        confirmPalette: 'blue'
      }).subscribe(result => {
        if (result) {
          this.state.tableOptions.set(null);
          if (this.state.isWizard) {
            this.eventBus.emit({ type: AppEventType.VISUALIZATION_WIZARD_TABLE_REMOVED });
          }
        }
      });
    } else {
      this.state.tableOptions.set(
        VisualizationFactory.createDefaultTableOptions(this.state.dataset())
      );
      if (this.state.isWizard) {
        this.eventBus.emit({ type: AppEventType.VISUALIZATION_WIZARD_TABLE_ADDED });
      }
    }
  }

  /**
   * Cambia el estado de publicación de la visualización.
   * @returns Un observable que emite true si el usuario confirmó el cambio.
   */
  togglePublished(): Observable<boolean> {
    const isCurrentlyPublished = this.state.visualization()?.published;

    const confirm$ = isCurrentlyPublished
      ? this.dialogs.confirm({
        title: '¿Pasar a borrador?',
        message: 'La visualización dejará de estar accesible para los usuarios de lectura.',
        confirmText: 'Pasar a borrador',
        confirmPalette: 'blue'
      })
      : this.dialogs.confirm({
        title: '¿Publicar visualización?',
        message: 'La visualización será visible para todos los usuarios con permisos de lectura.',
        confirmText: 'Publicar ahora',
        confirmPalette: 'blue'
      });

    return confirm$.pipe(
      map(result => {
        if (result) {
          this.applyTogglePublished();
          return true;
        }
        return false;
      })
    );
  }

  private applyTogglePublished(): void {
    const viz = this.state.visualization();
    if (!viz) return;

    const targetPublished = !viz.published;
    const action = targetPublished
      ? this.persistence.publish([viz.id])
      : this.persistence.unpublish([viz.id]);

    action.subscribe({
      next: (success) => {
        if (success) {
          this.wasSavedDuringSession.set(true);
          this.state.visualization.update(v => v ? { ...v, published: targetPublished } : null);
          this.takeStateSnapshot();
        }
      },
      error: (err) => console.error('Error al cambiar estado de publicación:', err)
    });
  }

  /**
   * Maneja los cambios de información (título, ficha técnica).
   * @param event Datos del cambio.
   */
  updateInformation(event: InformationEditEvent): void {
    this.state.visualization.update(viz => {
      if (!viz) return viz;
      const updated = { ...viz };
      if (event.isTechnicalSheet) {
        updated.technicalSheet = {
          ...updated.technicalSheet,
          [event.field]: event.value
        } as Visualization['technicalSheet'];
      } else {
        (updated as Record<string, unknown>)[event.field] = event.value;
      }
      return updated;
    });

    if (this.state.isWizard) {
      this.eventBus.emit({
        type: AppEventType.VISUALIZATION_WIZARD_INFO_EDITED,
        payload: { field: event.field }
      });
    }
  }

  /**
   * Intenta cerrar un diálogo verificando cambios pendientes.
   * @param dialogRef Referencia al MatDialogRef a cerrar.
   * @param filters Filtros actuales de la vista (para el guardado unificado).
   * @param hasVisualFilters Indica si hay filtros activos en la UI.
   */
  closeDialog(dialogRef: MatDialogRef<VisualizationComponent>, filters: FiltersConfig, hasVisualFilters: boolean): void {
    if (this.hasUnsavedChanges()) {
      this.dialogs.confirm({
        title: '¡Cuidado!',
        message: 'Estás saliendo sin guardar los cambios.\n¿Deseas guardar y salir?',
        confirmText: 'Guardar y salir',
        cancelText: 'Salir sin guardar',
        confirmPalette: 'blue'
      }).subscribe(result => {
        if (result === true) {
          // Ejecutar el flujo de guardado completo y cerrar al finalizar con éxito
          this.saveChanges(filters, hasVisualFilters, (saveResult) => dialogRef.close(saveResult));
        } else if (result === false) {
          // En la refactorización a AppDialogService, confirm() retorna false cuando se presiona cancelar/botón secundario
          dialogRef.close({ saved: this.wasSavedDuringSession() });
        }
      });
    } else {
      dialogRef.close({ saved: this.wasSavedDuringSession() });
    }
  }

  /**
   * Orquesta el flujo de guardado, preguntando por filtros si es necesario.
   * @param filters Filtros actuales de la vista.
   * @param hasVisualFilters Indica si hay filtros activos en la UI.
   * @param onSuccess Callback opcional a ejecutar tras un guardado exitoso.
   */
  saveChanges(filters: FiltersConfig, hasVisualFilters: boolean, onSuccess?: (result?: SaveResult) => void): void {
    if (this.editMode.isEditModeEnabled() && hasVisualFilters) {
      this.dialogs.confirm({
        title: '¿Guardar filtros actuales?',
        message: 'Se han detectado filtros aplicados. ¿Deseas que estos filtros se guarden de forma permanente?',
        confirmText: 'Sí, guardar con filtros',
        cancelText: 'No, solo diseño',
      }).subscribe((result) => {
        this.performSave(result ? filters : undefined, onSuccess);
      });
    } else {
      this.performSave(undefined, onSuccess);
    }
  }

  /**
   * Ensambla el objeto de visualización con los cambios realizados en el editor.
   * @param filters Filtros opcionales a aplicar de forma permanente.
   * @returns El objeto Visualization actualizado.
   */
  public getUpdatedVisualization(filters?: FiltersConfig): Visualization {
    const currentViz = this.state.visualization();
    if (!currentViz) return {} as Visualization;

    const viz = { ...currentViz };
    const block = viz.visualBlocks?.[0] || { id: 'main-block' };

    // Clonar para evitar mutaciones directas sobre el estado si no se guardan
    const updatedBlock = {
      ...block,
      chartOptions: this.state.chartOptions() || undefined,
      tableOptions: this.state.tableOptions() || undefined,
    };

    if (filters) {
      updatedBlock.filters = filters;
    }

    if (!viz.visualBlocks || viz.visualBlocks.length === 0) {
      viz.visualBlocks = [updatedBlock];
    } else {
      viz.visualBlocks = [updatedBlock, ...viz.visualBlocks.slice(1)];
    }

    return viz;
  }

  /**
   * Ejecuta la persistencia contra el backend.
   * @param filters Filtros opcionales.
   * @param onSuccess Callback opcional de éxito.
   */
  private performSave(filters?: FiltersConfig, onSuccess?: (result?: SaveResult) => void): void {
    const updatedViz = this.getUpdatedVisualization(filters);

    this.persistence.update(updatedViz.id, updatedViz).subscribe({
      next: () => {
        this.wasSavedDuringSession.set(true);
        this.takeStateSnapshot();
        if (onSuccess) onSuccess({ saved: true });
      },
      error: (err: unknown) => console.error('Error al guardar:', err)
    });
  }

  /** Serializa el estado relevante para comparación */
  private serializeCurrentState(): string {
    const viz = this.state.visualization();
    const dimensions = this.state.dimensions();
    const currentFilters = this.visualizationState.getFiltersFromDimensions(dimensions);

    const state = {
      title: viz?.title,
      informationUnitName: viz?.informationUnitName,
      measureUnit: viz?.measureUnit,
      technicalSheet: viz?.technicalSheet,
      chart: this.state.chartOptions(),
      table: this.state.tableOptions(),
      filters: currentFilters,
    };
    return JSON.stringify(state);
  }

}
