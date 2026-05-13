import { Injectable, inject } from '@angular/core';
import { Thematic } from '@models/domain/thematic.model';
import { User } from '@models/domain/user.model';
import { Visualization } from '@models/domain/visualization.model';
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
  createThematic(thematic: Partial<Thematic>): Observable<Thematic> {
    return this.dataProvider.createThematic(thematic);
  }

  updateThematic(id: number, thematic: Partial<Thematic>): Observable<Thematic> {
    return this.dataProvider.updateThematic(id, thematic);
  }

  deleteThematic(id: number): Observable<boolean> {
    return this.dataProvider.deleteThematic(id);
  }

  reorderThematics(thematicIds: number[]): Observable<boolean> {
    return this.dataProvider.reorderThematics(thematicIds);
  }

  // --- Visualizaciones ---
  createVisualization(visualization: Visualization): Observable<Visualization> {
    return this.dataProvider.createVisualization(visualization);
  }

  updateVisualization(id: number | string, visualization: Visualization): Observable<boolean> {
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

  // --- Usuario y Sesión ---
  login(username: string, password: string): Observable<User> {
    return this.dataProvider.login(username, password);
  }

  logout(): Observable<void> {
    return this.dataProvider.logout();
  }

  recoveryPass(email: string): Observable<string> {
    return this.dataProvider.recoveryPass(email);
  }

  changePassword(token: string, newPassword: string): Observable<boolean> {
    return this.dataProvider.changePassword(token, newPassword);
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    return this.dataProvider.updatePassword(oldPassword, newPassword);
  }

  updateEmail(newEmail: string): Observable<boolean> {
    return this.dataProvider.updateEmail(newEmail);
  }

  updateName(newName: string): Observable<boolean> {
    return this.dataProvider.updateName(newName);
  }

  updateWorkArea(newArea: string): Observable<boolean> {
    return this.dataProvider.updateWorkArea(newArea);
  }

  selectInformationUnit(unitId: number): Observable<boolean> {
    return this.dataProvider.selectInformationUnit(unitId);
  }

  setAuthToken(token: string): void {
    this.dataProvider.setAuthToken(token);
  }

  removeAuthToken(): void {
    this.dataProvider.removeAuthToken();
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
