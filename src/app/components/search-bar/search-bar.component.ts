import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnDestroy, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { DataReadService } from '@services';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';

export type SearchBarStyle = 'default' | 'minimal';

/**
 * Componente que proporciona un campo de entrada de búsqueda con sugerencias de autocompletado.
 *
 * Gestiona internamente el debounce y la obtención de sugerencias desde la API.
 * No requiere que los componentes padres manejen esta lógica.
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TextInputComponent
  ],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnDestroy {
  private readonly dataRead = inject(DataReadService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = APP_ICONS;

  // ─── Constantes ───────────────────────────────────────────────────────────────
  private readonly MIN_CHARS = 3;
  private readonly DEBOUNCE_MS = 300;
  private debounceTimeoutId: number | null = null;
  private ultimoTexto = '';
  private destruido = false;

  // ─── Inputs ───────────────────────────────────────────────────────────────────

  /** Variante de estilo visual de la barra de búsqueda. */
  style = input<SearchBarStyle>('default');

  /** Texto de marcador de posición cuando la entrada está vacía. */
  placeholder = input<string>('Buscar');

  // ─── Signals internos ─────────────────────────────────────────────────────────

  /** Lista interna de sugerencias obtenidas de la API. */
  readonly sugerencias = signal<string[]>([]);

  // ─── Outputs ──────────────────────────────────────────────────────────────────

  /** Emite el valor del texto cuando el usuario escribe (sin incluir la lógica de sugerencias). */
  valueChange = output<string>();

  /** Emite cuando se dispara una acción de búsqueda (Enter o selección de sugerencia). */
  search = output<string>();

  /** Emite cuando la entrada recibe el foco. */
  focus = output<void>();

  /** Emite cuando la entrada pierde el foco. */
  blur = output<void>();

  ngOnDestroy(): void {
    this.destruido = true;
    this.cancelarDebounce();
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Reacciona a cada cambio de texto: emite el evento y agenda el fetch de sugerencias con debounce.
   * @param texto Texto actual en el input.
   */
  onSearchTextChange(texto: string): void {
    this.ultimoTexto = texto.trim();
    this.valueChange.emit(texto);
    this.programarFetchSugerencias(this.ultimoTexto);
  }

  /**
   * Emite la búsqueda confirma la selección y limpia las sugerencias.
   * @param searchText Texto a buscar.
   */
  onSearch(searchText: string): void {
    this.cancelarDebounce();
    this.sugerencias.set([]);
    this.search.emit(searchText);
  }

  /**
   * Emite el evento de foco.
   */
  onInputFocus(): void {
    this.focus.emit();
  }

  /**
   * Al perder el foco, solo hace fetch si hay texto suficiente Y el componente sigue vivo.
   * Se cancela el debounce pendiente para evitar llamadas duplicadas.
   */
  onInputBlur(): void {
    this.cancelarDebounce();

    // Solo fetchar si hay texto válido y el componente no está siendo destruido
    if (!this.destruido && this.ultimoTexto.length >= this.MIN_CHARS) {
      this.fetchSugerencias(this.ultimoTexto);
    }

    this.blur.emit();
  }

  // ─── Privados ─────────────────────────────────────────────────────────────────

  /**
   * Cancela el timeout de debounce pendiente.
   */
  private cancelarDebounce(): void {
    if (this.debounceTimeoutId !== null) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }
  }

  /**
   * Programa un fetch con debounce para evitar llamadas excesivas a la API.
   * @param texto Texto de búsqueda ya recortado.
   */
  private programarFetchSugerencias(texto: string): void {
    this.cancelarDebounce();

    if (texto.length < this.MIN_CHARS) {
      this.sugerencias.set([]);
      return;
    }

    this.debounceTimeoutId = window.setTimeout(() => {
      // Verificar que el componente sigue vivo antes de hacer la llamada
      if (!this.destruido) {
        this.fetchSugerencias(texto);
      }
    }, this.DEBOUNCE_MS);
  }

  /**
   * Solicita sugerencias a la API solo si el texto enviado sigue siendo el texto actual.
   * @param texto Término de búsqueda validado al momento de disparar la llamada.
   */
  private fetchSugerencias(texto: string): void {
    // Guardia: si el texto cambió mientras esperaba, no procesamos la respuesta
    this.dataRead.getSearchSuggestions(texto).subscribe({
      next: lista => {
        // Solo aplicar si el texto no cambió y el componente sigue vivo
        if (!this.destruido && this.ultimoTexto === texto) {
          this.sugerencias.set(lista);
        }
      },
      error: err => {
        console.error('Error al obtener sugerencias:', err);
        if (!this.destruido) {
          this.sugerencias.set([]);
        }
      },
    });
  }
}
