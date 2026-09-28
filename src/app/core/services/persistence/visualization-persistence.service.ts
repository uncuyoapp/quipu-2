import { Injectable, inject } from '@angular/core';
import { useAdminGuard } from '@core/guards/admin-action.guard';
import { Visualization } from '@models/domain/visualization.model';
import { SaveVisualizationDto } from '@models/dto';
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
   * Crea una nueva visualización a partir de su DTO de mutación.
   * @param dto DTO estricto a persistir.
   * @returns Observable con la visualización creada.
   */
  create(dto: SaveVisualizationDto): Observable<Visualization> {
    return this.adminGuard(this.dataWrite.createVisualization(dto)).pipe(
      tap((newVis) => this.eventBus.emit({
        type: AppEventType.VISUALIZATION_CREATED,
        payload: { id: newVis.id }
      }))
    );
  }

  /**
   * Actualiza una visualización existente a partir de su DTO de mutación.
   * @param id ID de la visualización.
   * @param dto DTO con datos actualizados.
   * @returns Observable que indica el éxito de la operación.
   */
  update(id: number | string, dto: SaveVisualizationDto): Observable<boolean> {
    return this.adminGuard(this.dataWrite.updateVisualization(id, dto)).pipe(
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
