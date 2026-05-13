import { Injectable, inject } from '@angular/core';
import { DownloadOptions } from '@models/common/download.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { User } from '@models/domain/user.model';
import { Visualization } from '@models/domain/visualization.model';
import { Dataset } from '@uncuyoapp/ngx-data-visualizer';
import { Observable } from 'rxjs';
import { DatasetInfo, IDataProvider, VisualizationPage } from '../../data/data.provider';

/**
 * Servicio de infraestructura para operaciones de LECTURA de datos.
 * Proporciona métodos para consultar temáticas, visualizaciones, datasets e información de sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class DataReadService {
  protected readonly dataProvider = inject(IDataProvider);

  // --- Temáticas ---
  getThematics(): Observable<Thematic[]> {
    return this.dataProvider.getThematics();
  }

  // --- Visualizaciones ---
  getVisualization(id: number | string): Observable<Visualization> {
    return this.dataProvider.getVisualization(id);
  }

  getVisualizationsByThematic(thematicId: number, recursive?: boolean): Observable<Visualization[]> {
    return this.dataProvider.getVisualizationsByThematic(thematicId, recursive);
  }

  getVisualizationsByText(searchText: string): Observable<Visualization[]> {
    return this.dataProvider.getVisualizationsByText(searchText);
  }

  getVisualizationsPage(page: number, pageSize: number): Observable<VisualizationPage> {
    return this.dataProvider.getVisualizationsPage(page, pageSize);
  }

  getSearchSuggestions(searchText: string): Observable<string[]> {
    return this.dataProvider.getSearchSuggestions(searchText);
  }

  getVisualizationsBookmarked(userId: number): Observable<Visualization[]> {
    return this.dataProvider.getVisualizationsBookmarked(userId);
  }

  // --- Descargas ---
  downloadVisualization(visualization: Visualization, options: DownloadOptions): void {
    this.dataProvider.download(visualization, options);
  }

  // --- Datasets ---
  getDataset(datasetId: number | string): Observable<Dataset> {
    return this.dataProvider.getDataset(datasetId);
  }

  getDatasets(): Observable<DatasetInfo[]> {
    return this.dataProvider.getDatasets();
  }

  // --- Usuario y Sesión ---
  getCurrentUser(): Observable<User> {
    return this.dataProvider.getCurrentUser();
  }

  getInformationUnits(): Observable<InformationUnit[]> {
    return this.dataProvider.getInformationUnits();
  }

  isAuthenticated(): boolean {
    return this.dataProvider.isAuthenticated();
  }

  getAuthToken(): string | null {
    return this.dataProvider.getAuthToken();
  }

  verifyRecoveryToken(token: string): Observable<boolean> {
    return this.dataProvider.verifyRecoveryToken(token);
  }

  /**
   * Inicializa el proveedor de datos a partir de los datos almacenados en sesión anterior.
   * Delega al método opcional del proveedor activo (aplica principalmente a MockDataProvider).
   * @param userData Token y unidad de información previamente guardados.
   */
  initializeFromStoredData(userData: { token?: string; selectedIU?: number }): void {
    this.dataProvider.initializeFromStoredData?.(userData);
  }

  // --- Gestión de caché ---

  /**
   * Limpia la caché del proveedor, opcionalmente filtrando por patrón.
   * @param pattern Patrón opcional para limpieza selectiva.
   */
  clearCache(pattern?: string): void {
    this.dataProvider.clearCache?.(pattern);
  }
}
