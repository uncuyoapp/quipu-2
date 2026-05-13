import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppDialogService } from '@services';
import { ThematicDialogComponent } from './components/thematic-dialog/thematic-dialog.component';
import { ThematicPersistenceService } from '@services';
import { Thematic } from '@models/domain/thematic.model';
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
      error: (err) => console.error('Error al crear la temática:', err)
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
      error: (err) => console.error('Error al actualizar la temática:', err)
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
      error: (err) => console.error('Error al eliminar la temática:', err)
    });
  }

  /**
   * Actualiza el orden de las temáticas raíz.
   * @param reorderedList El nuevo listado ordenado.
   */
  onReorderThematics(reorderedList: Thematic[]): void {
    const ids = reorderedList.map(t => t.id);
    this.persistence.reorder(ids).subscribe({
      error: (err) => console.error('Error al reordenar las temáticas:', err)
    });
  }
}
