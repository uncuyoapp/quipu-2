import { Pipe, PipeTransform } from '@angular/core';
import { Visualization, VisualizationFilter } from '@models/domain/visualization.model';

/**
 * Pipe encargado de filtrar un listado de visualizaciones basándose en múltiples criterios.
 * Realiza búsquedas por texto y filtrado por temáticas, dimensiones y estado de publicación.
 */
@Pipe({
  name: 'visualizationFilter',
  standalone: true,
  pure: true,
})
export class VisualizationFilterPipe implements PipeTransform {
  /**
   * Filtra las visualizaciones según el objeto de configuración de filtros.
   * @param visualizations Lista completa de visualizaciones.
   * @param filter Configuración de filtros activos.
   * @returns Lista de visualizaciones que cumplen con los criterios.
   */
  transform(
    visualizations: Visualization[] | null | undefined,
    filter: VisualizationFilter | undefined
  ): Visualization[] {
    if (!visualizations) return [];
    if (!filter) return visualizations;

    let filteredVisualizations = [...visualizations];

    // Filtrar por texto de búsqueda
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredVisualizations = filteredVisualizations.filter(
        (v) =>
          v.title.toLowerCase().includes(searchLower) ||
          (v.summary && v.summary.toLowerCase().includes(searchLower)) ||
          v.measureUnit.toLowerCase().includes(searchLower) ||
          v.thematics.some((thematic) =>
            thematic.name.toLowerCase().includes(searchLower)
          ) ||
          (v.technicalSheet?.description &&
            v.technicalSheet.description.toLowerCase().includes(searchLower))
      );
    }

    // Filtrar por temática (IDs)
    if (filter.thematicIds && filter.thematicIds.length > 0) {
      filteredVisualizations = filteredVisualizations.filter((v) =>
        v.thematics.some((thematic) => filter.thematicIds!.includes(thematic.id))
      );
    }

    // Filtrar por dimensiones
    if (filter.dimensions && filter.dimensions.length > 0) {
      filteredVisualizations = filteredVisualizations.filter((v) =>
        filter.dimensions!.some((dimensionName) =>
          v.dimensions.includes(dimensionName)
        )
      );
    }

    // Filtrar por unidad de medida
    if (filter.measureUnit) {
      filteredVisualizations = filteredVisualizations.filter(
        (v) => v.measureUnit === filter.measureUnit
      );
    }

    // Filtrar por periodicidad
    if (filter.periodicity) {
      filteredVisualizations = filteredVisualizations.filter(
        (v) => v.periodicity === filter.periodicity
      );
    }

    // Filtrar por estado de publicación
    if (filter.showDrafts === false) {
      filteredVisualizations = filteredVisualizations.filter(v => v.published);
    }

    return filteredVisualizations;
  }
}
