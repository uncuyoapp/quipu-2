import { Injectable, inject } from '@angular/core';
import { DownloadOptions } from '@models/common/download.model';
import { Dataset, DatasetInfo } from '@models/domain/dataset.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { User } from '@models/domain/user.model';
import { Visualization, VisualizationPage } from '@models/domain/visualization.model';
import { BaseApiService, CacheService } from '@services';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IDataProvider } from '../data.provider';

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
    visualizationsBookmarked: 'visualizations/bookmarked',
    datasets: 'datasets',
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
  };

  getThematics(): Observable<Thematic[]> {
    return this.get<Thematic[]>(this.endpoints.thematics);
  }

  createThematic(thematic: Partial<Thematic>): Observable<Thematic> {
    return this.post<Thematic>(this.endpoints.thematics, thematic);
  }

  updateThematic(id: number, thematic: Partial<Thematic>): Observable<Thematic> {
    return this.put<Thematic>(`${this.endpoints.thematics}/${id}`, thematic);
  }

  deleteThematic(id: number): Observable<boolean> {
    return this.delete<any>(`${this.endpoints.thematics}/${id}`).pipe(map(() => true));
  }

  reorderThematics(thematicIds: number[]): Observable<boolean> {
    return this.post<any>(this.endpoints.thematicsReorder, { order: thematicIds }).pipe(map(() => true));
  }

  getVisualization(id: number | string): Observable<Visualization> {
    return this.get<Visualization>(`${this.endpoints.visualizations}/${id}`);
  }

  updateVisualization(id: number | string, visualization: Visualization): Observable<boolean> {
    return this.put<any>(`${this.endpoints.visualizations}/${id}`, visualization).pipe(map(() => true));
  }

  createVisualization(visualization: Visualization): Observable<Visualization> {
    return this.post<Visualization>(this.endpoints.visualizations, visualization);
  }

  publishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsPublish, { ids }).pipe(map(() => true));
  }

  unpublishVisualizations(ids: (number | string)[]): Observable<boolean> {
    return this.post<any>(this.endpoints.visualizationsUnpublish, { ids }).pipe(map(() => true));
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
    return this.get<Visualization[]>(`${this.endpoints.visualizationsBookmarked}/${userId}`);
  }

  getSearchSuggestions(searchText: string): Observable<string[]> {
    return this.get<any[]>(this.endpoints.searchSuggestions, { q: searchText }).pipe(
      map(items => (items || []).map(item => (typeof item === 'string' ? item : item.text)))
    );
  }

  download(visualization: Visualization, options: DownloadOptions): void {
    // TODO: Implementar llamada a API para generación de reporte PDF/Excel
    console.warn('Descarga no implementada en QuipuApiProvider');
  }

  getDataset(datasetId: number | string): Observable<Dataset> {
    return this.get<any>(`${this.endpoints.datasets}/${datasetId}`).pipe(map(res => new Dataset(res)));
  }

  getDatasets(): Observable<DatasetInfo[]> {
    return this.get<DatasetInfo[]>(this.endpoints.datasets);
  }

  getCurrentUser(): Observable<User> {
    return this.get<User>(this.endpoints.currentUser).pipe(
      map(user => ({
        ...user,
        token: this.getAuthToken() || user.token,
        informationUnits: (user.informationUnits || []).map((u: any) => typeof u === 'object' ? u.id : u)
      }))
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.post<any>(this.endpoints.login, { username, password }).pipe(map(res => {
      this.setAuthorizationToken(res.token);
      const user = res.user;
      if (user?.selectedIU) {
        this.setInformationUnitId(user.selectedIU);
      }
      return {
        ...user,
        token: res.token,
        informationUnits: (user.informationUnits || []).map((u: any) => typeof u === 'object' ? u.id : u)
      };
    }));
  }

  logout(): Observable<void> {
    return this.post<void>(this.endpoints.logout, {}).pipe(
      map(() => {
        this.removeAuthToken();
        this.setInformationUnitId(null);
      })
    );
  }

  getInformationUnits(): Observable<InformationUnit[]> {
    return this.get<InformationUnit[]>(this.endpoints.informationUnits);
  }

  selectInformationUnit(unitId: number): Observable<boolean> {
    return this.post<any>(this.endpoints.selectInformationUnit, { unitId }).pipe(
      map(() => {
        this.setInformationUnitId(unitId);
        return true;
      })
    );
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
    this.clearCache(`${this.endpoints.datasets}/${datasetId}`);
  }

  public initializeFromStoredData(userData: { token?: string; selectedIU?: number }): void {
    if (userData.token) {
      this.setAuthToken(userData.token);
    }
    if (userData.selectedIU) {
      this.setInformationUnitId(userData.selectedIU);
    }
  }
}
