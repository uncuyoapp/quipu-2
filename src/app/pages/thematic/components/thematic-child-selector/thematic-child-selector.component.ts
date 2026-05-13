import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, input, output, signal, viewChildren } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { APP_ICONS } from '@core/config/icons.config';
import { Thematic } from '@models/domain/thematic.model';
import { EditModeService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TagComponent } from '@shared/components/tag/tag.component';

import { ThematicEditService } from '../../thematic-edit.service';

/**
 * Componente para la selección y gestión de temáticas hijas (categorías y subcategorías).
 * Permite la navegación, reordenamiento (drag & drop), edición y eliminación de temáticas.
 */
@Component({
  selector: 'app-thematic-child-selector',
  standalone: true,
  imports: [TagComponent, DragDropModule, ButtonComponent, MatDialogModule],
  templateUrl: './thematic-child-selector.component.html',
  styleUrl: './thematic-child-selector.component.scss',
})
export class ThematicChildSelectorComponent {
  /** Listado de categorías a mostrar (hijos directos del rootThematicId) */
  categories = input.required<Thematic[]>();
  /** ID de la temática raíz que contiene estas categorías */
  parentId = input<number>();
  /** Color temático base para los elementos visuales */
  thematicColor = input.required<string>();
  /** Emite la temática seleccionada (categoría o subcategoría) */
  thematicSelected = output<Thematic | undefined>();

  /** Servicio para gestionar el estado del modo edición */
  public readonly editModeService = inject(EditModeService);
  /** Servicio delegado para acciones de edición en la página de temáticas */
  public readonly editService = inject(ThematicEditService);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Referencias a los componentes Tag de categorías en el DOM */
  private readonly categoryTags = viewChildren<TagComponent>('categoryTag');
  /** Referencias a los componentes Tag de subcategorías en el DOM */
  private readonly subcategoryTags = viewChildren<TagComponent>('subcategoryTag');

  /** Flag para disparar el foco automático en el efecto reactivo */
  private pendingFocus = false;

  /** ID de la temática de nivel categoría seleccionada actualmente */
  private readonly selectedCategoryId = signal<number | undefined>(undefined);
  /** ID de la temática de nivel subcategoría seleccionada actualmente */
  private readonly selectedSubcategoryId = signal<number | undefined>(undefined);

  /** Temática de nivel categoría seleccionada actualmente (computada) */
  readonly selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    return id ? this.categories().find(c => c.id === id) : undefined;
  });

  /** Temática de nivel subcategoría seleccionada actualmente (computada) */
  readonly selectedSubcategory = computed(() => {
    const id = this.selectedSubcategoryId();
    const category = this.selectedCategory();
    return id && category ? category.childrens?.find(s => s.id === id) : undefined;
  });

  constructor() {
    /**
     * Efecto reactivo para gestionar el foco automático cuando se añade un nuevo elemento.
     */
    effect(() => {
      const categories = this.categoryTags();
      const subcategories = this.subcategoryTags();

      if (this.pendingFocus) {
        this.pendingFocus = false;

        // Timeout para asegurar que el DOM esté renderizado y contenteditable activo
        setTimeout(() => {
          // Buscamos primero si hay un draft activo
          const draft = this.editService.draft();
          if (draft) {
            const list = draft.isCategory ? this.categoryTags() : this.subcategoryTags();
            if (list.length > 0) {
              list[list.length - 1].focusLabel();
            }
            return;
          }

          // Si no hay draft, foco al último elemento normal (fallback)
          const list = this.selectedCategory() ? this.subcategoryTags() : this.categoryTags();
          if (list.length > 0) {
            list[list.length - 1].focusLabel();
          }
        }, 50);
      }
    });
  }

  /**
   * Selecciona una categoría y limpia la subcategoría previa.
   */
  selectCategory(category: Thematic): void {
    this.selectedCategoryId.set(category.id);
    this.selectedSubcategoryId.set(undefined);
    this.thematicSelected.emit(category);
  }

  /**
   * Selecciona o deselecciona una subcategoría.
   */
  selectSubcategory(subcategory: Thematic): void {
    const isAlreadySelected = this.selectedSubcategoryId() === subcategory.id;
    const selectedId = isAlreadySelected ? undefined : subcategory.id;
    this.selectedSubcategoryId.set(selectedId);
    this.thematicSelected.emit(selectedId ? subcategory : this.selectedCategory());
  }

  /**
   * Limpia toda la selección actual.
   */
  clearSelection(): void {
    this.selectedCategoryId.set(undefined);
    this.selectedSubcategoryId.set(undefined);
    this.thematicSelected.emit(undefined);
  }

  /**
   * Determina si una temática está seleccionada.
   */
  isSelected(category: Thematic): boolean {
    return this.selectedCategoryId() === category.id || this.selectedSubcategoryId() === category.id;
  }

  /**
   * Gestiona el reordenamiento de categorías mediante Drag & Drop.
   */
  dropCategories(event: CdkDragDrop<Thematic[]>): void {
    this.editService.reorderCategories(this.categories(), event.previousIndex, event.currentIndex, this.parentId());
  }

  /**
   * Gestiona el reordenamiento de subcategorías en la categoría seleccionada.
   */
  dropSubcategories(event: CdkDragDrop<Thematic[]>): void {
    const currentCategory = this.selectedCategory();
    if (!currentCategory) return;
    this.editService.reorderSubcategories(currentCategory, event.previousIndex, event.currentIndex);
  }

  /**
   * Prepara la creación de una nueva categoría en estado de borrador.
   */
  addCategory(): void {
    this.editService.addDraft(true);
    this.pendingFocus = true;
  }

  /**
   * Elimina una categoría tras confirmación del usuario.
   */
  deleteCategory(category: Thematic): void {
    this.editService.delete(category.id, category.name).subscribe(confirmed => {
      if (confirmed && this.selectedCategoryId() === category.id) {
        this.clearSelection();
      }
    });
  }

  /**
   * Actualiza el nombre de una categoría.
   */
  updateCategoryName(category: Thematic, newName: string, index: number): void {
    const obs = this.editService.updateName(category.id, newName);
    if (!obs) {
      this.handleEmptyName(category, true, index);
      return;
    }
    obs.subscribe();
  }

  /**
   * Actualiza el nombre de una subcategoría.
   */
  updateSubcategoryName(subcategory: Thematic, newName: string, index: number): void {
    const obs = this.editService.updateName(subcategory.id, newName);
    if (!obs) {
      this.handleEmptyName(subcategory, false, index);
      return;
    }
    obs.subscribe();
  }

  /**
   * Prepara la creación de una nueva subcategoría en estado de borrador.
   */
  addSubcategory(): void {
    const currentCategory = this.selectedCategory();
    if (!currentCategory) return;

    this.editService.addDraft(false);
    this.pendingFocus = true;
  }

  /**
   * Elimina una subcategoría tras confirmación del usuario.
   */
  deleteSubcategory(subcategory: Thematic): void {
    const currentCategory = this.selectedCategory();
    if (!currentCategory) return;
    this.editService.delete(subcategory.id, subcategory.name).subscribe(confirmed => {
      if (confirmed && this.selectedSubcategoryId() === subcategory.id) {
        this.selectedSubcategoryId.set(undefined);
        this.thematicSelected.emit(currentCategory);
      }
    });
  }

  /**
   * Finaliza la creación de un borrador persistiendo en la API.
   */
  saveDraft(name: string): void {
    this.editService.persistDraft(
      name,
      this.thematicColor(),
      this.parentId(),
      this.categories().length,
      this.selectedCategory()
    );
  }

  /**
   * Gestiona el caso en que el usuario intenta guardar un nombre vacío.
   */
  private handleEmptyName(item: Thematic, isCategory: boolean, index: number): void {
    this.editService.handleEmptyName(isCategory).subscribe(result => {
      const tags = isCategory ? this.categoryTags() : this.subcategoryTags();
      const tag = tags[index];

      if (result) {
        // Continuar editando: Re-enfocar la etiqueta
        setTimeout(() => {
          tag?.focusLabel();
        }, 150);
      } else {
        // Restaurar: Sincronizar con el valor original
        tag?.reset();
      }
    });
  }
}
