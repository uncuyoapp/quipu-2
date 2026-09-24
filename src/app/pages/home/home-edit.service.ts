import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppDialogService, AppNotificationService, ThematicPersistenceService } from '@services';
import { ThematicDialogComponent } from './components/thematic-dialog/thematic-dialog.component';
import { Thematic } from '@models/domain/thematic.model';
import { extractHttpErrorMessage } from '@core/utils/http-error.utils';
import { filter, switchMap } from 'rxjs';

/**
 * @class HomeEditService
 * @description
 * Servicio encargado de gestionar las acciones de edición y administración de temáticas
 * en la página de inicio. Centraliza la apertura de diálogos y la comunicación con el
 * servicio de datos.
 */
@Injectable()
export class HomeEditService {
  private readonly persistence = inject(ThematicPersistenceService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogs = inject(AppDialogService);
  private readonly notification = inject(AppNotificationService);

  /**
   * Abre el diálogo para crear una nueva temática raíz.
   */
  openCreateThematicDialog(): void {
    this.dialog.open(ThematicDialogComponent, {
      width: '600px',
      data: {}
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(result => this.persistence.create(result))
    ).subscribe({
      next: () => {
        this.notification.success('Temática creada exitosamente');
      },
      error: (err) => {
        console.error('Error al crear la temática:', err);
        this.notification.error(extractHttpErrorMessage(err, 'Error al crear la temática.'));
      }
    });
  }

  /**
   * Abre el diálogo para editar una temática existente.
   * @param thematic La temática a editar.
   */
  onEditThematic(thematic: Thematic): void {
    this.dialog.open(ThematicDialogComponent, {
      width: '600px',
      data: { thematic }
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(result => this.persistence.update(thematic.id, result))
    ).subscribe({
      next: () => {
        this.notification.success('Temática actualizada exitosamente');
      },
      error: (err) => {
        console.error('Error al actualizar la temática:', err);
        this.notification.error(extractHttpErrorMessage(err, 'Error al actualizar la temática.'));
      }
    });
  }

  /**
   * Elimina una temática raíz tras confirmación.
   * @param id ID de la temática.
   */
  onDeleteThematic(id: number): void {
    this.dialogs.confirm({
      title: 'Eliminar Temática',
      message: '¿Estás seguro de que deseas eliminar esta temática? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    }).pipe(
      filter(Boolean),
      switchMap(() => this.persistence.delete(id))
    ).subscribe({
      next: () => {
        this.notification.success('Temática eliminada exitosamente');
      },
      error: (err) => {
        console.error('Error al eliminar la temática:', err);
        this.notification.error(extractHttpErrorMessage(err, 'Error al eliminar la temática.'));
      }
    });
  }

  /**
   * Actualiza el orden de las temáticas raíz.
   * @param reorderedList El nuevo listado ordenado.
   */
  onReorderThematics(reorderedList: Thematic[]): void {
    const ids = reorderedList.map(t => t.id);
    this.persistence.reorder(ids).subscribe({
      next: () => {
        this.notification.success('Orden de temáticas actualizado');
      },
      error: (err) => {
        console.error('Error al reordenar las temáticas:', err);
        this.notification.error(extractHttpErrorMessage(err, 'Error al reordenar las temáticas.'));
      }
    });
  }
}
