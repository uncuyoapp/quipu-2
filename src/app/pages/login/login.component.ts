import { Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { ActivatedRoute, Router } from '@angular/router';
import { InformationUnitSelectorComponent } from '@components/information-unit-selector/information-unit-selector.component';
import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { extractHttpErrorMessage } from '@core/utils/http-error.utils';
import { environment } from '@environments/environment';
import { LoginCredentials } from '@models/domain/user.model';
import { NgIconComponent } from '@ng-icons/core';
import { LoadingService, ScreenOrientationService, SessionPersistenceService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ButtonPalette } from '@shared/components/button/button.config';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';
import { PasswordRecoveryComponent } from './components/password-recovery/password-recovery.component';

export type LoginView = 'login' | 'recovery' | 'change' | 'status' | 'selector';

export interface StatusConfig {
  icon: string;
  palette: ButtonPalette;
  title?: string;
  message: string;
  btnLabel?: string;
}

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
  sessionExpired: {
    title: 'Sesión finalizada',
  },
  buttons: {
    back: 'Volver',
    start: 'Inicio',
    login: 'Iniciar sesión',
  },
} as const;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
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
  /** Configuración gráfica centralizada para el Login */
  protected readonly graphics = SECTION_GRAPHICS.login;

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Indica si se está utilizando información de prueba (mocks) */
  protected readonly isMockData = environment.useMockData;

  /** Versión de la aplicación desde el entorno */
  protected readonly appVersion = environment.appVersion;

  /** URL del repositorio desde el entorno */
  protected readonly repoUrl = environment.repoUrl;

  /** Servicio para gestionar el estado de carga global */
  protected readonly loadingService = inject(LoadingService);

  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly screenOrientation = inject(ScreenOrientationService);

  private bottomSheetRef: MatBottomSheetRef<InformationUnitSelectorComponent> | null = null;

  /** Vista activa actualmente en el login */
  protected readonly currentView = signal<LoginView>('login');

  /** Configuración del mensaje de estado actual */
  protected readonly status = signal<StatusConfig | null>(null);

  /** Token de recuperación obtenido de la URL */
  protected readonly recoverToken = signal<string | undefined>(
    this.route.snapshot.params['recovery-token'] || this.route.snapshot.queryParams['recovery-token']
  );

  /** Motivo de expiración de sesión recibido por el estado de navegación */
  private readonly sessionExpiredReason = signal<string | null>(null);

  constructor() {
    this.consumeSessionExpiredReason();

    effect(() => {
      const user = this.sessionState.user();
      const token = this.recoverToken();
      const expiredReason = this.sessionExpiredReason();

      // 1. Enlace de recuperación de contraseña activo
      if (token) {
        return;
      }

      // 2. Usuario con sesión iniciada
      if (user) {
        const hasSelectedIU = user.selectedIU !== null && user.selectedIU !== undefined;
        const hasNoUnits = !user.informationUnits || user.informationUnits.length === 0;

        if (hasSelectedIU || hasNoUnits) {
          untracked(() => void this.router.navigate(['/']));
          return;
        }

        untracked(() => this.presentUnitSelector());
        return;
      }

      // 3. Sesión expirada recientemente
      if (expiredReason) {
        untracked(() => this.showSessionExpiredMessage(expiredReason));
        return;
      }

      // 4. Usuario no autenticado estándar (ej. tras logout si estaba en selector)
      untracked(() => {
        if (this.currentView() === 'selector') {
          this.setView('login');
        }
      });
    }, { allowSignalWrites: true });
  }

  /**
   * Extrae y consume de forma única el motivo de sesión expirada desde el estado de navegación.
   */
  private consumeSessionExpiredReason(): void {
    const navState = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    const expiredReason = navState?.['sessionExpiredReason'] as string | undefined;

    if (expiredReason) {
      this.sessionExpiredReason.set(expiredReason);
      const currentState = { ...history.state };
      delete currentState['sessionExpiredReason'];
      history.replaceState(currentState, '');
    }
  }

  /**
   * Configura y presenta la plantilla de estado para un aviso de sesión expirada.
   * @param reason Motivo de la expiración.
   */
  private showSessionExpiredMessage(reason: string): void {
    this.displayStatus({
      palette: 'blue',
      icon: this.icons.status.warning,
      title: LOGIN_MESSAGES.sessionExpired.title,
      message: reason,
      btnLabel: LOGIN_MESSAGES.buttons.login,
    });
  }

  /**
   * Presenta una pantalla de estado unificada (#statusMessage).
   * @param config Configuración visual y de contenido del mensaje de estado.
   */
  private displayStatus(config: StatusConfig): void {
    this.status.set({
      ...config,
      btnLabel: config.btnLabel ?? LOGIN_MESSAGES.buttons.back,
    });
    this.setView('status');
  }

  /**
   * Muestra un mensaje de éxito unificado.
   * @param message Mensaje a mostrar.
   * @param title Título opcional.
   * @param btnLabel Etiqueta del botón opcional.
   */
  private showSuccessStatus(message: string, title?: string, btnLabel?: string): void {
    this.displayStatus({
      palette: 'green',
      icon: this.icons.status.success,
      title,
      message,
      btnLabel,
    });
  }

  /**
   * Muestra un mensaje de error unificado.
   * @param message Mensaje de error a mostrar.
   * @param title Título opcional.
   * @param btnLabel Etiqueta del botón opcional.
   */
  private showErrorStatus(message: string, title?: string, btnLabel?: string): void {
    this.displayStatus({
      palette: 'red',
      icon: this.icons.status.error,
      title,
      message,
      btnLabel,
    });
  }

  /**
   * Muestra el selector de unidades de información según el tipo de dispositivo.
   */
  private presentUnitSelector(): void {
    const isMobile = this.screenOrientation.isMobile();

    if (isMobile) {
      if (!this.bottomSheetRef) {
        this.bottomSheetRef = this.bottomSheet.open(InformationUnitSelectorComponent, {
          panelClass: 'bottom-sheet',
          hasBackdrop: true,
          disableClose: true,
        });

        this.bottomSheetRef.instance?.informationUnitSelect.subscribe(() => {
          this.bottomSheetRef?.dismiss();
        });

        this.bottomSheetRef.afterDismissed().subscribe(() => {
          this.bottomSheetRef = null;
        });
      }
    } else {
      this.setView('selector');
    }
  }

  /**
   * Cambia la vista activa del componente de login.
   * @param view Identificador de la vista.
   */
  protected setView(view: LoginView): void {
    if (view === 'login') {
      this.sessionExpiredReason.set(null);
    }
    this.currentView.set(view);
  }

  ngOnInit(): void {
    const token = this.recoverToken();
    if (token) {
      this.verifyRecoveryToken(token);
    }
  }

  /**
   * Intenta iniciar sesión con las credenciales provistas.
   * @param credentials Usuario y contraseña.
   */
  protected login(credentials: LoginCredentials) {
    this.sessionPersistence.login(credentials.username, credentials.password).subscribe({
      next: () => {
        // La actualización reactiva del estado en SessionStateService gestiona la transición
      },
      error: (err) => {
        this.showErrorStatus(extractHttpErrorMessage(err, LOGIN_MESSAGES.login.error));
      }
    });
  }

  /**
   * Procesa el cambio de contraseña mediante un token.
   * @param data Objeto con el token y la nueva contraseña.
   */
  protected changePassword(data: { token: string; password: string }) {
    // Prioridad al token del formulario, fallback al token obtenido de la ruta
    const tokenToUse = data.token || this.recoverToken();

    if (!tokenToUse) {
      this.showErrorStatus(LOGIN_MESSAGES.recovery.tokenInvalid);
      return;
    }

    this.sessionPersistence.changePassword(tokenToUse, data.password).subscribe({
      next: () => {
        this.showSuccessStatus(LOGIN_MESSAGES.changePassword.success);
      },
      error: (err) => {
        this.showErrorStatus(extractHttpErrorMessage(err, LOGIN_MESSAGES.changePassword.error));
      }
    });
  }

  /**
   * Solicita el envío de un correo de recuperación.
   * @param data Email del usuario.
   */
  protected recoveryPass(data: string) {
    this.sessionPersistence.recoveryPass(data).subscribe({
      next: (resp) => {
        const message = resp?.trim() || LOGIN_MESSAGES.recovery.successMessage;
        this.showSuccessStatus(message, LOGIN_MESSAGES.recovery.successTitle);
      },
      error: (err) => {
        this.showErrorStatus(
          extractHttpErrorMessage(err, LOGIN_MESSAGES.recovery.errorMessage),
          LOGIN_MESSAGES.recovery.errorTitle,
          LOGIN_MESSAGES.buttons.start
        );
      }
    });
  }

  /**
   * Inicia la verificación del token de recuperación y actualiza la vista según el resultado.
   * @param token Cadena del token de recuperación a validar.
   */
  private verifyRecoveryToken(token: string): void {
    this.sessionPersistence.verifyRecoveryToken(token).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.setView('change');
        } else {
          this.showErrorStatus(LOGIN_MESSAGES.recovery.tokenInvalid);
        }
      },
      error: (err) => {
        this.showErrorStatus(extractHttpErrorMessage(err, LOGIN_MESSAGES.recovery.tokenError));
      }
    });
  }

  /**
   * Maneja clics en el mensaje de estado (para links embebidos en innerHTML).
   * @param event Evento de clic.
   */
  protected handleStatusClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('status-link')) {
      event.preventDefault();
      this.setView('recovery');
    }
  }
}
