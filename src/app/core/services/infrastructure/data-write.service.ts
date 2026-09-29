import { Injectable, inject } from '@angular/core';
import { Thematic } from '@models/domain/thematic.model';
import { Visualization } from '@models/domain/visualization.model';
import { SaveThematicDto, SaveVisualizationDto } from '@models/dto';
import { Observable } from 'rxjs';
import { IDataProvider } from '../../data/data.provider';

/**
 * Servicio de infraestructura para operaciones de ESCRITURA de datos.
 * Maneja la creación, actualización y eliminación de recursos, así como acciones de sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class DataWriteService {
  protected readonly dataProvider = inject(IDataProvider);

  // --- Temáticas ---
  createThematic(thematic: SaveThematicDto): Observable<Thematic> {
    return this.dataProvider.createThematic(thematic);
  }

  updateThematic(id: number, thematic: SaveThematicDto): Observable<Thematic> {
    return this.dataProvider.updateThematic(id, thematic);
  }

  deleteThematic(id: number): Observable<boolean> {
    return this.dataProvider.deleteThematic(id);
  }

  reorderThematics(thematicIds: number[]): Observable<boolean> {
    return this.dataProvider.reorderThematics(thematicIds);
  }

  assignVisualizationsToThematic(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean> {
    return this.dataProvider.assignVisualizationsToThematic(thematicId, visualizationIds);
  }

  unassignVisualizationFromThematic(thematicId: number, visualizationId: number | string): Observable<boolean> {
    return this.dataProvider.unassignVisualizationFromThematic(thematicId, visualizationId);
  }

  reorderThematicVisualizations(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean> {
    return this.dataProvider.reorderThematicVisualizations(thematicId, visualizationIds);
  }

  // --- Visualizaciones ---
  createVisualization(visualization: SaveVisualizationDto): Observable<Visualization> {
    return this.dataProvider.createVisualization(visualization);
  }

  updateVisualization(id: number | string, visualization: SaveVisualizationDto): Observable<boolean> {
    return this.dataProvider.updateVisualization(id, visualization);
  }

  publishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.dataProvider.publishVisualizations(ids);
  }

  unpublishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.dataProvider.unpublishVisualizations(ids);
  }

  deleteVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.dataProvider.deleteVisualizations(ids);
  }

  // --- Gestión de Caché ---
  clearCache(pattern?: string): void {
    if (this.dataProvider.clearCache) {
      this.dataProvider.clearCache(pattern);
    }
  }

  clearDataCache(datasetId: number | string): void {
    if (this.dataProvider.clearDataCache) {
      this.dataProvider.clearDataCache(datasetId);
    }
  }
}
