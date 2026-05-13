import { Injectable, inject } from '@angular/core';
import { VisualizationPage } from '@core/data/data.provider';
import { DownloadOptions } from '@models/common/download.model';
import { Visualization } from '@models/domain/visualization.model';
import { VisualizationFactory } from '@pages/visualization/visualization.factory';
import { Dataset, Dimension, FiltersConfig } from '@uncuyoapp/ngx-data-visualizer';
import { Observable, map, tap } from 'rxjs';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { DataReadService } from '../infrastructure/data-read.service';


/**
 * Servicio de solo lectura para el estado y lógica de negocio de visualizaciones.
 * Actúa como orquestador entre la infraestructura (DataService) y las necesidades de la vista.
 */
@Injectable({
  providedIn: 'root',
})
export class VisualizationStateService {
  private readonly dataRead = inject(DataReadService);
  private readonly eventBus = inject(AppEventBusService);

  /**
   * Obtiene una visualización por su ID.
   * @param id ID de la visualización.
   * @returns Observable con la entidad Visualization.
   */
  getVisualization(id: number | string): Observable<Visualization> {
    return this.dataRead.getVisualization(id).pipe(
      tap(() => this.eventBus.emit({
        type: AppEventType.VISUALIZATION_OPENED,
        payload: { id }
      }))
    );
  }

  /**
   * Obtiene un dataset por su ID.
   * @param datasetId ID del dataset.
   * @returns Observable con el Dataset.
   */
  getDataset(datasetId: number | string): Observable<Dataset> {
    return this.dataRead.getDataset(datasetId);
  }

  /**
   * Obtiene el dataset "preparado" para una visualización.
   * Realiza el corte físico de dimensiones e ítems basándose en la configuración persistida (baseFilters).
   * @param visualization Entidad visualización que contiene el datasetId y la configuración de datos.
   * @returns Observable con el Dataset procesado y reducido.
   */
  getPreparedDataset(visualization: Visualization): Observable<Dataset> {
    return this.dataRead.getDataset(visualization.datasetId).pipe(
      map(dataset => {
        // Aplicar la lógica de transformación centralizada en la Factory
        return VisualizationFactory.transformDataset(
          dataset,
          visualization.dataConfig?.baseFilters
        );
      })
    );
  }

  /**
   * Obtiene las visualizaciones asociadas a una temática.
   * @param thematicId ID de la temática.
   * @param recursive Indica si debe buscar en subtemáticas.
   */
  getVisualizationsByThematic(thematicId: number, recursive?: boolean): Observable<Visualization[]> {
    return this.dataRead.getVisualizationsByThematic(thematicId, recursive);
  }

  /**
   * Busca visualizaciones por texto (título, descripción, etc.).
   * @param searchText Término de búsqueda.
   */
  getVisualizationsByText(searchText: string): Observable<Visualization[]> {
    return this.dataRead.getVisualizationsByText(searchText);
  }

  /**
   * Obtiene una página paginada de visualizaciones.
   * @param page Número de página.
   * @param pageSize Tamaño de la página.
   */
  getVisualizationsPage(page: number, pageSize: number): Observable<VisualizationPage> {
    return this.dataRead.getVisualizationsPage(page, pageSize);
  }

  /**
   * Obtiene las visualizaciones marcadas como favoritas por un usuario.
   * @param userId ID del usuario.
   */
  getVisualizationsBookmarked(userId: number): Observable<Visualization[]> {
    return this.dataRead.getVisualizationsBookmarked(userId);
  }

  /**
   * Obtiene sugerencias de búsqueda de visualizaciones.
   * @param text Texto de búsqueda.
   */
  getSearchSuggestions(text: string): Observable<string[]> {
    return this.dataRead.getSearchSuggestions(text);
  }

  /**
   * Ejecuta la solicitud de descarga delegando a la infraestructura.
   * @param visualization Entidad de visualización con el estado actual.
   * @param options Opciones de descarga seleccionadas.
   */
  download(visualization: Visualization, options: DownloadOptions): void {
    this.eventBus.emit({
      type: AppEventType.DOWNLOAD_USED,
      payload: { id: visualization.id, options: options }
    });
    this.dataRead.downloadVisualization(visualization, options);
  }

  /**
   * Transforma un arreglo de dimensiones en una configuración de filtros válida.
   * @param dimensions Arreglo de dimensiones actuales.
   * @returns Configuración estructurada de filtros.
   */
  getFiltersFromDimensions(dimensions: Dimension[]): FiltersConfig {
    return VisualizationFactory.getFiltersFromDimensions(dimensions);
  }

  /**
   * Determina si una configuración de filtros tiene selecciones activas.
   * @param filters Configuración de filtros a evaluar.
   * @returns true si hay rollUp o ítems filtrados.
   */
  hasActiveFilters(filters: FiltersConfig): boolean {
    return VisualizationFactory.hasActiveFilters(filters);
  }
}
