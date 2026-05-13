import { CdkDragDrop, CdkDragSortEvent, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Thematic } from '@models/domain/thematic.model';
import { EditModeService, ThematicStateService } from '@services';
import { ThematicCardComponent } from '@components/thematic-card/thematic-card.component';

/**
 * Componente responsable de renderizar una grilla responsiva de tarjetas temáticas.
 */
@Component({
  selector: 'app-thematic-grid',
  standalone: true,
  imports: [ThematicCardComponent, DragDropModule],
  templateUrl: './thematic-grid.component.html',
  styleUrl: './thematic-grid.component.scss',
})
export class ThematicGridComponent {
  /** La lista de temáticas a mostrar dentro de la grilla. */
  thematics = input<Thematic[]>();

  /** Indica si las tarjetas dentro de la grilla permiten edición. */
  editable = input<boolean>(false);

  /** Eventos al realizar acciones CRUD en la grilla. */
  editThematic = output<Thematic>();
  deleteThematic = output<number>();
  reorderThematics = output<Thematic[]>();

  public readonly editModeService = inject(EditModeService);
  private readonly router = inject(Router);
  private readonly thematicState = inject(ThematicStateService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Index actual de la tarjeta siendo arrastrada para sincronizar su color */
  private readonly dragIndex = signal<number>(-1);

  /** 
   * Genera el CSS dinámico para asignar colores según la posición en la grilla.
   * Utiliza :nth-child para que el color sea reactivo a la posición real del DOM.
   */
  readonly gridStyles = computed<SafeHtml>(() => {
    const palette = this.thematicState.palette();
    const len = palette.length;
    let css = '';

    palette.forEach((color, i) => {
      // Regla para las tarjetas en la grilla y el placeholder
      css += `.thematic-grid-container .col-12:nth-child(${len}n + ${i + 1}) { --thematic-card-color: ${color} !important; }\n`;
    });

    // Si se está arrastrando, aplicamos el color correspondiente al preview (tarjeta flotante)
    const currentDragIdx = this.dragIndex();
    if (currentDragIdx !== -1) {
      const dragColor = palette[currentDragIdx % len];
      css += `.cdk-drag-preview { --thematic-card-color: ${dragColor} !important; }\n`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(`<style>${css}</style>`);
  });

  /**
   * Maneja la selección de una tarjeta temática.
   * Navega a la página de detalles de la temática específica y desplaza hacia arriba.
   * 
   * @param id El ID de la temática seleccionada.
   */
  onSelectThematic(id: number) {
    this.router.navigate(['/thematic', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEditThematic(thematic: Thematic) {
    this.editThematic.emit(thematic);
  }

  onDeleteThematic(id: number) {
    this.deleteThematic.emit(id);
  }

  onDrop(event: CdkDragDrop<Thematic[]>) {
    this.dragIndex.set(-1); // Resetear index al soltar
    const defaultThematics = this.thematics();
    if (!defaultThematics) return;

    // Crear una copia de los datos
    const list = [...defaultThematics];
    moveItemInArray(list, event.previousIndex, event.currentIndex);

    // Emitir la nueva lista reordenada
    this.reorderThematics.emit(list);
  }

  onDragStarted(index: number) {
    this.dragIndex.set(index);
  }

  onDragSorted(event: CdkDragSortEvent<Thematic[]>) {
    this.dragIndex.set(event.currentIndex);
  }
}
