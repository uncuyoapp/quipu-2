import { CommonModule } from '@angular/common';
import { Component, computed, inject, isDevMode, signal } from '@angular/core';
import { Router } from '@angular/router';
import { APP_ICONS } from '@core/config/icons.config';
import { EasterEggService, EditModeService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SwitchComponent } from '@shared/components/switch/switch.component';

@Component({
  selector: 'app-user-profile-info',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SwitchComponent],
  templateUrl: './user-profile-info.component.html',
  styleUrl: './user-profile-info.component.scss'
})
export class UserProfileInfoComponent {
  private readonly sessionState = inject(SessionStateService);
  private readonly router = inject(Router);
  public readonly editModeService = inject(EditModeService);
  private readonly easterEggService = inject(EasterEggService);

  /** Indica si la gamificación está habilitada globalmente */
  public readonly isGamificationEnabled = this.easterEggService.isEnabled;

  protected readonly icons = APP_ICONS;
  public readonly isDev = signal(isDevMode());

  public readonly user = this.sessionState.user;

  editEmail() {
    this.router.navigate(['/user/edit-email']);
  }

  editName() {
    this.router.navigate(['/user/edit-name']);
  }

  editWorkArea() {
    this.router.navigate(['/user/edit-work-area']);
  }

  editPassword() {
    this.router.navigate(['/user/change-password']);
  }

  // --- Misión Ancestral ---
  public readonly isActive = this.easterEggService.isActive;
  public readonly gameState = this.easterEggService.gameState;
  public readonly allCompleted = computed(() => this.gameState().isFinished);

  reopenReward() {
    this.easterEggService.reopenReward();
  }

  requestHelp() {
    this.easterEggService.showNextHint();
  }

  finalizeGame() {
    if (confirm('¿Deseas finalizar el juego? Esto desactivará la misión y reiniciará todo tu progreso.')) {
      this.easterEggService.resetGame();
    }
  }

  // --- Métodos de Debug ---
  completeViewer() {
    this.easterEggService.debugCompleteViewer();
  }

  completeAdmin() {
    this.easterEggService.debugCompleteAdmin();
  }
}
