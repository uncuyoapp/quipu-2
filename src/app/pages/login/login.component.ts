import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
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
import { LoginCredentials, User } from '@models/domain/user.model';
import { NgIconComponent } from '@ng-icons/core';
import { AppNotificationService, LoadingService, ScreenOrientationService, SessionPersistenceService, SessionStateService } from '@services';
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
  loginForm = viewChild<TemplateRef<unknown>>('loginForm');
  passwordRecovery = viewChild<TemplateRef<unknown>>('passwordRecovery');
  passwordChange = viewChild<TemplateRef<unknown>>('passwordChange');
  statusMessage = viewChild<TemplateRef<unknown>>('statusMessage');
  informationUnitSelector = viewChild<TemplateRef<unknown>>('informationUnitSelector');

  /** Servicio para gestionar el estado de carga global */
  public readonly loadingService = inject(LoadingService);

  /** Configuración gráfica centralizada para el Login */
  protected readonly graphics = SECTION_GRAPHICS.login;

  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly _bottomSheet = inject(MatBottomSheet);
  private readonly notification = inject(AppNotificationService);

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

  constructor() {
    effect(() => {
      const user = this.sessionState.user();
      const hasRecoveryToken = !!this.recoverToken();
      const selectorTpl = this.informationUnitSelector();
      const formTpl = this.loginForm();

      if (hasRecoveryToken) {
        return;
      }

      if (user) {
        this.handleAuthenticatedUser(user, selectorTpl);
      } else {
        this.handleUnauthenticatedUser(formTpl, selectorTpl);
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Gestiona el flujo de navegación o presentación para un usuario autenticado.
   * @param user Usuario autenticado en sesión.
   * @param selectorTpl Plantilla del selector de unidades de información.
   */
  private handleAuthenticatedUser(user: User, selectorTpl?: TemplateRef<unknown>): void {
    const hasSelectedIU = user.selectedIU !== null && user.selectedIU !== undefined;
    const hasNoUnits = !user.informationUnits || user.informationUnits.length === 0;

    if (hasSelectedIU || hasNoUnits) {
      void this.router.navigate(['/']);
      return;
    }

    if (selectorTpl) {
      this.presentUnitSelector(selectorTpl);
    }
  }

  /**
   * Muestra el selector de unidades de información según el tipo de dispositivo.
   * @param selectorTpl Plantilla del selector.
   */
  private presentUnitSelector(selectorTpl: TemplateRef<unknown>): void {
    if (this.screenOrientation.isMobile()) {
      this.renderContent.set(selectorTpl);
      this.openBottomSheet();
    } else {
      this.showComponent(selectorTpl);
    }
  }

  /**
   * Restablece la visualización al formulario de inicio de sesión cuando corresponde.
   * @param formTpl Plantilla del formulario de login.
   * @param selectorTpl Plantilla del selector de unidades de información.
   */
  private handleUnauthenticatedUser(
    formTpl?: TemplateRef<unknown>,
    selectorTpl?: TemplateRef<unknown>
  ): void {
    const current = this.renderContent();
    const isLoginViewEligible = !current || current === selectorTpl;

    if (formTpl && isLoginViewEligible) {
      this.showComponent(formTpl);
    }
  }

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
    if (this.route.snapshot.queryParams['expired'] === 'true') {
      this.notification.warn('Tu sesión ha expirado. Por favor, ingresa nuevamente.');
    }

    // Verificar si existe un token de recuperación en los parámetros de la ruta
    const token = this.route.snapshot.params['recovery-token'] || this.route.snapshot.queryParams['recovery-token'];
    this.recoverToken.set(token);

    if (token) {
      this.verifyRecoveryToken(token);
    }
  }

  /**
   * Intenta iniciar sesión con las credenciales provistas.
   * @param credentials Usuario y contraseña.
   */
  login(credentials: LoginCredentials) {
    this.sessionPersistence.login(credentials.username, credentials.password).subscribe({
      next: () => {
        // La actualización reactiva del estado en SessionStateService gestiona la transición
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
   * Inicia la verificación del token de recuperación y actualiza la vista según el resultado.
   * @param token Cadena del token de recuperación a validar.
   */
  private verifyRecoveryToken(token: string): void {
    this.sessionPersistence.verifyRecoveryToken(token).subscribe({
      next: (isValid: boolean) => {
        const actions: Record<string, () => void> = {
          true: () => this.handleValidRecoveryToken(),
          false: () => this.handleRecoveryError(LOGIN_MESSAGES.recovery.tokenInvalid),
        };
        actions[String(isValid)]();
      },
      error: () => this.handleRecoveryError(LOGIN_MESSAGES.recovery.tokenError),
    });
  }

  /**
   * Muestra la plantilla de cambio de contraseña cuando el token es válido.
   */
  private handleValidRecoveryToken(): void {
    this.showComponent(this.passwordChange());
  }

  /**
   * Configura y muestra el mensaje de error de recuperación.
   * @param message Mensaje descriptivo a mostrar en la interfaz.
   */
  private handleRecoveryError(message: string): void {
    this.messageText.set(message);
    this.messageCssClass.set('text-danger');
    this.showLoginButton.set(true);
    this.showComponent(this.statusMessage());
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
  showComponent(template: TemplateRef<unknown> | undefined | null) {
    if (template) {
      this.renderContent.set(template);
    }
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
    void this.router.navigate([route]);
  }
}
