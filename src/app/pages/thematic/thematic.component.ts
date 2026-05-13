import { Component, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { VisualizationGridEditService } from '@components/visualization-grid/visualization-grid-edit.service';
import { VisualizationGridComponent } from '@components/visualization-grid/visualization-grid.component';
import { Thematic } from '@models/domain/thematic.model';
import { EditModeService, ThematicStateService } from '@services';
import { AlertBadgeComponent } from '@shared/components/alert-badge/alert-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ThematicNavigatorComponent } from './components/thematic-navigator/thematic-navigator.component';

import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { ThematicEditService } from './thematic-edit.service';
import { ThematicViewStateService } from './thematic-view-state.service';


/**
 * @class ThematicComponent
 * @description
 * Página de visualización de una temática específica.
 * Permite navegar por las categorías/subcategorías y ver las visualizaciones asociadas.
 * Delega las acciones de edición al servicio ThematicEditService.
 */
@Component({
  selector: 'app-thematic',
  standalone: true,
  providers: [ThematicEditService, VisualizationGridEditService, ThematicViewStateService],
  imports: [

    ThematicNavigatorComponent,
    VisualizationGridComponent,
    AlertBadgeComponent,
    ButtonComponent
  ],
  templateUrl: './thematic.component.html',
  styleUrl: './thematic.component.scss'
})
export class ThematicComponent {
  /** Referencia a la ruta activa */
  private readonly route = inject(ActivatedRoute);
  /** Servicio para gestión de temáticas */
  private readonly thematicState = inject(ThematicStateService);
  /** Referencia al router de Angular */
  private readonly router = inject(Router);

  /** Servicio para el estado del modo edición global */
  public readonly editModeService = inject(EditModeService);
  /** Servicio delegado para acciones de edición en la página de temáticas */
  public readonly editService = inject(ThematicEditService);
  /** Servicio para gestión de selección/edición en la grilla visual */
  public readonly gridEditService = inject(VisualizationGridEditService);

  /** Servicio reactivo para el estado de la vista */
  public readonly viewState = inject(ThematicViewStateService);

  /** Configuración gráfica centralizada para Temáticas */
  public readonly graphics = SECTION_GRAPHICS.thematic;

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Señal que extrae los parámetros de la ruta */
  private readonly params = toSignal(this.route.params);


  /** ID de la temática actual (extraído de la URL) */
  public readonly id = computed(() => {
    const p = this.params();
    return p ? Number.parseInt(p['id']) : undefined;
  });

  /** Temática principal cargada segón el ID de la URL */
  public readonly thematic = computed(() => {
    const currentId = this.id();
    if (currentId === undefined || !this.thematicState.thematics().length) return undefined;
    return this.thematicState.getThematic(currentId);
  });

  /** Lista de visualizaciones asociadas a la temática */
  public readonly visualizations = this.viewState.visualizations;
  /** Indica si se están cargando los datos de la temática */
  public readonly loading = this.viewState.loading;
  /** Filtros actuales aplicados a la visualización */
  public readonly filter = this.viewState.filter;
  /** Criterio de ordenamiento actual */
  public readonly order = this.viewState.order;

  /** Temática seleccionada actualmente en el navegador (puede ser una subcategoría) */
  public readonly selectedThematic = this.viewState.selectedThematic;


  constructor() {
    // Sincronizar el estado de selección de la grilla con el modo edición global
    effect(() => {
      this.syncGridSelectionMode();
    }, { allowSignalWrites: true });

    // Inicializar o resetear el estado de vista cuando cambia el ID de la temática
    effect(() => {
      const id = this.id();
      const thematic = this.thematic();
      if (id !== undefined && thematic) {
        this.viewState.initialize(id, thematic);
      }
    }, { allowSignalWrites: true });

    // Recargar visualizaciones cuando una acción por lote tenga éxito
    this.gridEditService.onActionSuccess
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.viewState.refresh();
      });


    // Redirigir al inicio si la temática no existe tras la carga de datos
    effect(() => {
      this.validateThematicExistence();
    }, { allowSignalWrites: true });
  }



  /**
   * Maneja la selección de una temática en el navegador.
   * Actualiza los filtros de visualización para incluir descendientes.
   * @param thematic Temática seleccionada (o undefined para volver a la raíz)
   */
  onSelectThematic(thematic: Thematic | undefined): void {
    this.viewState.selectThematic(thematic, this.thematic());
  }



  /**
   * Navega de regreso a la página de inicio.
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Abre el flujo de edición para asociar nuevas visualizaciones a la temática seleccionada.
   */
  editVisualizations(): void {
    const currentThematic = this.selectedThematic();
    if (!currentThematic) return;

    this.editService.asociarVisualizaciones(currentThematic).subscribe({
      next: () => {
        this.viewState.refresh();
      },
      error: (err: unknown) => console.error('Error al actualizar asociaciones:', err)
    });
  }


  /**
   * Configura el servicio de edición de la grilla basándose en el modo de edición global.
   */
  private syncGridSelectionMode(): void {

    const isEditMode = this.editModeService.isEditModeEnabled();
    this.gridEditService.initialize({
      isSelectable: isEditMode,
      visibleActions: ['publish', 'unpublish', 'delete']
    });
  }

  /**
   * Redirige al inicio si se intenta acceder a una temática inexistente.
   */
  private validateThematicExistence(): void {
    const currentId = this.id();
    const isLoading = this.thematicState.loading();
    const thematic = this.thematic();

    // Si hay un ID definido en la URL, los datos han terminado de cargar y la temática no se encontró
    if (currentId !== undefined && !isLoading && !thematic) {
      this.router.navigate(['/']);
    }
  }
}
