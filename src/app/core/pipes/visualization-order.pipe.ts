import { Pipe, PipeTransform } from '@angular/core';
import { Visualization, VisualizationOrder } from '@models/domain/visualization.model';

/**
 * Pipe encargado de ordenar dinámicamente un listado de visualizaciones.
 * Soporta múltiples criterios como nombre, fecha de actualización y complejidad (dimensiones).
 */
@Pipe({
  name: 'visualizationOrder',
  standalone: true,
})
export class VisualizationOrderPipe implements PipeTransform {
  /**
   * Ordena el arreglo de visualizaciones según el criterio especificado.
   * @param visualizations Lista de visualizaciones a ordenar.
   * @param order Criterio de ordenamiento (ej: 'name-asc', 'recent').
   * @returns Nueva lista ordenada.
   */
  transform(
    visualizations: Visualization[],
    order: VisualizationOrder
  ): Visualization[] {
    if (!visualizations?.length) return [];

    return [...visualizations].sort((a, b) => {
      switch (order) {
        case 'default':
          return 0;
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'recent':
          const dateA =
            a.technicalSheet?.lastUpdate ||
            a.metadata?.updatedAt ||
            '1970-01-01';
          const dateB =
            b.technicalSheet?.lastUpdate ||
            b.metadata?.updatedAt ||
            '1970-01-01';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        case 'serie-recent':
          return b.id > a.id ? 1 : b.id < a.id ? -1 : 0;
        case 'serie-old':
          return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
        case 'dimensions-more':
          return (b.dimensions?.length || 0) - (a.dimensions?.length || 0);
        case 'dimensions-less':
          return (a.dimensions?.length || 0) - (b.dimensions?.length || 0);
        default:
          return 0;
      }
    });
  }
}
