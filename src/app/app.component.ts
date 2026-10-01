import { Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EasterEggOverlayComponent } from '@components/easter-egg-overlay/easter-egg-overlay.component';
import { PwaInstallService, PwaUpdateService, ScreenOrientationService, SessionFocusDetectorService, SessionStateService, ThematicStateService } from '@services';
import { EasterEggService } from './core/services/easter-egg/easter-egg.service';

/**
 * @class AppComponent
 * @description
 * Componente raíz de la aplicación QUIPU.
 * Actúa como orquestador principal para la inicialización de la sesión, 
 * la sincronización del estado global y la carga inicial de datos temáticos.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, EasterEggOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  })
export class AppComponent implements OnInit {
  /** Título de la aplicación */
  title = 'QUIPU';

  private readonly pwaUpdateService = inject(PwaUpdateService);
  private readonly pwaInstallService = inject(PwaInstallService);
  private readonly thematicState = inject(ThematicStateService);
  private readonly sessionState = inject(SessionStateService);
  private readonly focusDetector = inject(SessionFocusDetectorService);
  private readonly easterEggService = inject(EasterEggService);
  private readonly screenService = inject(ScreenOrientationService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.focusDetector.initialize();
  }

  /** Indica si la gamificación está habilitada */
  protected readonly isGamificationEnabled = this.easterEggService.isEnabled;

  /** Almacena el ID de la última unidad de información para detectar cambios de contexto */
  private lastInformationUnitId: number | null = null;

  constructor() {
    effect(
      () => {
        const currentUnit = this.sessionState.currentInformationUnit();
        if (currentUnit) {
          // Verificar si cambió la unidad de información
          if (
            this.lastInformationUnitId !== null &&
            this.lastInformationUnitId !== currentUnit.id
          ) {
            // Si cambia la unidad, limpiamos el caché para evitar datos cruzados
            this.thematicState.clearCache();
          }

          // Actualizar la última unidad de información
          this.lastInformationUnitId = currentUnit.id;
        }
      },
      { allowSignalWrites: true }
    );

    // Sincronizar el estado móvil global con una clase en el body para CSS
    effect(() => {
      if (this.screenService.isMobile()) {
        document.body.classList.add('is-mobile');
      } else {
        document.body.classList.remove('is-mobile');
      }
    });
  }
}
