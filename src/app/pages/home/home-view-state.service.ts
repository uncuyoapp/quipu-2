import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ThematicStateService } from '@services';

/**
 * @class HomeViewStateService
 * @description
 * Servicio encargado de gestionar el estado de vista de la página de inicio.
 * Provee acceso al estado global de temáticas y centraliza la navegación.
 */
@Injectable()
export class HomeViewStateService {
  private readonly router = inject(Router);
  private readonly thematicState = inject(ThematicStateService);

  /** Signal con el listado de temáticas raíz */
  public readonly thematics = this.thematicState.thematics;

  /** Signal que indica si las temáticas se están cargando */
  public readonly loading = this.thematicState.loading;

  /**
   * Navega a la página de búsqueda con un término opcional.
   * @param searchText Término de búsqueda.
   */
  public navigateToSearch(searchText?: string): void {
    const queryParams = searchText ? { q: searchText } : {};
    this.router.navigate(['/search'], { queryParams });
  }

  /**
   * Navega a la página de explorador de visualizaciones.
   */
  public navigateToVisualizations(): void {
    this.router.navigate(['/visualizations']);
  }
}
