import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { InformationUnitSelectorComponent } from '@components/information-unit-selector/information-unit-selector.component';
import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { environment } from '@environments/environment';
import { InformationUnit } from '@models/domain/information-unit.model';
import { User, LoginCredentials } from '@models/domain/user.model';
import { NgIconComponent } from '@ng-icons/core';
import { LoadingService, ScreenOrientationService, SessionPersistenceService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';



const LOGIN_MESSAGES = {
  recovery: {
    tokenInvalid: 'El enlace de recuperación no es válido o ha expirado.',
    tokenError: 'Error al verificar el enlace de recuperación.',
    successTitle: '¡Correo enviado!',
    successMessage: 'Revise su email y siga las instrucciones para generar una nueva contraseña. <br> Si no lo recibió puede hacer <a href="#" class="status-link">clic aquí</a> para volver a intentarlo.',
    errorTitle: 'Algo salió mal',
    errorMessage: 'No pudimos enviar el correo de recuperación. Por favor inténtelo nuevamente.',
  },
  login: {
    error: 'Error al iniciar sesión. Por favor, verifica tus credenciales.',
  },
  changePassword: {
    success: 'Ya cambiamos tu contraseña, ahora podrás loguearte con tus nuevas credenciales.',
    error: 'Error al cambiar la contraseña. Por favor, intente nuevamente.',
  },
  buttons: {
    back: 'Volver',
    start: 'Inicio',
  },
  palettes: {
    success: 'green',
    error: 'red',
    default: 'blue',
  }
} as const;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    LoginFormComponent,
    PasswordChangeComponent,
    PasswordRecoveryComponent,
    InformationUnitSelectorComponent,
    MatBottomSheetModule,
    ButtonComponent,
    LoadingSpinnerComponent,
    NgIconComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  /** Referencias a las plantillas de la página */
  loginForm = viewChild.required<TemplateRef<unknown>>('loginForm');
  passwordRecovery = viewChild.required<TemplateRef<unknown>>('passwordRecovery');
  passwordChange = viewChild.required<TemplateRef<unknown>>('passwordChange');
  statusMessage = viewChild.required<TemplateRef<unknown>>('statusMessage');
  informationUnitSelector = viewChild.required<TemplateRef<unknown>>('informationUnitSelector');

  /** Servicio para gestionar el estado de carga global */
  public readonly loadingService = inject(LoadingService);

  /** Configuración gráfica centralizada para el Login */
  protected readonly graphics = SECTION_GRAPHICS.login;

  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly _bottomSheet = inject(MatBottomSheet);

  /** Servicio de detección de orientación y tipo de dispositivo */
  public readonly screenOrientation = inject(ScreenOrientationService);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Referencia a la plantilla que se está renderizando actualmente en el contenedor principal */
  renderContent = signal<TemplateRef<unknown> | null>(null);

  /** Token de recuperación obtenido de la URL */
  recoverToken = signal<string | undefined>(undefined);

  /** Texto del mensaje de estado a mostrar */
  messageText = signal<string>('');

  /** Clase CSS para aplicar al mensaje de estado */
  messageCssClass = signal<string>('');

  /** Determina si se debe mostrar el botón de volver al login */
  showLoginButton = signal<boolean>(false);

  /** Icono de estado (Ionicons) */
  statusIcon = signal<string>('');

  /** Título del mensaje de estado */
  statusTitle = signal<string>('');

  /** Etiqueta del botón de acción en el mensaje de estado */
  statusBtnLabel = signal<string>(LOGIN_MESSAGES.buttons.back);

  /** Paleta de colores para el icono y botones de estado */
  statusPalette = signal<'blue' | 'red' | 'green' | 'gray' | 'purple' | 'white'>(LOGIN_MESSAGES.palettes.default);

  /** Indica si se está utilizando información de prueba (mocks) */
  readonly isMockData = environment.useMockData;

  /** Versión de la aplicación desde el entorno */
  readonly appVersion = environment.appVersion;

  /** URL del repositorio desde el entorno */
  readonly repoUrl = environment.repoUrl;

  /**
   * Abre un panel inferior (bottom sheet) para selección en dispositivos móviles.
   */
  openBottomSheet(): void {
    const template = this.renderContent();
    if (template) {
      this._bottomSheet.open(template, {
        panelClass: 'bottom-sheet',
        hasBackdrop: true,
        disableClose: true,
      });
    }
  }

  ngOnInit(): void {
    // Verificar si existe un token de recuperación en los parámetros de la ruta
    const token = this.route.snapshot.params['recovery-token'] || this.route.snapshot.queryParams['recovery-token'];
    this.recoverToken.set(token);

    const loggedUser = this.sessionState.isAuthenticated() ? this.sessionState.user() : null;

    if (loggedUser?.selectedIU === null) {
      this.showComponent(this.informationUnitSelector());
    } else if (this.recoverToken()) {
      // Verificar la validez del token de recuperación
      this.sessionPersistence.verifyRecoveryToken(this.recoverToken()!).subscribe({
        next: (isValid: boolean) => {
          if (isValid) {
            this.showComponent(this.passwordChange());
          } else {
            this.messageText.set(LOGIN_MESSAGES.recovery.tokenInvalid);
            this.messageCssClass.set('text-danger');
            this.showLoginButton.set(true);
            this.showComponent(this.statusMessage());
          }
        },
        error: () => {
          this.messageText.set(LOGIN_MESSAGES.recovery.tokenError);
          this.messageCssClass.set('text-danger');
          this.showLoginButton.set(true);
          this.showComponent(this.statusMessage());
        }
      });
    } else {
      this.showComponent(this.loginForm());
    }
  }

  /**
   * Intenta iniciar sesión con las credenciales provistas.
   * @param credentials Usuario y contraseña.
   */
  login(credentials: LoginCredentials) {
    this.sessionPersistence.login(credentials.username, credentials.password).subscribe({
      next: (user: User) => {
        if (user.informationUnits.length > 0) {
          if (this.screenOrientation.isMobile()) {
            this.renderContent.set(this.informationUnitSelector());
            this.openBottomSheet();
          } else {
            this.renderContent.set(this.informationUnitSelector());
          }
        } else {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        this.statusIcon.set(this.icons.status.error);
        this.messageText.set(LOGIN_MESSAGES.login.error);
        this.statusPalette.set(LOGIN_MESSAGES.palettes.error);
        this.showLoginButton.set(true);
        this.showComponent(this.statusMessage());
      }
    });
  }

  /**
   * Procesa el cambio de contraseña mediante un token.
   * @param data Objeto con el token y la nueva contraseña.
   */
  changePassword(data: { token: string; password: string }) {
    // Prioridad al token del formulario, fallback al token obtenido de la ruta
    const tokenToUse = data.token || this.recoverToken();

    if (tokenToUse) {
      this.sessionPersistence.changePassword(tokenToUse, data.password).subscribe({
        next: () => {
          this.statusIcon.set(this.icons.status.success);
          this.messageText.set(LOGIN_MESSAGES.changePassword.success);
          this.statusPalette.set(LOGIN_MESSAGES.palettes.success);
          this.showLoginButton.set(true);
          this.showComponent(this.statusMessage());
        },
        error: () => {
          this.statusIcon.set(this.icons.status.error);
          this.messageText.set(LOGIN_MESSAGES.changePassword.error);
          this.statusPalette.set(LOGIN_MESSAGES.palettes.error);
          this.showLoginButton.set(true);
          this.showComponent(this.statusMessage());
        }
      });
    }
  }

  /**
   * Solicita el envío de un correo de recuperación.
   * @param data Email del usuario.
   */
  recoveryPass(data: string) {
    this.sessionPersistence.recoveryPass(data).subscribe({
      next: () => {
        this.statusIcon.set(this.icons.status.success);
        this.statusTitle.set(LOGIN_MESSAGES.recovery.successTitle);
        this.messageText.set(LOGIN_MESSAGES.recovery.successMessage);
        this.statusBtnLabel.set(LOGIN_MESSAGES.buttons.back);
        this.statusPalette.set(LOGIN_MESSAGES.palettes.success);
        this.showLoginButton.set(true);
        this.showComponent(this.statusMessage());
      },
      error: () => {
        this.statusIcon.set(this.icons.status.error);
        this.statusTitle.set(LOGIN_MESSAGES.recovery.errorTitle);
        this.messageText.set(LOGIN_MESSAGES.recovery.errorMessage);
        this.statusBtnLabel.set(LOGIN_MESSAGES.buttons.start);
        this.statusPalette.set(LOGIN_MESSAGES.palettes.error);
        this.showLoginButton.set(true);
        this.showComponent(this.statusMessage());
      }
    });
  }

  /**
   * Maneja la selección de una unidad de información.
   * @param informationUnit Unidad seleccionada.
   */
  selectInformationUnit(informationUnit: InformationUnit) {
    this._bottomSheet.dismiss();
  }

  /**
   * Cambia el componente/plantilla que se muestra actualmente.
   * @param template Referencia a la plantilla.
   */
  showComponent(template: TemplateRef<unknown>) {
    this.renderContent.set(template);
  }

  /**
   * Maneja clics en el mensaje de estado (para links embebidos en innerHTML).
   * @param event Evento de clic.
   */
  handleStatusClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('status-link')) {
      event.preventDefault();
      this.showComponent(this.passwordRecovery());
    }
  }

  /**
   * Navega a una ruta específica.
   * @param route Path de la ruta.
   */
  navigate(route: string) {
    this.router.navigate([route]);
  }
}
