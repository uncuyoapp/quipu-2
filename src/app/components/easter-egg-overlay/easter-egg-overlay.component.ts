import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import { EasterEggService } from '../../core/services/easter-egg/easter-egg.service';

/**
 * Componente que muestra el sistema de gamificación "Easter Egg".
 * Se encarga de la representación visual del "Anciano Quipu" y el progreso del usuario.
 */
@Component({
  selector: 'app-easter-egg-overlay',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './easter-egg-overlay.component.html',
  styleUrls: ['./easter-egg-overlay.component.scss']
})
export class EasterEggOverlayComponent {
  private readonly easterEggService = inject(EasterEggService);
  protected readonly icons = APP_ICONS;

  /** Signal que indica si el juego está activo */
  public readonly isActive = this.easterEggService.isActive;
  /** Signal con el mensaje actual del personaje */
  public readonly currentMessage = this.easterEggService.currentMessage;
  /** Signal con el estado global (conteo de objetivos) */
  private readonly gameState = this.easterEggService.gameState;

  /** Indica si el cursor está sobre el personaje peeking */
  public readonly isHovered = signal<boolean>(false);

  /** Indica si se debe mostrar el video de recompensa */
  public readonly showVideo = signal<boolean>(false);

  /** Signal que indica si estamos en el Home */
  public readonly isHome = this.easterEggService.isHome;
  /** Estado de aparición (hidden, peeking, active) */
  public readonly peekState = this.easterEggService.peekState;
  /** Posición de la arista */
  public readonly peekPosition = this.easterEggService.peekPosition;
  /** Coordenada en la arista */
  public readonly peekCoordinate = this.easterEggService.peekCoordinate;

  /** Cantidad de objetivos completados */
  public readonly completedCount = computed(() => this.gameState().completedCount);
  /** Cantidad total de objetivos */
  public readonly totalCount = computed(() => this.gameState().totalCount);
  /** Indica si todos los objetivos han sido completados (independientemente del overlay) */
  public readonly isGameFinished = computed(() => this.gameState().isFinished);
  /** Indica si se han completado todos los objetivos y se debe mostrar el overlay */
  public readonly isFinished = this.easterEggService.isFinished;

  /**
   * Inicia la narrativa (primer encuentro).
   */
  onStartNarrative(): void {
    this.easterEggService.startNarrative();
  }

  /**
   * Confirma la misión y empieza el juego.
   */
  onConfirmMission(): void {
    this.easterEggService.confirmMission();
  }

  /**
   * Restaura el anciano desde el estado minimizado.
   */
  onRestore(): void {
    this.easterEggService.restoreGame();
  }

  /**
   * Revela el video de recompensa.
   */
  onRevealReward(): void {
    this.showVideo.set(true);
  }

  /**
   * Limpia el mensaje actual del anciano.
   */
  onClearMessage(event: Event): void {
    event.stopPropagation(); // Evitar que dispare el restore/stop
    this.easterEggService.clearMessage();
  }

  /**
   * Desactiva el modo de juego (oculta el personaje flotante).
   */
  onStop(): void {
    this.easterEggService.stopGame();
  }

  /**
   * Abre el overlay de recompensa manualmente.
   */
  onOpenReward(): void {
    this.easterEggService.openReward();
  }

  /**
   * Cierra el overlay de recompensa final y termina la sesión.
   */
  onCloseReward(): void {
    this.easterEggService.finishGame();
  }

  /**
   * Obtiene la ruta de la imagen según la posición de aparición.
   */
  getPeekImage(): string {
    const pos = this.peekPosition();
    return `assets/img/quipu-peek-${pos}.png`;
  }

  /**
   * Calcula los estilos dinámicos para el posicionamiento en la arista.
   */
  getPeekStyles(): any {
    const pos = this.peekPosition();
    const coord = this.peekCoordinate();

    if (pos === 'top' || pos === 'bottom') {
      return { left: `${coord}%` };
    } else {
      return { top: `${coord}%` };
    }
  }

  /**
   * Maneja el hover sobre el personaje peeking.
   */
  onHover(state: boolean): void {
    this.isHovered.set(state);
  }
}
