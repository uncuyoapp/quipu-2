import { Injectable, inject } from '@angular/core';
import { normalizeDimensions } from '@core/utils/dimension.utils';
import { DownloadOptions } from '@models/common/download.model';
import { Dataset, DatasetInfo } from '@models/domain/dataset.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { Visualization, VisualizationPage } from '@models/domain/visualization.model';
import { SaveThematicDto, SaveVisualizationDto } from '@models/dto';
import { BaseApiService, CacheService } from '@services';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IDataProvider } from '../data.provider';

/**
 * Proveedor de datos de dominio respaldado por la API REST v2 de Quipu.
 * Gestiona temáticas, datasets y visualizaciones.
 */
@Injectable()
export class QuipuApiProvider extends BaseApiService implements IDataProvider {
  protected override cacheService = inject(CacheService);

  private readonly endpoints = {
    thematics: 'thematics',
    thematicsReorder: 'thematics/reorder',
    visualizations: 'visualizations',
    visualizationsByThematic: 'thematics',
    searchVisualizations: 'search/visualizations',
    searchSuggestions: 'search/suggestions',
    visualizationsPublish: 'visualizations/publish',
    visualizationsUnpublish: 'visualizations/unpublish',
    datasets: 'datasets',
    informationUnits: 'information-units',
  };

  getThematics(): Observable<Thematic[]> {
    return this.get<Thematic[]>(this.endpoints.thematics);
  }

  createThematic(thematic: SaveThematicDto): Observable<Thematic> {
    return this.post<Thematic>(this.endpoints.thematics, thematic, { skipGlobalError: true });
  }

  updateThematic(id: number, thematic: SaveThematicDto): Observable<Thematic> {
    return this.put<Thematic>(`${this.endpoints.thematics}/${id}`, thematic, { skipGlobalError: true });
  }

  deleteThematic(id: number): Observable<boolean> {
    return this.delete<any>(`${this.endpoints.thematics}/${id}`, undefined, { skipGlobalError: true }).pipe(map(() => true));
  }

  reorderThematics(thematicIds: number[]): Observable<boolean> {
    return this.post<any>(this.endpoints.thematicsReorder, { order: thematicIds }, { skipGlobalError: true }).pipe(map(() => true));
  }

  getVisualization(id: number | string): Observable<Visualization> {
    return this.get<Visualization>(`${this.endpoints.visualizations}/${id}`);
  }

  updateVisualization(id: number | string, visualization: SaveVisualizationDto): Observable<boolean> {
    return this.put<any>(`${this.endpoints.visualizations}/${id}`, visualization, { skipGlobalError: true }).pipe(map(() => true));
  }

  createVisualization(visualization: SaveVisualizationDto): Observable<Visualization> {
    return this.post<Visualization>(this.endpoints.visualizations, visualization, { skipGlobalError: true });
  }

  publishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsPublish, { ids }, { skipGlobalError: true }).pipe(map(() => true));
  }

  unpublishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsUnpublish, { ids }, { skipGlobalError: true }).pipe(map(() => true));
  }

  deleteVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.delete<any>(this.endpoints.visualizations, { ids }).pipe(map(() => true));
  }

  getVisualizationsByThematic(thematicId: number): Observable<Visualization[]> {
    return this.get<Visualization[]>(`${this.endpoints.visualizationsByThematic}/${thematicId}/visualizations`);
  }

  getVisualizationsByText(searchText: string): Observable<Visualization[]> {
    return this.get<Visualization[]>(this.endpoints.searchVisualizations, { q: searchText });
  }

  getVisualizationsPage(page: number, pageSize: number): Observable<VisualizationPage> {
    return this.getRaw<any>(this.endpoints.visualizations, { page, pageSize }).pipe(
      map(res => ({
        items: res?.data ?? [],
        totalItems: res?.pagination?.totalElements ?? (res?.data?.length ?? 0),
        page: res?.pagination?.page ?? page,
        pageSize: res?.pagination?.pageSize ?? pageSize
      }))
    );
  }

  getVisualizationsBookmarked(userId: number): Observable<Visualization[]> {
    try {
      const key = `quipu_bookmarks_${userId}`;
      const stored = localStorage.getItem(key);
      const items: Visualization[] = stored ? JSON.parse(stored) : [];
      return of(items);
    } catch (e) {
      console.error('Error leyendo favoritos locales:', e);
      return of([]);
    }
  }

  getSearchSuggestions(searchText: string): Observable<string[]> {
    return this.get<any[]>(this.endpoints.searchSuggestions, { q: searchText }).pipe(
      map(items => (items || []).map(item => (typeof item === 'string' ? item : item.text)))
    );
  }

  download(visualization: Visualization, options: DownloadOptions): void {
    console.warn('Descarga no implementada en QuipuApiProvider');
  }

  getDataset(datasetId: number | string): Observable<Dataset> {
    return this.get<any>(`${this.endpoints.datasets}/${datasetId}`).pipe(
      map(res => {
        const normalizedDimensions = normalizeDimensions(res?.dimensions);
        return new Dataset({
          ...res,
          dimensions: normalizedDimensions
        });
      })
    );
  }

  getDatasets(): Observable<DatasetInfo[]> {
    return this.get<DatasetInfo[]>(this.endpoints.datasets);
  }

  // --- Métodos de Relación Temática - Visualizaciones (N:M) ---

  getAvailableVisualizationsForThematic(thematicId: number): Observable<Visualization[]> {
    const url = `${this.endpoints.thematics}/${thematicId}/visualizations/available`;
    return this.get<Visualization[]>(url);
  }

  assignVisualizationsToThematic(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean> {
    const url = `${this.endpoints.thematics}/${thematicId}/visualizations`;
    return this.post<any>(url, { visualizationIds }).pipe(map(() => true));
  }

  unassignVisualizationFromThematic(thematicId: number, visualizationId: number | string): Observable<boolean> {
    const url = `${this.endpoints.thematics}/${thematicId}/visualizations/${visualizationId}`;
    return this.delete<any>(url).pipe(map(() => true));
  }

  reorderThematicVisualizations(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean> {
    const url = `${this.endpoints.thematics}/${thematicId}/visualizations/reorder`;
    return this.post<any>(url, { visualizationIds }).pipe(map(() => true));
  }

  public override clearCache(pattern?: string): void {
    if (pattern) {
      this.cacheService.clearByPattern(pattern);
    } else {
      this.cacheService.clear();
    }
  }

  public clearDataCache(datasetId: number | string): void {
    this.clearCache(`${this.endpoints.datasets}/${datasetId}`);
  }

  getInformationUnits(): Observable<InformationUnit[]> {
    return this.get<InformationUnit[]>(this.endpoints.informationUnits);
  }
}
