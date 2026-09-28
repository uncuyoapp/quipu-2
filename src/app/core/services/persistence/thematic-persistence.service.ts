import { Injectable, inject } from '@angular/core';
import { ThematicFactory } from '@core/factories/thematic.factory';
import { useAdminGuard } from '@core/guards/admin-action.guard';
import { Thematic } from '@models/domain/thematic.model';
import { SaveThematicDto } from '@models/dto';
import { Observable, tap } from 'rxjs';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { DataWriteService } from '../infrastructure/data-write.service';
import { ThematicStateService } from '../state/thematic-state.service';

/**
 * Servicio de persistencia para temáticas.
 * Responsable de las operaciones de escritura (muatciones) y de coordinar
 * la sincronización del estado reactivo global.
 */
@Injectable({
  providedIn: 'root',
})
export class ThematicPersistenceService {
  private readonly dataWrite = inject(DataWriteService);
  private readonly thematicState = inject(ThematicStateService);
  private readonly eventBus = inject(AppEventBusService);
  private readonly adminGuard = useAdminGuard();

  /**
   * Crea una nueva temática a partir de su DTO de mutación y sincroniza el estado local.
   * @param thematic DTO de la temática.
   * @returns Un observable con la temática creada.
   */
  create(thematic: SaveThematicDto): Observable<Thematic> {
    return this.adminGuard(this.dataWrite.createThematic(thematic).pipe(
      tap((newThematic) => {
        this.thematicState._patchTree((tree) => {
          if (newThematic.parentId) {
            return ThematicFactory.addNode(tree, newThematic.parentId, newThematic);
          } else {
            return [...tree, newThematic];
          }
        });

        const level = this._getThematicLevel(newThematic.parentId);
        const eventType = level === 'root'
          ? AppEventType.THEMATIC_ROOT_CREATED
          : level === 'category'
            ? AppEventType.THEMATIC_CATEGORY_CREATED
            : AppEventType.THEMATIC_SUBCATEGORY_CREATED;

        this.eventBus.emit({
          type: eventType,
          payload: { id: newThematic.id, name: newThematic.name }
        });

      })
    ));
  }

  /**
   * Actualiza una temática existente a partir de su DTO de mutación y sincroniza el estado local.
   * @param id ID de la temática.
   * @param data DTO con cambios a aplicar.
   * @returns Un observable con la temática actualizada.
   */
  update(id: number, data: SaveThematicDto): Observable<Thematic> {
    return this.adminGuard(this.dataWrite.updateThematic(id, data).pipe(
      tap((updated) => {
        const thematicBeforeUpdate = ThematicFactory.findRecursively(this.thematicState.thematics(), id);

        this.thematicState._patchTree((tree) =>
          ThematicFactory.updateNode(tree, id, updated)
        );

        const level = this._getThematicLevel(thematicBeforeUpdate?.parentId);
        const eventType = level === 'root'
          ? AppEventType.THEMATIC_ROOT_EDITED
          : level === 'category'
            ? AppEventType.THEMATIC_CATEGORY_EDITED
            : AppEventType.THEMATIC_SUBCATEGORY_EDITED;

        this.eventBus.emit({
          type: eventType,
          payload: { id }
        });

      })
    ));
  }

  /**
   * Elimina una temática y sincroniza el estado local.
   * @param id ID de la temática a borrar.
   * @returns Un observable que indica el éxito de la operación.
   */
  delete(id: number): Observable<boolean> {
    return this.adminGuard(this.dataWrite.deleteThematic(id).pipe(
      tap((success) => {
        if (success) {
          const thematicToDelete = ThematicFactory.findRecursively(this.thematicState.thematics(), id);
          const level = this._getThematicLevel(thematicToDelete?.parentId);

          this.thematicState._patchTree((tree) =>
            ThematicFactory.removeNode(tree, id)
          );

          const eventType = level === 'root'
            ? AppEventType.THEMATIC_ROOT_DELETED
            : level === 'category'
              ? AppEventType.THEMATIC_CATEGORY_DELETED
              : AppEventType.THEMATIC_SUBCATEGORY_DELETED;

          this.eventBus.emit({
            type: eventType,
            payload: { id }
          });
        }
      })
    ));
  }

  /**
   * Reordena temáticas y aplica actualización optimista en el estado local.
   * @param thematicIds IDs en el nuevo orden.
   * @param parentId ID del padre (opcional).
   * @returns Un observable que indica el éxito de la operación.
   */
  reorder(thematicIds: number[], parentId?: number): Observable<boolean> {
    // Actualización optimista
    this.thematicState._patchTree((tree) =>
      ThematicFactory.reorderNodes(tree, thematicIds, parentId)
    );


    return this.adminGuard(this.dataWrite.reorderThematics(thematicIds).pipe(
      tap((success) => {
        if (success) {
          const level = this._getThematicLevel(parentId);
          const eventType = level === 'root'
            ? AppEventType.THEMATIC_ROOT_REORDERED
            : level === 'category'
              ? AppEventType.THEMATIC_CATEGORY_REORDERED
              : AppEventType.THEMATIC_SUBCATEGORY_REORDERED;

          this.eventBus.emit({
            type: eventType,
            payload: { thematicIds, parentId }
          });
        } else {
          console.error('API Reorder failed, state might be out of sync');
        }
      })
    ));
  }

  /**
   * Asocia visualizaciones a una temática específica y emite el evento global.
   * @param thematicId ID de la temática.
   * @param visualizationIds Lista de IDs de visualizaciones.
   * @returns Un observable que indica el éxito de la operación.
   */
  assignVisualizations(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean> {
    return this.adminGuard(this.dataWrite.assignVisualizationsToThematic(thematicId, visualizationIds).pipe(
      tap((success) => {
        if (success) {
          this.eventBus.emit({
            type: AppEventType.THEMATIC_ASSOCIATION_SAVED,
            payload: { thematicId, visualizationsCount: visualizationIds.length }
          });
        }
      })
    ));
  }

  /**
   * Determina el nivel jerárquico basándose en el parentId.
   * @param parentId ID del padre.
   * @returns 'root', 'category' o 'subcategory'.
   */
  private _getThematicLevel(parentId?: number | null): 'root' | 'category' | 'subcategory' {
    if (!parentId) return 'root';

    const parent = ThematicFactory.findRecursively(this.thematicState.thematics(), parentId);
    if (!parent) return 'category'; // Asumimos categoría si no encontramos al padre (es raíz)

    // Si el padre tiene padre, entonces el nodo actual es subcategoría
    return parent.parentId ? 'subcategory' : 'category';
  }
}
