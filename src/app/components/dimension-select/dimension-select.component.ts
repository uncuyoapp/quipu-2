import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { Component, computed, inject, input, model, signal } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { TagComponent } from '@shared/components/tag/tag.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { Dimension } from '@models/domain/dataset.model';

export type DropDownType = 'block' | 'modal';

@Component({
  selector: 'app-dimension-select',
  standalone: true,
  imports: [
    TagComponent,
    CheckboxComponent,
    ButtonComponent,
    TextInputComponent,
    OverlayModule
  ],
  templateUrl: './dimension-select.component.html',
  styleUrl: './dimension-select.component.scss',
})
export class DimensionSelectComponent {
  // Two-way binding con model()
  dimension = model.required<Dimension>();

  showCheckbox = input<boolean>(true);
  showDropdown = input<boolean>(true);
  selected = input<boolean>();
  dropdownType = input<'modal' | 'inline'>('inline');
  searchThreshold = input<number>(5);

  // Use Overlay service to create scroll strategy
  private overlay = inject(Overlay);
  scrollStrategy = this.overlay.scrollStrategies.reposition();
  positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
  ];

  protected readonly icons = APP_ICONS;

  // State
  isDropdownOpen = signal(false);
  searchText = signal('');

  // Computed
  shouldShowSearch = computed(() => {
    const items = this.dimension().items || [];
    return items.length > this.searchThreshold();
  });

  filteredItems = computed(() => {
    const search = this.searchText().toLowerCase();
    const items = this.dimension().items || [];

    if (!search) return items;

    return items.filter((item) => item.name.toLowerCase().includes(search));
  });

  allSelected = computed(() => {
    const items = this.dimension().items || [];
    return items.length > 0 && items.every((item) => item.selected ?? true);
  });

  someSelected = computed(() => {
    const items = this.dimension().items || [];
    const selectedCount = items.filter((item) => item.selected ?? true).length;
    return selectedCount > 0 && selectedCount < items.length;
  });

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
    if (!this.isDropdownOpen()) {
      this.searchText.set('');
    }
  }

  onDimensionCheckboxChange(checked: boolean): void {
    this.dimension.update((dim) => ({
      ...dim,
      selected: checked,
    }));
  }

  onSelectAll(checked: boolean): void {
    this.dimension.update((dim) => ({
      ...dim,
      selected: dim.selected ?? true,
      items: dim.items.map((item) => ({
        ...item,
        selected: checked,
      })),
    }));
  }

  onItemCheckboxChange(itemId: number, checked: boolean): void {
    this.dimension.update((dim) => ({
      ...dim,
      selected: dim.selected ?? true,
      items: dim.items.map((item) =>
        item.id === itemId
          ? { ...item, selected: checked }
          : { ...item, selected: item.selected ?? true }
      ),
    }));
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
    this.searchText.set('');
  }
}
