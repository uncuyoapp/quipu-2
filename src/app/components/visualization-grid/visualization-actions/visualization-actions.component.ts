import { Component, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';

import { Visualization, VisualizationFilter, VisualizationOrder } from '@models/domain/visualization.model';


import { ButtonComponent } from '@shared/components/button/button.component';
import { FilterComponent } from './filter/filter.component';
import { OrderComponent } from './order/order.component';
import { VisualizationSearchComponent } from './search/search.component';

@Component({
  selector: 'app-visualization-actions',
  standalone: true,
  imports: [
    VisualizationSearchComponent,
    FilterComponent,
    OrderComponent,
    ButtonComponent
  ],
  templateUrl: './visualization-actions.component.html',
  styleUrl: './visualization-actions.component.scss'
})
export class VisualizationActionsComponent {
  /** Referencia al componente de búsqueda para limpiar el input visualmente. */
  searchComponent = viewChild(VisualizationSearchComponent);

  protected readonly icons = APP_ICONS;

  /** Lista de visualizaciones recibida como entrada. */
  visualizations = input<Visualization[]>([]);

  /** Determina si se muestra la barra de búsqueda. */
  enableSearchBar = input<boolean>(true);

  /** Determina si se habilitan los filtros. */
  enableFilter = input<boolean>(true);

  /** Determina si se habilita el ordenamiento. */
  enableOrder = input<boolean>(true);

  /** Emisión de cambios en el filtro. */
  filterChange = output<VisualizationFilter>();

  /** Emisión de cambios en el orden. */
  orderChange = output<VisualizationOrder>();

  /** Texto de búsqueda actual. */
  searchText = signal<string>('');

  /** Estado actual de los filtros seleccionados. */
  filterSignal = signal<VisualizationFilter>({});

  /** Controla la visibilidad del panel de filtros. */
  showFilter = signal<boolean>(false);

  /** Controla la visibilidad del panel de ordenamiento. */
  showOrder = signal<boolean>(false);

  /** Criterio de ordenamiento actual. */
  orderSignal = signal<VisualizationOrder>('default');

  /**
   * Computed signal que extrae sugerencias únicas de búsqueda a partir de las visualizaciones.
   * Agrupa términos de títulos, resúmenes, unidades de medida y metadatos.
   */
  searchSuggestions = computed(() => {
    const list = this.visualizations();
    if (!list.length) return [];

    const suggestions = new Set<string>();

    list.forEach(v => {
      if (v.title) suggestions.add(v.title);
      if (v.summary) suggestions.add(v.summary);
      if (v.measureUnit) suggestions.add(v.measureUnit);

      v.thematics?.forEach(t => {
        if (t.name) suggestions.add(t.name);
      });

      if (v.technicalSheet?.description) {
        suggestions.add(v.technicalSheet.description);
      }
    });

    return Array.from(suggestions).sort();
  });

  constructor() {
    /** Reacciona a cambios en los filtros para emitir el evento al exterior. */
    effect(() => {
      const filter = this.filterSignal();
      const search = this.searchText();
      this.filterChange.emit({
        ...filter,
        search
      });
    });

    /** Reacciona a cambios en el orden para emitir el evento al exterior. */
    effect(() => {
      const order = this.orderSignal();
      this.orderChange.emit(order);
    });
  }

  /**
   * Actualiza el texto de búsqueda y dispara la actualización de filtros.
   * @param text Nuevo texto de búsqueda.
   */
  onSearchTextChange(text: string) {
    this.searchText.set(text);
  }

  /**
   * Alterna la visibilidad del panel de filtros.
   */
  toggleFilter(): void {
    this.showFilter.update(v => !v);
  }

  /**
   * Alterna la visibilidad del panel de ordenamiento.
   */
  toggleOrder(): void {
    this.showOrder.update(v => !v);
  }

  /**
   * Actualiza el criterio de ordenamiento.
   * @param order Nuevo criterio de ordenamiento.
   */
  onOrderChange(order: VisualizationOrder) {
    this.orderSignal.set(order);
  }

  /**
   * Actualiza el estado de los filtros.
   * @param filter Nuevo conjunto de filtros.
   */
  onFilterChange(filter: VisualizationFilter) {
    this.filterSignal.set(filter);
  }

  /**
   * Limpia todos los filtros y el texto de búsqueda.
     */
  clearFilters(): void {
    this.filterSignal.set({
      thematicIds: this.filterSignal().thematicIds,
    });
    this.searchText.set('');
    this.searchComponent()?.clear();
  }
}
