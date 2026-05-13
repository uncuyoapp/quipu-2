import { Component, inject } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { AppDialogService, EditModeService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SwitchComponent } from '@shared/components/switch/switch.component';

/**
 * Componente que muestra una barra fija al final de la pantalla
 * para activar o desactivar el modo de edición.
 * Solo se muestra si el usuario tiene permisos suficientes.
 */
@Component({
  selector: 'app-edit-mode-bar',
  standalone: true,
  imports: [ButtonComponent, SwitchComponent],
  templateUrl: './edit-mode-bar.component.html',
  styleUrl: './edit-mode-bar.component.scss'
})
export class EditModeBarComponent {
  /** Servicio para gestionar el estado del modo de edición. */
  public readonly editModeService = inject(EditModeService);

  /** Servicio especializado de diálogos. */
  private readonly dialogs = inject(AppDialogService);

  protected readonly icons = APP_ICONS;

  /**
   * Maneja el evento de ocultar la barra.
   * Abre un diálogo de confirmación antes de proceder.
   */
  public onHideBar(): void {
    this.dialogs.confirm({
      title: 'Ocultar barra de edición',
      message: '¿Estás seguro de que deseas ocultar la barra de modo edición? Podrás volver a habilitarla desde tu perfil de usuario en la sección de configuración de interfaz.',
      confirmText: 'Ocultar',
      cancelText: 'Cancelar',
      confirmPalette: 'blue'
    }).subscribe((result: boolean) => {
      if (result) {
        this.editModeService.setBarVisibility(false);
      }
    });
  }
}
