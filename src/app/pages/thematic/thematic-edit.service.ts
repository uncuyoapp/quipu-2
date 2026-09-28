import { inject, Injectable, signal } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ThematicFactory } from '@core/factories/thematic.factory';
import { Thematic } from '@models/domain/thematic.model';
import { SaveThematicDto } from '@models/dto';
import { Visualization } from '@models/domain/visualization.model';
import { AppDialogService, AppNotificationService, ThematicPersistenceService, ThematicStateService, VisualizationStateService } from '@services';
import { extractHttpErrorMessage } from '@core/utils/http-error.utils';
import { Observable, filter, switchMap, tap, map, of, catchError, throwError } from 'rxjs';
import { EditVisualizationsModalComponent, EditVisualizationsModalData } from './components/edit-visualizations-modal/edit-visualizations-modal.component';

/**
 * @class ThematicEditService
 * @description
 * Servicio especializado en gestionar las acciones de edición de la página de temáticas.
 * Centraliza la lógica de CRUD de categorías/subcategorías, reordenamiento, 
 * gestión de borradores y diálogos de confirmación.
 */
@Injectable()
export class ThematicEditService {
  private readonly thematicState = inject(ThematicStateService);
  private readonly persistence = inject(ThematicPersistenceService);
  private readonly visualizationState = inject(VisualizationStateService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogs = inject(AppDialogService);
  private readonly notification = inject(AppNotificationService);

  /** Estado temporal de una temática en creación (borrador) */
  public readonly draft = signal<{ name: string; isCategory: boolean } | undefined>(undefined);

  /**
   * Abre el modal para editar las visualizaciones asociadas a la temática actual.
   * @param thematic Temática actual.
   * @param associatedVisualizations Visualizaciones actualmente asociadas.
   */
  openEditVisualizationsModal(thematic: Thematic, associatedVisualizations: Visualization[]): Observable<number[] | undefined> {
    const dialogRef = this.dialog.open(EditVisualizationsModalComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        thematic,
        associatedVisualizations
      } as EditVisualizationsModalData,
      panelClass: 'full-screen-modal-panel'
    });

    return dialogRef.afterClosed();
  }

  /**
   * Orquestación completa para asociar visualizaciones a una temática.
   * Obtiene las actuales, abre el modal y persiste los cambios.
   * @param thematic Temática a la que asociar visualizaciones.
   */
  asociarVisualizaciones(thematic: Thematic): Observable<void> {
    // 1. Obtener visualizaciones asociadas (no recursivo para edición)
    return this.visualizationState.getVisualizationsByThematic(thematic.id, false).pipe(
      // 2. Abrir el modal con los datos actuales
      switchMap(associated => this.openEditVisualizationsModal(thematic, associated)),
      // 3. Si hay cambios seleccionados, persistirlos
      switchMap(selectedIds => {
        if (!selectedIds) return of(undefined);
        return this.persistence.assignVisualizations(thematic.id, selectedIds).pipe(
          tap(() => this.notification.success('Visualizaciones asociadas con éxito')),
          catchError(err => {
            this.notification.error(extractHttpErrorMessage(err, 'Error al asociar las visualizaciones.'));
            return throwError(() => err);
          }),
          map(() => void 0)
        );
      }),
      // Aseguramos que el flujo complete como void
      map(() => void 0)
    );
  }

  /**
   * Reordena un listado de temáticas.
   */
  reorder(thematicIds: number[], parentId?: number): Observable<boolean> {
    return this.persistence.reorder(thematicIds, parentId).pipe(
      tap(success => {
        if (success) {
          this.notification.success('Orden de temáticas actualizado');
        }
      }),
      catchError(err => {
        this.notification.error(extractHttpErrorMessage(err, 'Error al reordenar las temáticas.'));
        return throwError(() => err);
      })
    );
  }

  /**
   * Prepara la creación de una nueva temática en estado de borrador.
   */
  addDraft(isCategory: boolean): void {
    if (this.draft()) return;
    this.draft.set({ name: '', isCategory });
  }

  /**
   * Finaliza la creación de un borrador persistiendo en la API.
   */
  saveDraft(name: string, color: string, parentId?: number, order?: number): Observable<Thematic> | null {
    const currentDraft = this.draft();
    if (!currentDraft) return null;

    const trimmedName = name.trim();
    if (!trimmedName) {
      this.cancelDraft();
      return null;
    }

    const payload = ThematicFactory.toSaveDto({
      name: trimmedName,
      color,
      parentId,
      order
    });

    return this.persistence.create(payload).pipe(
      tap(() => {
        this.cancelDraft();
        this.notification.success('Temática creada exitosamente');
      }),
      catchError(err => {
        this.notification.error(extractHttpErrorMessage(err, 'Error al crear la temática.'));
        return throwError(() => err);
      })
    );
  }

  /**
   * Reordena categorías y persiste el cambio.
   */
  reorderCategories(categories: Thematic[], prev: number, curr: number, parentId?: number): void {
    const reordered = [...categories];
    moveItemInArray(reordered, prev, curr);
    this.reorder(reordered.map(c => c.id), parentId).subscribe();
  }

  /**
   * Reordena subcategorías y persiste el cambio.
   */
  reorderSubcategories(parent: Thematic, prev: number, curr: number): void {
    if (!parent.childrens) return;
    const reordered = [...parent.childrens];
    moveItemInArray(reordered, prev, curr);
    this.reorder(reordered.map(s => s.id), parent.id).subscribe();
  }

  /**
   * Finaliza la creación de un borrador persistiendo en la API.
   * Orquestación de parentId y orden delegada al servicio.
   */
  persistDraft(name: string, color: string, rootParentId: number | undefined, categoriesCount: number, selectedCategory?: Thematic): void {
    const draft = this.draft();
    if (!draft) return;

    let parentId: number | undefined;
    let order: number;

    if (draft.isCategory) {
      parentId = rootParentId;
      order = categoriesCount;
    } else {
      if (!selectedCategory) return;
      parentId = selectedCategory.id;
      order = selectedCategory.childrens?.length ?? 0;
    }

    const obs = this.saveDraft(name, color, parentId, order);
    if (obs) obs.subscribe();
  }

  /**
   * Cancela el borrador actual.
   */
  cancelDraft(): void {
    this.draft.set(undefined);
  }

  /**
   * Actualiza el nombre de una temática con validación previa.
   */
  updateName(id: number, newName: string): Observable<Thematic> | null {
    const trimmedName = newName.trim();
    if (!trimmedName) return null;
    return this.persistence.update(id, ThematicFactory.toSaveDto({ name: trimmedName })).pipe(
      tap(() => this.notification.success('Nombre actualizado exitosamente')),
      catchError(err => {
        this.notification.error(extractHttpErrorMessage(err, 'Error al actualizar el nombre.'));
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualiza una temática.
   */
  update(id: number, data: SaveThematicDto | Partial<Thematic>): Observable<Thematic> {
    return this.persistence.update(id, ThematicFactory.toSaveDto(data));
  }

  /**
   * Elimina una temática tras confirmación.
   */
  delete(id: number, name: string): Observable<boolean> {
    return this.confirmDelete(name).pipe(
      switchMap(confirmed => confirmed
        ? this.persistence.delete(id).pipe(
            tap(success => {
              if (success) {
                this.notification.success('Temática eliminada exitosamente');
              }
            }),
            catchError(err => {
              this.notification.error(extractHttpErrorMessage(err, 'Error al eliminar la temática.'));
              return throwError(() => err);
            })
          )
        : of(false)
      )
    );
  }

  /**
   * Gestiona el flujo cuando se intenta guardar un nombre vacío.
   */
  handleEmptyName(isCategory: boolean): Observable<boolean> {
    return this.dialogs.confirm({
      title: 'Nombre requerido',
      message: `El nombre de la ${isCategory ? 'categoría' : 'subcategoría'} no puede estar vacío.`,
      confirmText: 'Continuar editando',
      cancelText: 'Restaurar',
      confirmPalette: 'blue'
    });
  }

  /**
   * Abre un diálogo de confirmación genérico para eliminación.
   * @private
   */
  private confirmDelete(name: string): Observable<boolean> {
    return this.dialogs.confirm({
      title: 'Eliminar temática',
      message: `¿Estás seguro de que deseas eliminar "${name}"?\nEsta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      confirmPalette: 'pink'
    });
  }
}
