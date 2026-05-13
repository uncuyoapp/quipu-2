import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SearchBarComponent } from '@components/search-bar/search-bar.component';
import { Thematic } from '@models/domain/thematic.model';
import { AppDialogService, EditModeService } from '@services';
import { AlertBadgeComponent } from '@shared/components/alert-badge/alert-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ThematicGridComponent } from './components/thematic-grid/thematic-grid.component';

import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { HomeEditService } from './home-edit.service';
import { HomeViewStateService } from './home-view-state.service';

/**
 * @class HomeComponent
 * @description
 * Componente de la página de inicio que gestiona la búsqueda global y el grid de temáticas.
 * Delega las acciones de administración de temáticas al servicio HomeEditService.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  providers: [HomeEditService, HomeViewStateService],
  imports: [
    SearchBarComponent,
    ThematicGridComponent,
    ButtonComponent,
    AlertBadgeComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly dialogs = inject(AppDialogService);

  /** Servicio reactivo para el estado de la vista */
  public readonly viewState = inject(HomeViewStateService);

  /** Configuración gráfica centralizada para el Home */
  public readonly graphics = SECTION_GRAPHICS.home;

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  public readonly editModeService = inject(EditModeService);
  /** Servicio delegado exclusivamente para acciones de edición */
  public readonly editService = inject(HomeEditService);

  ngOnInit(): void {
    this._checkWelcomeModal();
  }

  /**
   * Verifica si es la primera vez que el usuario ingresa para mostrar el modal de bienvenida.
   * @private
   */
  private _checkWelcomeModal(): void {
    const welcomeSeen = localStorage.getItem('quipu-welcome-seen');
    if (!welcomeSeen) {
      this.dialogs.openWelcome().subscribe();
      localStorage.setItem('quipu-welcome-seen', 'true');
    }
  }

  /**
   * Abre el diálogo para crear una nueva temática raíz.
   */
  openCreateThematicDialog(): void {
    this.editService.openCreateThematicDialog();
  }

  /**
   * Abre el diálogo para editar una temática existente.
   * @param thematic La temática a editar.
   */
  onEditThematic(thematic: Thematic): void {
    this.editService.onEditThematic(thematic);
  }

  /**
   * Elimina una temática raíz tras confirmación.
   * @param id ID de la temática.
   */
  onDeleteThematic(id: number): void {
    this.editService.onDeleteThematic(id);
  }

  /**
   * Actualiza el orden de las temáticas raíz.
   * @param reorderedList El nuevo listado ordenado.
   */
  onReorderThematics(reorderedList: Thematic[]): void {
    this.editService.onReorderThematics(reorderedList);
  }

  /**
   * Navega a la página de búsqueda.
   */
  navigateToSearch(): void {
    this.viewState.navigateToSearch();
  }

  /**
   * Navega a la página de explorador de visualizaciones.
   */
  navigateToVisualizations(): void {
    this.viewState.navigateToVisualizations();
  }

  /**
   * Navega a la página de búsqueda con el texto ingresado.
   * @param searchText Texto de búsqueda.
   */
  onSearchBar(searchText: string): void {
    this.viewState.navigateToSearch(searchText);
  }
}
