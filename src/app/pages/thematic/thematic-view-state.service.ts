import { Injectable, inject, signal } from '@angular/core';


import { Thematic } from '@models/domain/thematic.model';
import { Visualization, VisualizationFilter, VisualizationOrder } from '@models/domain/visualization.model';
import { AppEventBusService, ThematicStateService, VisualizationStateService } from '@services';
import { AppEventType } from '../../core/models/events/app-event.types';

/**
 * @class ThematicViewStateService
 * @description
 * Servicio encargado de gestionar el estado reactivo local de la página de temáticas.
 * Maneja la carga de visualizaciones, filtros aplicados y la temática seleccionada.
 */
@Injectable()
export class ThematicViewStateService {
  private readonly visualizationState = inject(VisualizationStateService);
  private readonly thematicState = inject(ThematicStateService);
  private readonly eventBus = inject(AppEventBusService);

  /** Lista de visualizaciones asociadas a la temática */
  public readonly visualizations = signal<Visualization[]>([]);
  /** Indica si se están cargando los datos */
  public readonly loading = signal(false);
  /** Filtros actuales aplicados a la visualización */
  public readonly filter = signal<VisualizationFilter>({});
  /** Criterio de ordenamiento actual */
  public readonly order = signal<VisualizationOrder>('default');
  /** Temática seleccionada actualmente en el navegador */
  public readonly selectedThematic = signal<Thematic | undefined>(undefined);

  /** Flag interno para evitar recargas duplicadas */
  private _currentId?: number;
  private _visualizationsLoaded = false;

  /**
   * Inicializa o reinicia el estado de la vista para una nueva temática.
   * @param id ID de la temática raíz.
   * @param thematic Entidad de la temática (opcional si ya se conoce).
   */
  public initialize(id: number, thematic?: Thematic): void {
    if (this._currentId === id && this._visualizationsLoaded) return;

    this._currentId = id;
    this._visualizationsLoaded = false;
    this.selectedThematic.set(undefined);

    if (thematic) {
      this.setupThematic(thematic);
    } else {
      // Si no viene la temática, esperamos a que el componente la obtenga del global state
      // o la buscamos nosotros. Por ahora la recibiremos del componente para mantener consistencia.
    }
  }

  /**
   * Configura los datos iniciales una vez que la temática está disponible.
   * @param thematic Temática cargada.
   */
  public setupThematic(thematic: Thematic): void {
    this.selectedThematic.set(thematic);
    this.filter.set({
      ...this.filter(),
      thematicIds: this.thematicState.getDescendantIds(thematic.id)
    });

    this.eventBus.emit({
      type: AppEventType.THEMATIC_VIEWED,
      payload: { id: thematic.id, name: thematic.name }
    });

    if (!this._visualizationsLoaded) {
      this.loadVisualizations(thematic.id);
    }
  }

  /**
   * Carga las visualizaciones para un ID de temática.
   * @param id ID de la temática.
   */
  public loadVisualizations(id: number): void {
    this._visualizationsLoaded = true;
    this.loading.set(true);

    this.visualizationState.getVisualizationsByThematic(id).subscribe({
      next: (data) => {
        this.visualizations.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('ThematicViewState: Error loading visualizations:', error);
        this._visualizationsLoaded = false;
        this.loading.set(false);
      }
    });
  }

  /**
   * Maneja el cambio de selección en el navegador de temáticas.
   * @param thematic Temática seleccionada (o undefined para volver a la raíz).
   * @param rootThematic Temática raíz de la página como fallback.
   */
  public selectThematic(thematic: Thematic | undefined, rootThematic?: Thematic): void {
    const target = thematic || rootThematic;
    this.selectedThematic.set(target);

    // --- Emisión de Eventos ---
    if (thematic && rootThematic) {
      if (thematic.parentId === rootThematic.id) {
        // Es una categoría (hijo directo de la raíz de la página)
        this.eventBus.emit({
          type: AppEventType.THEMATIC_CATEGORY_SELECTED,
          payload: { id: thematic.id, name: thematic.name }
        });
      } else if (thematic.id !== rootThematic.id) {
        // Es una subcategoría (nieto o nivel inferior)
        this.eventBus.emit({
          type: AppEventType.THEMATIC_SUBCATEGORY_SELECTED,
          payload: { id: thematic.id, name: thematic.name }
        });
      }
    }

    if (target) {
      this.filter.update(f => ({
        ...f,
        thematicIds: this.thematicState.getDescendantIds(target.id)
      }));
    } else {
      this.filter.update(f => ({ ...f, thematicIds: [] }));
    }
  }

  /**
   * Fuerza la recarga de las visualizaciones (útil tras acciones de edición).
   */
  public refresh(): void {
    if (this._currentId !== undefined) {
      this._visualizationsLoaded = false;
      this.loadVisualizations(this._currentId);
    }
  }
}
