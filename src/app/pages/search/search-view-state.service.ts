import { Injectable, inject, signal } from '@angular/core';
import { Visualization } from '@models/domain/visualization.model';
import { VisualizationStateService } from '@services';
import { finalize, tap } from 'rxjs';
import { AppEventType } from '../../core/models/events/app-event.types';
import { AppEventBusService } from '../../core/services/events/app-event-bus.service';

/** Pasos del flujo de búsqueda */
export type PasoBusqueda = 'busqueda' | 'resultados';

/**
 * @class SearchViewStateService
 * @description
 * Servicio encargado de gestionar el estado reactivo local de la página de búsqueda.
 * Orquesta los pasos del flujo, los resultados de la API y el término actual.
 */
@Injectable()
export class SearchViewStateService {
  private readonly visualizationState = inject(VisualizationStateService);
  private readonly eventBus = inject(AppEventBusService);

  /** Controla el paso activo del flujo (búsqueda o resultados) */
  public readonly paso = signal<PasoBusqueda>('busqueda');

  /** Término de búsqueda confirmado por el usuario */
  public readonly searchText = signal<string>('');

  /** Lista de visualizaciones obtenidas de la API */
  public readonly visualizations = signal<Visualization[]>([]);

  /** Indica si la búsqueda está en curso */
  public readonly loading = signal<boolean>(false);

  /**
   * Inicializa el estado basado en un parámetro de búsqueda.
   * @param q Término de búsqueda de la URL.
   */
  public initialize(q: string | undefined): void {
    if (q) {
      this.searchText.set(q);
      this.paso.set('resultados');
      this.buscar(q);
    } else {
      this.reset();
    }
  }

  /**
   * Ejecuta la búsqueda de visualizaciones.
   * @param texto Término a buscar.
   */
  public buscar(texto: string): void {
    const trimmed = (texto || '').trim();
    if (!trimmed) {
      this.reset();
      return;
    }

    this.searchText.set(trimmed);
    this.paso.set('resultados');
    this.loading.set(true);

    this.visualizationState.getVisualizationsByText(trimmed)
      .pipe(
        tap((results) => {
          this.eventBus.emit({
            type: AppEventType.SEARCH_USED,
            payload: { query: trimmed, resultsCount: results.length }
          });
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data) => this.visualizations.set(data),
        error: (err) => {
          console.error('SearchViewState: Error searching visualizations:', err);
          this.visualizations.set([]);
        }
      });
  }

  /**
   * Reinicia el estado a los valores iniciales.
   */
  public reset(): void {
    this.searchText.set('');
    this.visualizations.set([]);
    this.paso.set('busqueda');
    this.loading.set(false);
  }
}
