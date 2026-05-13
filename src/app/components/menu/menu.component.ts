import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { APP_ICONS } from '@core/config/icons.config';
import { AppDialogService, InformationUnitService, SessionPersistenceService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { DeviceDetectorService } from 'ngx-device-detector';

/**
 * Componente que renderiza el menú de navegación principal de la aplicación.
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    A11yModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly dialogs = inject(AppDialogService);
  private readonly deviceService = inject(DeviceDetectorService);
  private readonly informationUnitService = inject(InformationUnitService);
  private readonly router = inject(Router);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  selectedUnit = computed(
    () => this.sessionState.currentInformationUnit() ?? null
  );

  /** Indica si el usuario actual tiene permisos de administrador */
  isAdmin = computed(() => this.sessionState.user()?.role === 'admin');

  isMobile = this.deviceService.isMobile();

  /** Evento emitido para solicitar el cierre del menú. */
  closeMenu = output<boolean>();

  /**
   * Maneja el evento de clic del botón de cerrar.
   */
  onClickClose() {
    this.closeMenu.emit(true);
  }

  /**
   * Cierra la sesión del usuario actual después de mostrar un diálogo de confirmación.
   */
  logout(): void {
    this.dialogs.confirm({
      title: 'Cerrar sesión',
      message: '¿Estás seguro que quieres cerrar sesión?',
      confirmText: 'Cerrar sesión',
      confirmPalette: 'pink'
    }).subscribe((result) => {
      if (result) {
        this.sessionPersistence.logout();
        this.closeMenu.emit(true);
      }
    });
  }

  /**
   * Navega a la página especificada y cierra el menú.
   * 
   * @param page La ruta de navegación.
   */
  navigate(page: string) {
    this.router.navigate([page]);
    this.closeMenu.emit(true);
  }

  /**
   * Abre el diálogo de selección de unidad de información.
   */
  onClickInformationUnitChange(): void {
    this.informationUnitService.openInformationUnitSelector();
  }
}
