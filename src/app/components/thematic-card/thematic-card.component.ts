import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, inject, input, output } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { getThematicIllustrationPath, SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { Thematic } from '@models/domain/thematic.model';
import { NgIconComponent } from '@ng-icons/core';
import { EditModeService } from '@services';

/**
 * Componente responsable de mostrar una tarjeta que resume una categoría temática.
 * Emite un evento con el ID de la temática al hacer clic.
 */
@Component({
  selector: 'app-thematic-card',
  standalone: true,
  imports: [NgIconComponent, DragDropModule],
  templateUrl: './thematic-card.component.html',
  styleUrl: './thematic-card.component.scss',
})
export class ThematicCardComponent {
  public readonly editModeService = inject(EditModeService);

  protected readonly icons = APP_ICONS;

  /** Evento emitido cuando se hace clic en la tarjeta, devolviendo el ID de la temática. */
  clickCard = output<number>();

  /** Evento emitido para editar la temática. */
  editCard = output<Thematic>();

  /** Evento emitido para eliminar la temática. */
  deleteCard = output<number>();

  /** Los datos temáticos a mostrar en la tarjeta. */
  thematic = input.required<Thematic>();

  /** Indica si la tarjeta permite acciones de edición (solo botones visibles). */
  editable = input<boolean>(false);

  /**
   * Maneja el evento de clic en la tarjeta y emite el ID de la temática.
   */
  onClick() {
    this.clickCard.emit(this.thematic().id);
  }

  onEdit(event: Event) {
    event.stopPropagation();
    this.editCard.emit(this.thematic());
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.deleteCard.emit(this.thematic().id);
  }

  getBackgroundImage(): string {
    const fileName = this.thematic().illustration?.split('/').pop();
    const url = fileName ? getThematicIllustrationPath(fileName) : SECTION_GRAPHICS.thematic.fallback;
    return `url(${url})`;
  }
}
