import { Component, inject, input, output, signal, viewChild } from '@angular/core';
import { AppEventType } from '@core/models/events/app-event.types';
import { AppEventBusService } from '@services';

import { TextInputComponent } from '@shared/components/text-input/text-input.component';

@Component({
  selector: 'app-visualization-search',
  standalone: true,
  imports: [
    TextInputComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
/**
 * Componente de búsqueda específico para visualizaciones.
 * Encapsula un TextInputComponent con configuración predefinida.
 */
export class VisualizationSearchComponent {
  /** Referencia al input interno para limpiar el campo externamente. */
  textInput = viewChild(TextInputComponent);

  private readonly eventBus = inject(AppEventBusService);

  /** Texto inicial de búsqueda. */
  searchText = input<string>('');

  /** Sugerencias para el autocompletado. */
  suggestions = input<string[]>([]);

  /** Emisión de cambios en el texto de búsqueda. */
  valueChange = output<string>();

  /** Color de fondo dinámico del input. */
  backgroundColor = signal<string>('var(--q-surface-variant)');

  /** Controla la visibilidad del borde al enfocar. */
  showBorder = signal<boolean>(false);

  /**
   * Maneja el evento de búsqueda y emite el valor.
   * @param text Texto ingresado.
   */
  onSearch(text: string) {
    this.valueChange.emit(text);
    if (text.trim().length > 0) {
      this.eventBus.emit({
        type: AppEventType.SEARCH_USED,
        payload: { query: text, resultsCount: 0 } // No conocemos el conteo aquí, pero se dispara la acción
      });
    }
  }

  /**
   * Cambia el estilo visual al ganar foco.
   */
  onFocus() {
    this.backgroundColor.set('var(--q-white)');
    this.showBorder.set(true);
  }

  /**
   * Restaura el estilo visual al perder foco.
   */
  onBlur() {
    this.backgroundColor.set('var(--q-surface-variant)');
    this.showBorder.set(false);
  }

  /**
   * Limpia el campo de búsqueda visualmente y emite un valor vacío.
   */
  clear(): void {
    this.textInput()?.clear();
    this.valueChange.emit('');
  }
}
