import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { APP_ICONS } from '@core/config/icons.config';
import { APP_LOGOS } from '@core/config/illustrations.config';
import { environment } from '@environments/environment';
import { NgIconComponent } from '@ng-icons/core';
import { ButtonComponent } from '@shared/components/button/button.component';

/**
 * @class WelcomeModalComponent
 * @description
 * Componente de modal de bienvenida para usuarios que ingresan por primera vez.
 * Presenta un resumen de la aplicación, invitaciones a la exploración y consideraciones
 * sobre el uso de datos de prueba.
 */
@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  imports: [NgIconComponent, ButtonComponent],
  templateUrl: './welcome-modal.component.html',
  styleUrl: './welcome-modal.component.scss'
})
export class WelcomeModalComponent {
  private readonly dialogRef = inject(MatDialogRef<WelcomeModalComponent>);
  private readonly router = inject(Router);

  /** URL del repositorio para las consideraciones técnicas */
  protected readonly repoUrl = environment.repoUrl;

  /** Logos institucionales */
  protected readonly logos = {
    universityArea: APP_LOGOS.universityArea
  };

  /** Iconos de la aplicación */
  protected readonly icons = APP_ICONS;

  /**
   * Cierra el modal de bienvenida.
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Navega a la página "Acerca de" y cierra el modal.
   */
  goToAbout(): void {
    this.router.navigate(['/about']);
    this.close();
  }

  /**
   * Abre la sección de proveedores de datos en el repositorio de GitHub.
   */
  goToRepoProviders(): void {
    window.open(`${this.repoUrl}#proveedor-de-datos-intercambiable`, '_blank');
  }
}
