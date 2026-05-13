import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EditModeService, LoadingService } from '@services';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { EditModeBarComponent } from '../edit-mode-bar/edit-mode-bar.component';
import { FooterComponent } from '../footer/footer.component';
import { NavBarComponent } from '../nav-bar/nav-bar.component';

/**
 * Componente principal de diseño (Main Layout).
 * Estructura la aplicación incluyendo la barra de navegación, migas de pan,
 * el contenido dinámico de las rutas y el pie de página.
 * También gestiona el estado global de carga mediante un spinner.
 */
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    RouterOutlet,
    NavBarComponent,
    FooterComponent,
    BreadcrumbComponent,
    LoadingSpinnerComponent,
    EditModeBarComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  // ============================================
  // Dependencias (inject)
  // ============================================

  /** Servicio para gestionar el estado de carga global de la aplicación. */
  public readonly loadingService = inject(LoadingService);

  /** Servicio para gestionar el estado del modo de edición. */
  public readonly editModeService = inject(EditModeService);
}

