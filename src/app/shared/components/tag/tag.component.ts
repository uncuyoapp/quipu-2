import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import {
  TAG_COLOR_PALETTES,
  TAG_DEFAULTS,
  TagAppearance,
  TagIconPosition,
  TagPalette,
  TagSize,
  TagVariant
} from './tag.config';

@Component({
  selector: 'app-tag',
  standalone: true,
  imports: [NgIconComponent, DragDropModule],
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
  host: {
    '[style.--tag-custom-background]': 'background()',
    '[style.--tag-bg-default]': 'getColorValue("background", "default")',
    '[style.--tag-color-default]': 'getColorValue("color", "default")',
    '[style.--tag-border-default]': 'getBorderValue("default")',
    '[style.--tag-bg-hover]': 'getColorValue("background", "hover")',
    '[style.--tag-color-hover]': 'getColorValue("color", "hover")',
    '[style.--tag-border-hover]': 'getBorderValue("hover")',
    '[style.--tag-bg-active]': 'getColorValue("background", "active")',
    '[style.--tag-color-active]': 'getColorValue("color", "active")',
    '[style.--tag-border-active]': 'getBorderValue("active")'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagComponent {
  readonly label = input.required<string>();
  readonly variant = input<TagVariant>(TAG_DEFAULTS.variant);
  readonly appearance = input<TagAppearance>(TAG_DEFAULTS.appearance);
  readonly size = input<TagSize>(TAG_DEFAULTS.size);
  readonly palette = input<TagPalette>(TAG_DEFAULTS.palette);
  readonly icon = input<string | undefined>(undefined);
  readonly iconPosition = input<TagIconPosition>(TAG_DEFAULTS.iconPosition);
  readonly background = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(TAG_DEFAULTS.disabled);
  readonly selected = input<boolean>(false);
  readonly editable = input<boolean>(false);
  readonly editMode = input<boolean>(false);

  readonly tagClick = output<void>();
  readonly labelChange = output<string>();
  readonly deleteClick = output<void>();
  readonly editClick = output<void>();

  protected readonly icons = APP_ICONS;

  readonly isEditing = signal(false);

  private readonly labelElement = viewChild<ElementRef<HTMLSpanElement>>('labelSpan');

  // Computed para determinar la paleta efectiva
  effectivePalette = computed(() => {
    return this.background() ? 'white' : this.palette();
  });

  tagClasses = computed(() => {
    return {
      'tag': true,
      [`tag--${this.variant()}`]: true,
      [`tag--${this.appearance()}`]: true,
      [`tag--${this.size()}`]: true,
      [`tag--${this.effectivePalette()}`]: true,
      [`tag--icon-${this.iconPosition()}`]: !!this.icon(),
      'tag--with-icon': !!this.icon(),
      'tag--custom-bg': !!this.background(),
      'tag--disabled': this.disabled(),
      'tag--selected': this.selected(),
      'tag--edit-mode': this.editMode()
    };
  });

  onClick(): void {
    if (!this.disabled()) {
      this.tagClick.emit();
    }
  }

  onLabelBlur(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    const newLabel = element.innerText.trim();

    // Emitimos si el texto ha cambiado O si está vacío (para forzar validación en el padre)
    if (newLabel !== this.label() || newLabel === '') {
      this.labelChange.emit(newLabel);
    }
    this.isEditing.set(false);
  }

  /**
   * Sincroniza manualmente el texto del DOM con el valor del signal label.
   * Útil para revertir cambios no deseados (ej. Restaurar).
   */
  reset(): void {
    const el = this.labelElement()?.nativeElement;
    if (el) {
      el.innerText = this.label();
    }
  }

  onDeleteClick(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteClick.emit();
  }

  onEditClick(event: MouseEvent): void {
    event.stopPropagation();
    this.editClick.emit();
    this.focusLabel();
  }

  onLabelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    }
  }

  focusLabel(): void {
    if (!this.editable()) return;
    this.isEditing.set(true);

    // Esperamos un tick para que el atributo contenteditable se aplique
    setTimeout(() => {
      const el = this.labelElement()?.nativeElement;
      if (el) {
        el.focus();
        // Mover el cursor al final del texto
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }

  getColorValue(
    property: 'background' | 'color',
    state: 'default' | 'hover' | 'active'
  ): string {
    const palette = TAG_COLOR_PALETTES[this.effectivePalette()];
    const appearance = this.appearance();
    const resolvedState = this.selected() ? 'active' : state;

    if (property === 'background' && this.background()) {
      return this.background()!;
    }

    return palette[appearance][resolvedState][property];
  }

  getBorderValue(state: 'default' | 'hover' | 'active'): string {
    const palette = TAG_COLOR_PALETTES[this.effectivePalette()];
    const appearance = this.appearance();
    const resolvedState = this.selected() ? 'active' : state;

    if (appearance === 'outlined') {
      return palette.outlined[resolvedState].border;
    }

    return 'transparent';
  }
}