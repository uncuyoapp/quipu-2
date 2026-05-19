import { Injectable, inject } from '@angular/core';
import { DownloadOptions } from '@models/common/download.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { User } from '@models/domain/user.model';
import { Visualization } from '@models/domain/visualization.model';
import { AppNotificationService, LoadingService } from '@services';
import { Dataset } from '@uncuyoapp/ngx-data-visualizer';
import { Observable, concatMap, delay, map, of, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DatasetInfo, IDataProvider, VisualizationPage } from '../data.provider';
import {
  CURRENT_MOCK_USER,
  MOCK_DATASETS,
  MOCK_INFORMATION_UNITS,
  MOCK_THEMATICS_BY_UNIT,
  MOCK_USERS,
  MOCK_VISUALIZATIONS,
  MockDatasetRaw,
  VALID_MOCK_CREDENTIALS,
  VALID_RECOVERY_TOKENS
} from '../mock';

/**
 * Implementación Mock de IDataProvider para propósitos de desarrollo y pruebas.
 * Devuelve datos estáticos con retardos de red simulados y gestión de carga.
 */
@Injectable()
export class MockDataProvider extends IDataProvider {
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private selectedInformationUnit: number = 1;

  private readonly loading = inject(LoadingService);
  private readonly notification = inject(AppNotificationService);

  constructor() {
    super();
  }

  // Simular retraso de red para operaciones asíncronas
  private _simulateDelay(): Observable<void> {
    this.loading.show();
    const delayTime = Math.random() * 600 + 1500; // Reducido un poco para mejor experiencia en mock
    return of(undefined).pipe(
      delay(delayTime),
      finalize(() => this.loading.hide())
    );
  }

  private get _currentThematics(): Thematic[] {
    return MOCK_THEMATICS_BY_UNIT[this.selectedInformationUnit] || [];
  }

  private get _filteredVisualizations(): Visualization[] {
    const unit = MOCK_INFORMATION_UNITS.find(u => u.id === this.selectedInformationUnit);
    if (!unit) return MOCK_VISUALIZATIONS as Visualization[];
    return MOCK_VISUALIZATIONS.filter(v => v.informationUnitName === unit.shortName) as Visualization[];
  }

  private _deepClone<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }

  private _normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private _getDescendantIds(thematicId: number): number[] {
    const ids: number[] = [];
    const collectIds = (items: Thematic[], targetId: number, found: boolean = false): boolean => {
      for (const item of items) {
        let isTarget = found || item.id === targetId;
        if (isTarget) ids.push(item.id);
        if (item.childrens?.length) {
          const childFound = collectIds(item.childrens, targetId, isTarget);
          if (childFound && !found) return true;
        }
        if (item.id === targetId) return true;
      }
      return false;
    };
    collectIds(this._currentThematics, thematicId);
    return ids;
  }

  private _findThematicRecursive(items: Thematic[], id: number): Thematic | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.childrens?.length) {
        const found = this._findThematicRecursive(item.childrens, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  private _updateThematicRecursive(items: Thematic[], id: number, data: Partial<Thematic>): boolean {
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i] = { ...items[i], ...data };
        return true;
      }
      if (items[i].childrens?.length) {
        if (this._updateThematicRecursive(items[i].childrens!, id, data)) return true;
      }
    }
    return false;
  }

  private _addThematicToParent(items: Thematic[], parentId: number, newNode: Thematic): boolean {
    for (const item of items) {
      if (item.id === parentId) {
        if (!item.childrens) item.childrens = [];
        item.childrens.push(newNode);
        return true;
      }
      if (item.childrens?.length) {
        if (this._addThematicToParent(item.childrens!, parentId, newNode)) return true;
      }
    }
    return false;
  }

  private _addThematicToActiveUnit(newNode: Thematic): void {
    const currentList = this._currentThematics;
    currentList.push(newNode);
    MOCK_THEMATICS_BY_UNIT[this.selectedInformationUnit] = currentList;
  }

  private _removeThematicRecursive(items: Thematic[], id: number): boolean {
    const index = items.findIndex(t => t.id === id);
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }
    for (const item of items) {
      if (item.childrens?.length) {
        if (this._removeThematicRecursive(item.childrens!, id)) return true;
      }
    }
    return false;
  }

  private _syncVisualizationsWithThematic(thematicId: number, thematicName: string, visualizationIds: (number | string)[]) {
    const selectedIds = new Set(visualizationIds.map(id => String(id)));

    MOCK_VISUALIZATIONS.forEach(viz => {
      const isSelected = selectedIds.has(String(viz.id));
      const thematicRefIndex = viz.thematics.findIndex(t => t.id === thematicId);

      if (isSelected && thematicRefIndex === -1) {
        // Añadir asociación
        viz.thematics.push({ id: thematicId, name: thematicName });
      } else if (!isSelected && thematicRefIndex !== -1) {
        // Quitar asociación
        viz.thematics.splice(thematicRefIndex, 1);
      }
    });
  }

  // Thematic-related methods
  public getThematics(): Observable<Thematic[]> {
    return this._simulateDelay().pipe(concatMap(() => of(this._deepClone(this._currentThematics))));
  }
  public createThematic(thematic: Partial<Thematic>): Observable<Thematic> {
    return this._simulateDelay().pipe(concatMap(() => {
      const currentSet = this._currentThematics;

      // Calcular nuevo ID buscando en todo el árbol (simplificado para mock)
      const allIds: number[] = [];
      const collectIds = (items: Thematic[]) => items.forEach(i => {
        allIds.push(i.id);
        if (i.childrens) collectIds(i.childrens);
      });
      collectIds(currentSet);
      const newId = Math.max(...allIds, 10 * this.selectedInformationUnit) + 1;

      const newThematic: Thematic = {
        id: newId,
        name: thematic.name || 'Nueva',
        childrens: [],
        ...thematic
      } as Thematic;

      if (thematic.parentId) {
        const added = this._addThematicToParent(currentSet, thematic.parentId, newThematic);
        if (!added) this._addThematicToActiveUnit(newThematic);
      } else {
        this._addThematicToActiveUnit(newThematic);
      }

      return of(this._deepClone(newThematic));
    }));
  }

  public updateThematic(id: number, thematic: Partial<Thematic>): Observable<Thematic> {
    return this._simulateDelay().pipe(concatMap(() => {
      const currentSet = this._currentThematics;
      const found = this._findThematicRecursive(currentSet, id);
      if (!found) return throwError(() => new Error('Not found'));

      // 1. Actualizar el árbol de temáticas
      this._updateThematicRecursive(currentSet, id, thematic);
      const updated = this._findThematicRecursive(currentSet, id)!;

      // 2. Sincronizar visualizaciones si hay cambios en visualizationIds
      if (thematic.visualizationIds) {
        this._syncVisualizationsWithThematic(id, updated.name, thematic.visualizationIds);
      }

      return of(this._deepClone(updated));
    }));
  }

  public deleteThematic(id: number): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => {
      const currentSet = this._currentThematics;
      const removed = this._removeThematicRecursive(currentSet, id);
      if (!removed) return throwError(() => new Error('Not found'));
      return of(true);
    }));
  }

  public reorderThematics(thematicIds: number[]): Observable<boolean> {
    return of(true);
  }

  // Visualization-related methods
  public getVisualization(id: number | string): Observable<Visualization> {
    return this._simulateDelay().pipe(concatMap(() => {
      const v = MOCK_VISUALIZATIONS.find(viz => viz.id == id);
      if (!v) return throwError(() => new Error('Not found'));
      return of(this._deepClone(v) as Visualization);
    }));
  }

  public getVisualizationsByThematic(thematicId: number, recursive: boolean = true): Observable<Visualization[]> {
    const ids = recursive ? this._getDescendantIds(thematicId) : [thematicId];
    const filtered = this._filteredVisualizations.filter(v => v.thematics.some(t => ids.includes(t.id)));
    return of(this._deepClone(filtered) as Visualization[]);
  }

  public getVisualizationsByText(searchText: string): Observable<Visualization[]> {
    const term = this._normalizar(searchText);
    const filtered = this._filteredVisualizations.filter(v => {
      // 1. Campos básicos y descriptivos
      const inTitle = this._normalizar(v.title).includes(term);
      const inSummary = v.summary ? this._normalizar(v.summary).includes(term) : false;
      const inInfoUnit = this._normalizar(v.informationUnitName).includes(term);
      const inMeasure = this._normalizar(v.measureUnit).includes(term);
      const inPeriodicity = this._normalizar(v.periodicity).includes(term);
      const inTimeRange = this._normalizar(v.timeRange).includes(term);

      // 2. Temáticas asociadas (N:M)
      const inThematic = v.thematics.some(t => this._normalizar(t.name).includes(term));

      // 3. Dimensiones (array de strings)
      const inDimensions = v.dimensions.some(d => this._normalizar(d).includes(term));

      // 4. Ficha Técnica (técnico/metodológico)
      const ts = v.technicalSheet;
      const inTechSheet = (
        (ts.description && this._normalizar(ts.description).includes(term)) ||
        (ts.formula && this._normalizar(ts.formula).includes(term)) ||
        (ts.producerArea && this._normalizar(ts.producerArea).includes(term)) ||
        (ts.dataResponsible && this._normalizar(ts.dataResponsible).includes(term)) ||
        (ts.responsible && ts.responsible.some(r => this._normalizar(r).includes(term)))
      );

      // 5. Metadatos y etiquetas
      const inMetadata = v.metadata?.tags?.some(tag => this._normalizar(tag).includes(term)) || false;

      // 6. Bloques visuales (títulos de gráficos/tablas dentro)
      const inBlocks = v.visualBlocks?.some(block => block.title && this._normalizar(block.title).includes(term)) || false;

      return (
        inTitle || inSummary || inInfoUnit || inMeasure ||
        inPeriodicity || inTimeRange || inThematic || inDimensions ||
        inTechSheet || inMetadata || inBlocks
      );
    });
    return of(this._deepClone(filtered) as Visualization[]);
  }

  public getVisualizationsPage(page: number, pageSize: number): Observable<VisualizationPage> {
    return this._simulateDelay().pipe(
      concatMap(() => {
        const filtered = this._filteredVisualizations;
        const totalItems = filtered.length;
        const start = (page - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);
        const clonedItems = this._deepClone(pageItems) as Visualization[];
        return of({ items: clonedItems, totalItems, page, pageSize });
      })
    );
  }

  public createVisualization(visualization: Visualization): Observable<Visualization> {
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const newId = `${visualization.datasetId}-${uniqueId}`;
    const now = new Date().toISOString();

    // Obtener nombre de la unidad actual para asegurar visibilidad en el mock filtrado
    const unit = MOCK_INFORMATION_UNITS.find(u => u.id === this.selectedInformationUnit);
    const unitName = unit ? (unit.shortName || unit.name) : 'S/D';

    // Preparar el objeto con fecha y ID único
    const newVis: Visualization = {
      ...this._deepClone(visualization),
      id: newId,
      // Si no viene con unidad (o viene el default S/D de la factory), asignamos la actual
      informationUnitName: (visualization.informationUnitName === 'S/D' || !visualization.informationUnitName)
        ? unitName
        : visualization.informationUnitName,
      informationUnitId: visualization.informationUnitId || this.selectedInformationUnit,
      technicalSheet: {
        ...visualization.technicalSheet,
        lastUpdate: now
      },
      metadata: {
        ...visualization.metadata,
        updatedAt: now,
        createdAt: now
      }
    };

    MOCK_VISUALIZATIONS.unshift(newVis);
    return of(newVis);
  }

  public updateVisualization(id: number | string, visualization: Visualization): Observable<boolean> {
    const index = MOCK_VISUALIZATIONS.findIndex(v => v.id == id);
    if (index === -1) return of(false);

    // Mantenemos el ID original por seguridad y mezclamos el resto
    MOCK_VISUALIZATIONS[index] = {
      ...MOCK_VISUALIZATIONS[index],
      ...this._deepClone(visualization),
      id: MOCK_VISUALIZATIONS[index].id // Asegurar que el ID no cambie si venía mal en el objeto
    };

    return of(true);
  }

  public publishVisualizations(ids: (number | string)[]): Observable<boolean> {
    ids.forEach(id => {
      const index = MOCK_VISUALIZATIONS.findIndex(v => v.id == id);
      if (index !== -1) {
        MOCK_VISUALIZATIONS[index] = {
          ...MOCK_VISUALIZATIONS[index],
          published: true
        };
      }
    });
    return of(true);
  }

  public unpublishVisualizations(ids: (number | string)[]): Observable<boolean> {
    ids.forEach(id => {
      const index = MOCK_VISUALIZATIONS.findIndex(v => v.id == id);
      if (index !== -1) {
        MOCK_VISUALIZATIONS[index] = {
          ...MOCK_VISUALIZATIONS[index],
          published: false
        };
      }
    });
    return of(true);
  }

  public deleteVisualizations(ids: (number | string)[]): Observable<boolean> {
    ids.forEach(id => {
      const index = MOCK_VISUALIZATIONS.findIndex(v => v.id == id);
      if (index !== -1) MOCK_VISUALIZATIONS.splice(index, 1);
    });
    return of(true);
  }

  public getVisualizationsBookmarked(userId: number): Observable<Visualization[]> {
    const bookmarked = MOCK_VISUALIZATIONS.slice(0, 2);
    return of(this._deepClone(bookmarked) as Visualization[]);
  }

  public getSearchSuggestions(searchText: string): Observable<string[]> {
    const term = this._normalizar(searchText);
    if (term.length < 3) return of([]);

    return this.getVisualizationsByText(searchText).pipe(
      map(visualizations => {
        const suggestions = new Set<string>();
        visualizations.forEach(v => {
          // 1. Campos básicos
          if (this._normalizar(v.title).includes(term)) suggestions.add(v.title);
          if (v.summary && this._normalizar(v.summary).includes(term)) suggestions.add(v.summary);
          if (this._normalizar(v.informationUnitName).includes(term)) suggestions.add(v.informationUnitName);
          if (this._normalizar(v.measureUnit).includes(term)) suggestions.add(v.measureUnit);
          if (this._normalizar(v.periodicity).includes(term)) suggestions.add(v.periodicity);
          if (this._normalizar(v.timeRange).includes(term)) suggestions.add(v.timeRange);

          // 2. Temáticas
          v.thematics.forEach(t => {
            if (this._normalizar(t.name).includes(term)) suggestions.add(t.name);
          });

          // 3. Dimensiones
          v.dimensions.forEach(d => {
            if (this._normalizar(d).includes(term)) suggestions.add(d);
          });

          // 4. Ficha técnica
          const ts = v.technicalSheet;
          if (ts.description && this._normalizar(ts.description).includes(term)) suggestions.add(ts.description);
          if (ts.formula && this._normalizar(ts.formula).includes(term)) suggestions.add(ts.formula);
          if (ts.producerArea && this._normalizar(ts.producerArea).includes(term)) suggestions.add(ts.producerArea);
          if (ts.dataResponsible && this._normalizar(ts.dataResponsible).includes(term)) suggestions.add(ts.dataResponsible);
          ts.responsible?.forEach(r => {
            if (this._normalizar(r).includes(term)) suggestions.add(r);
          });

          // 5. Etiquetas
          v.metadata?.tags?.forEach(tag => {
            if (this._normalizar(tag).includes(term)) suggestions.add(tag);
          });

          // 6. Bloques
          v.visualBlocks?.forEach(block => {
            if (block.title && this._normalizar(block.title).includes(term)) suggestions.add(block.title);
          });
        });

        // Retornar los primeros 10 resultados únicos y ordenados
        return Array.from(suggestions)
          .sort((a, b) => a.localeCompare(b))
          .slice(0, 10);
      })
    );
  }

  public download(visualization: Visualization, options: DownloadOptions): void {
    this.notification.info('La descarga del reporte PDF no se encuentra implementada en la versión de pruebas.');
  }

  // Dataset methods
  public getDataset(datasetId: number | string): Observable<Dataset> {
    return this._simulateDelay().pipe(concatMap(() => {
      const ds = MOCK_DATASETS.find(d => d.id == datasetId);
      if (!ds) return throwError(() => new Error('Not found'));
      return of(new Dataset(ds as any));
    }));
  }

  public getDatasets(): Observable<DatasetInfo[]> {
    return this._simulateDelay().pipe(concatMap(() => {
      return of(MOCK_DATASETS.map((ds: MockDatasetRaw) => ({
        id: ds.id!,
        name: ds.name || `Dataset ${ds.id}`,
        description: ds.description,
        dimensions: ds.dimensions.map((d) => d.nameView),
        isPercentage: ds.isPercentage || false,
        allowsAddingData: ds.allowsAddingData !== undefined ? ds.allowsAddingData : true,
        unit: ds.unit,
        periodicity: ds.periodicity,
        temporal: ds.temporal,
        lastModified: ds.lastModified
      } as DatasetInfo)));
    }));
  }

  // User methods
  public getCurrentUser(): Observable<User> {
    return this._simulateDelay().pipe(
      concatMap(() => {
        if (this.currentUser) return of(this._deepClone(this.currentUser));
        return of({ ...CURRENT_MOCK_USER });
      })
    );
  }

  /**
   * Autentica a un usuario mediante credenciales estáticas.
   * Verifica tanto el nombre de usuario como la contraseña.
   */
  public login(username: string, password: string): Observable<User> {
    return this._simulateDelay().pipe(
      concatMap(() => {
        // 1. Validar credenciales
        const isValid = VALID_MOCK_CREDENTIALS.some(
          c => c.username === username && c.password === password
        );

        if (!isValid) {
          return throwError(() => new Error('Credenciales inválidas.'));
        }

        // 2. Buscar perfil de usuario
        const user = MOCK_USERS.find(u => u.username === username);

        if (!user) {
          return throwError(() => new Error('Usuario no encontrado en los perfiles.'));
        }

        this.currentUser = { ...user };
        this.authToken = 'mock-token-' + Math.random().toString(36).substring(7);
        return of(this._deepClone(this.currentUser));
      })
    );
  }

  public logout(): Observable<void> {
    return this._simulateDelay().pipe(
      concatMap(() => {
        this.currentUser = null;
        this.authToken = null;
        return of(void 0);
      })
    );
  }

  public isAuthenticated(): boolean {
    return true;
  }

  public getAuthToken(): string | null {
    return 'mock-token';
  }

  public setAuthToken(token: string): void { }

  public removeAuthToken(): void { }

  public recoveryPass(email: string): Observable<string> {
    return this._simulateDelay().pipe(concatMap(() => of('Se ha enviado un correo de recuperación')));
  }

  public verifyRecoveryToken(token: string): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => of(VALID_RECOVERY_TOKENS.includes(token))));
  }

  public changePassword(token: string, newPassword: string): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => of(true)));
  }

  public updatePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => of(true)));
  }

  public updateEmail(newEmail: string): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => {
      if (this.currentUser) this.currentUser.email = newEmail;
      return of(true);
    }));
  }

  public updateName(newName: string): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => {
      if (this.currentUser) this.currentUser.name = newName;
      return of(true);
    }));
  }

  public updateWorkArea(newArea: string): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => {
      if (this.currentUser) this.currentUser.workArea = newArea;
      return of(true);
    }));
  }

  public getInformationUnits(): Observable<InformationUnit[]> {
    return this._simulateDelay().pipe(concatMap(() => {
      return of(this._deepClone(MOCK_INFORMATION_UNITS));
    }));
  }

  public selectInformationUnit(unitId: number): Observable<boolean> {
    return this._simulateDelay().pipe(concatMap(() => {
      this.selectedInformationUnit = unitId;
      if (this.currentUser) this.currentUser.selectedIU = unitId;
      return of(true);
    }));
  }

  public clearCache(pattern?: string): void { }
  public clearDataCache(datasetId: number | string): void { }
  public initializeFromStoredData(userData: { token?: string; selectedIU?: number }): void {
    if (userData.token) {
      this.authToken = userData.token;
      // Restaurar el usuario desde el mock basándose en el token
      const foundUser = MOCK_USERS.find((u) => u.token === userData.token);
      if (foundUser) {
        this.currentUser = { ...foundUser };
      }
    }

    if (userData.selectedIU) {
      this.selectedInformationUnit = userData.selectedIU;
      if (this.currentUser) {
        this.currentUser.selectedIU = userData.selectedIU;
      }
    }
  }
}
