import { inject, Injectable, Type } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import type { VisualizationCreateModalComponent } from '@components/visualization-create-modal/visualization-create-modal.component';
import { SaveResult } from '@models/common/save-result.model';
import { Visualization } from '@models/domain/visualization.model';
import type { WelcomeModalComponent } from '@pages/home/components/welcome-modal/welcome-modal.component';
import type { VisualizationComponent } from '@pages/visualization/visualization.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { from, map, Observable, switchMap } from 'rxjs';

/**
 * @class AppDialogService
 * @description
 * Servicio centralizado para la gestión y orquestación de todos los diálogos (modales) 
 * de la aplicación. Actúa como un Dialog Manager que encapsula la configuración 
 * de Angular Material y abstrae la complejidad de apertura de componentes específicos.
 */
@Injectable({
  providedIn: 'root',
})
export class AppDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Abre un diálogo de confirmación genérico.
   * (Resuelve el requerimiento de la UT-42)
   * @param config Configuración del diálogo (título, mensaje, botones, colores).
   * @returns Observable que emite true si el usuario confirmó, false en caso contrario.
   */
  confirm(config: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: config,
        panelClass: 'confirm-dialog-panel'
      })
      .afterClosed()
      .pipe(map((result) => !!result));
  }

  /**
   * Abre el visor/editor de una visualización en pantalla completa.
   * (Resuelve el requerimiento de la UT-40)
   * @param visualization Objeto de la visualización a mostrar.
   * @returns Observable con el resultado del cierre (indicando si se guardaron cambios).
   */
  openVisualization(visualization: Visualization): Observable<SaveResult | undefined> {
    return from(import('@pages/visualization/visualization.component')).pipe(
      switchMap(({ VisualizationComponent }) => {
        return this.dialog
          .open<VisualizationComponent, { visualization: () => Visualization }, SaveResult>(VisualizationComponent, {
            data: { visualization: () => visualization },
            width: '100vw',
            maxWidth: '100vw',
            height: '100vh',
            maxHeight: '100vh',
            panelClass: 'full-screen-dialog',
          })
          .afterClosed();
      })
    );
  }

  /**
   * Abre el wizard de creación de visualizaciones.
   * @returns Observable que emite true si la visualización fue creada con éxito.
   */
  openVisualizationCreate(): Observable<boolean> {
    return from(import('@components/visualization-create-modal/visualization-create-modal.component')).pipe(
      switchMap(({ VisualizationCreateModalComponent }) => {
        return this.dialog
          .open<VisualizationCreateModalComponent, undefined, boolean>(VisualizationCreateModalComponent, {
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            panelClass: 'full-screen-modal',
          })
          .afterClosed()
          .pipe(map((result) => !!result));
      })
    );
  }

  /**
   * Abre el modal de bienvenida para el primer ingreso.
   */
  openWelcome(): Observable<void> {
    return from(import('@pages/home/components/welcome-modal/welcome-modal.component')).pipe(
      switchMap(({ WelcomeModalComponent }) => {
        return this.dialog
          .open<WelcomeModalComponent>(WelcomeModalComponent, {
            maxWidth: '95vw',
            panelClass: 'welcome-modal-panel',
            disableClose: true, // Forzamos cierre por botón
          })
          .afterClosed();
      })
    );
  }

  /**
   * Método genérico para casos no contemplados por métodos específicos de dominio.
   * Permite mantener la centralización incluso para modales puntuales.
   */
  openCustom<T, D = unknown, R = unknown>(component: Type<T>, config: MatDialogConfig<D>): MatDialogRef<T, R> {
    return this.dialog.open<T, D, R>(component, config);
  }
}
