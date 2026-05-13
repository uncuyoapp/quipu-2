import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchBarComponent } from '@components/search-bar/search-bar.component';
import { VisualizationGridComponent } from '@components/visualization-grid/visualization-grid.component';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import { VisualizationStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SearchViewStateService } from './search-view-state.service';



/**
 * Página de búsqueda con flujo en dos pasos.
 *
 * - **Paso 1 – Búsqueda:** muestra el buscador (`app-search-bar`) para ingresar el término.
 * - **Paso 2 – Resultados:** muestra los resultados en la grilla con opción de reinicio.
 *
 * Si la página recibe el parámetro `?q=`, salta directamente al paso 2.
 * Las sugerencias de autocompletado son gestionadas internamente por `SearchBarComponent`.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  providers: [SearchViewStateService],
  imports: [
    VisualizationGridComponent,
    SearchBarComponent,
    ButtonComponent,
    NgIconComponent,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly visualizationState = inject(VisualizationStateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Servicio especializado en el estado de la vista de búsqueda */
  public readonly viewState = inject(SearchViewStateService);

  protected readonly icons = APP_ICONS;

  // ─── Estado (Delegado) ────────────────────────────────────────────────────────

  /** Controla el paso activo del flujo (búsqueda o resultados). */
  readonly paso = this.viewState.paso;

  /** Término de búsqueda confirmado por el usuario. */
  readonly searchText = this.viewState.searchText;

  /** Lista de visualizaciones obtenidas de la API. */
  readonly visualizations = this.viewState.visualizations;

  /** Indica si la búsqueda está en curso. */
  readonly loading = this.viewState.loading;


  constructor() {
    // Escuchar cambios en los parámetros de consulta de la URL para sincronizar el estado
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => this.viewState.initialize(params['q']));
  }


  // ─── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Dispara la búsqueda al presionar Enter o seleccionar una sugerencia en el SearchBar.
   * Actualiza la URL y avanza al paso de resultados.
   * @param texto Término a buscar.
   */
  onSearch(texto: string): void {
    const trimmed = texto.trim();
    if (!trimmed || trimmed === this.searchText()) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: trimmed },
      queryParamsHandling: 'merge',
    });
    // El servicio se actualizará automáticamente a través de la suscripción al queryParam en el constructor
  }

  /**
   * Resetea el estado de búsqueda y vuelve al paso 1.
   * Limpia el parámetro `?q` de la URL.
   */
  resetBusqueda(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge',
    });
    // El servicio se reseteará automáticamente vía queryParam
  }

}
