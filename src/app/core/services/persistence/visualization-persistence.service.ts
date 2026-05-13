import { Injectable, inject } from '@angular/core';
import { useAdminGuard } from '@core/guards/admin-action.guard';
import { Visualization } from '@models/domain/visualization.model';
import { Observable, tap } from 'rxjs';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { DataWriteService } from '../infrastructure/data-write.service';

/**
 * Servicio de persistencia para visualizaciones.
 * Responsable de las operaciones de escritura (muatciones) en la infraestructura de datos.
 */
@Injectable({
  providedIn: 'root',
})
export class VisualizationPersistenceService {
  private readonly dataWrite = inject(DataWriteService);
  private readonly eventBus = inject(AppEventBusService);
  private readonly adminGuard = useAdminGuard();

  /**
   * Crea una nueva visualización.
   * @param visualization Entidad a persistir.
   * @returns Observable con la visualización creada.
   */
  create(visualization: Visualization): Observable<Visualization> {
    return this.adminGuard(this.dataWrite.createVisualization(visualization)).pipe(
      tap((newVis) => this.eventBus.emit({
        type: AppEventType.VISUALIZATION_CREATED,
        payload: { id: newVis.id }
      }))
    );
  }

  /**
   * Actualiza una visualización existente.
   * @param id ID de la visualización.
   * @param visualization Datos actualizados.
   * @returns Observable que indica el éxito de la operación.
   */
  update(id: number | string, visualization: Visualization): Observable<boolean> {
    return this.adminGuard(this.dataWrite.updateVisualization(id, visualization)).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({
            type: AppEventType.VISUALIZATION_EDITED,
            payload: { id }
          });
        }
      })
    );
  }

  /**
   * Publica un conjunto de visualizaciones.
   * @param ids IDs de las visualizaciones a publicar.
   * @returns Observable que indica el éxito de la operación.
   */
  publish(ids: (number | string)[]): Observable<boolean> {
    return this.adminGuard(this.dataWrite.publishVisualizations(ids)).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.VISUALIZATION_PUBLISHED, payload: { ids } });
        }
      })
    );
  }

  /**
   * Despublica un conjunto de visualizaciones.
   * @param ids IDs de las visualizaciones a despublicar.
   * @returns Observable que indica el éxito de la operación.
   */
  unpublish(ids: (number | string)[]): Observable<boolean> {
    return this.adminGuard(this.dataWrite.unpublishVisualizations(ids)).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.VISUALIZATION_UNPUBLISHED, payload: { ids } });
        }
      })
    );
  }

  /**
   * Elimina un conjunto de visualizaciones.
   * @param ids IDs de las visualizaciones a eliminar.
   * @returns Observable que indica el éxito de la operación.
   */
  delete(ids: (number | string)[]): Observable<boolean> {
    return this.adminGuard(this.dataWrite.deleteVisualizations(ids)).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({ type: AppEventType.VISUALIZATION_DELETED, payload: { ids } });
        }
      })
    );
  }
}
