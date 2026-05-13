import { Injectable, inject } from '@angular/core';
import { DownloadOptions } from '@models/common/download.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { User } from '@models/domain/user.model';
import { Visualization } from '@models/domain/visualization.model';
import { BaseApiService, CacheService } from '@services';
import { Dataset } from '@uncuyoapp/ngx-data-visualizer';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatasetInfo, IDataProvider, VisualizationPage } from '../data.provider';

@Injectable()
export class QuipuApiProvider extends BaseApiService implements IDataProvider {
  protected override cacheService = inject(CacheService);

  private readonly endpoints = {
    thematics: 'get-categories',
    thematicCreate: 'create-category',
    thematicUpdate: 'update-category',
    thematicDelete: 'delete-category',
    thematicsReorder: 'reorder-categories',
    visualization: 'get-visualization',
    visualizationsByThematic: 'get-visualizations-by-thematic',
    visualizationsByText: 'get-visualizations-by-text',
    visualizationsPage: 'get-visualizations-page',
    visualizationsBookmarked: 'get-visualizations-bookmarked',
    dataset: 'get-dataset',
    login: 'auth/login',
    currentUser: 'auth/me',
    logout: 'auth/logout',
    informationUnits: 'information-units',
    selectInformationUnit: 'auth/select-information-unit',
    recoveryPass: 'auth/recovery-pass',
    verifyRecoveryToken: 'auth/verify-recovery-token',
    changePassword: 'auth/change-password',
    updatePassword: 'auth/update-password',
    updateEmail: 'auth/update-email',
    updateName: 'auth/update-name',
    updateWorkArea: 'auth/update-work-area',
    visualizationsPublish: 'publish-visualizations',
    visualizationsUnpublish: 'unpublish-visualizations',
    visualizationsDelete: 'delete-visualizations',
    datasets: 'get-datasets',
  };

  getThematics(): Observable<Thematic[]> {
    return this.get<Thematic[]>(this.endpoints.thematics);
  }

  createThematic(thematic: Partial<Thematic>): Observable<Thematic> {
    return this.post<Thematic>(this.endpoints.thematicCreate, thematic);
  }

  updateThematic(id: number, thematic: Partial<Thematic>): Observable<Thematic> {
    return this.put<Thematic>(`${this.endpoints.thematicUpdate}/${id}`, thematic);
  }

  deleteThematic(id: number): Observable<boolean> {
    return this.delete<any>(`${this.endpoints.thematicDelete}/${id}`).pipe(map(() => true));
  }

  reorderThematics(thematicIds: number[]): Observable<boolean> {
    return this.post<any>(this.endpoints.thematicsReorder, { order: thematicIds }).pipe(map(() => true));
  }

  getVisualization(id: number | string): Observable<Visualization> {
    return this.get<Visualization>(`${this.endpoints.visualization}/${id}`);
  }

  updateVisualization(id: number | string, visualization: Visualization): Observable<boolean> {
    return this.put<any>(`update-visualization/${id}`, visualization).pipe(map(() => true));
  }

  createVisualization(visualization: Visualization): Observable<Visualization> {
    return this.post<Visualization>('create-visualization', visualization);
  }

  publishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsPublish, { ids }).pipe(map(() => true));
  }

  unpublishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsUnpublish, { ids }).pipe(map(() => true));
  }

  deleteVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsDelete, { ids }).pipe(map(() => true));
  }

  getVisualizationsByThematic(thematicId: number): Observable<Visualization[]> {
    return this.get<Visualization[]>(this.endpoints.visualizationsByThematic, { thematicId });
  }

  getVisualizationsByText(searchText: string): Observable<Visualization[]> {
    return this.get<Visualization[]>(this.endpoints.visualizationsByText, { q: searchText });
  }

  getVisualizationsPage(page: number, pageSize: number): Observable<VisualizationPage> {
    return this.get<VisualizationPage>(this.endpoints.visualizationsPage, { page, pageSize });
  }

  getVisualizationsBookmarked(userId: number): Observable<Visualization[]> {
    return this.get<Visualization[]>(this.endpoints.visualizationsBookmarked, { userId });
  }

  getSearchSuggestions(searchText: string): Observable<string[]> {
    return of([]);
  }

  download(visualization: Visualization, options: DownloadOptions): void {
    // TODO: Implementar llamada a API para generación de reporte PDF/Excel
    console.warn('Descarga no implementada en QuipuApiProvider');
  }

  getDataset(datasetId: number | string): Observable<Dataset> {
    return this.get<any>(`${this.endpoints.dataset}/${datasetId}`).pipe(map(res => new Dataset(res)));
  }

  getDatasets(): Observable<DatasetInfo[]> {
    return this.get<DatasetInfo[]>(this.endpoints.datasets);
  }

  getCurrentUser(): Observable<User> {
    return this.get<User>(this.endpoints.currentUser).pipe(
      map(user => ({
        ...user,
        informationUnits: user.informationUnits.map((u: any) => typeof u === 'object' ? u.id : u)
      }))
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.post<any>(this.endpoints.login, { username, password }).pipe(map(res => {
      this.setAuthorizationToken(res.token);
      const user = res.user;
      return {
        ...user,
        token: res.token,
        informationUnits: user.informationUnits.map((u: any) => typeof u === 'object' ? u.id : u)
      };
    }));
  }

  logout(): Observable<void> {
    return this.post<void>(this.endpoints.logout, {});
  }

  getInformationUnits(): Observable<InformationUnit[]> {
    return this.get<InformationUnit[]>(this.endpoints.informationUnits);
  }

  selectInformationUnit(unitId: number): Observable<boolean> {
    return this.post<any>(this.endpoints.selectInformationUnit, { unitId }).pipe(map(() => true));
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getAuthToken(): string | null {
    // El token se gestiona en las cabeceras de la clase base BaseApiService
    const authHeader = this.headers.get('Authorization');
    return authHeader ? authHeader.replace('Bearer ', '') : null;
  }

  setAuthToken(token: string): void {
    this.setAuthorizationToken(token);
  }

  removeAuthToken(): void {
    this.removeAuthorizationToken();
  }

  recoveryPass(email: string): Observable<string> { return this.get<string>(this.endpoints.recoveryPass, { email }); }
  verifyRecoveryToken(token: string): Observable<boolean> { return this.get<boolean>(this.endpoints.verifyRecoveryToken, { token }); }
  changePassword(token: string, newPassword: string): Observable<boolean> { return this.post<boolean>(this.endpoints.changePassword, { token, newPassword }); }
  updatePassword(oldPassword: string, newPassword: string): Observable<boolean> { return this.post<boolean>(this.endpoints.updatePassword, { oldPassword, newPassword }); }
  updateEmail(newEmail: string): Observable<boolean> { return this.post<boolean>(this.endpoints.updateEmail, { email: newEmail }); }
  updateName(newName: string): Observable<boolean> { return this.post<boolean>(this.endpoints.updateName, { name: newName }); }
  updateWorkArea(newArea: string): Observable<boolean> { return this.post<boolean>(this.endpoints.updateWorkArea, { workArea: newArea }); }

  public override clearCache(pattern?: string): void {
    if (pattern) {
      this.cacheService.clearByPattern(pattern);
    } else {
      this.cacheService.clear();
    }
  }

  public clearDataCache(datasetId: number | string): void {
    this.clearCache(`${this.endpoints.dataset}/${datasetId}`);
  }

  public initializeFromStoredData(userData: { token?: string; selectedIU?: number }): void {
    if (userData.token) {
      this.setAuthToken(userData.token);
    }
  }
}
