import { computed, DestroyRef, inject, Injectable, isDevMode, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { AppEventType } from '@core/models/events/app-event.types';
import { environment } from '@environments/environment';
import { filter, map } from 'rxjs';
import { AppEventBusService } from '../events/app-event-bus.service';
import { SessionStateService } from '../state/session-state.service';
import { EditModeService } from '../ux/edit-mode.service';
import { EASTER_EGG_MISSIONS } from './easter-egg-missions.config';
import { EASTER_EGG_NARRATIVE } from './easter-egg-narrative.constants';
import { GameObjective, GameState } from './easter-egg.interface';

/** Clave para persistencia en localStorage */
const STORAGE_KEY = 'quipu_easter_egg_progress';
/** Tiempo de inactividad por defecto (1 minuto) */
const IDLE_HINT_TIMEOUT_MS = 60000;

/**
 * Servicio central del "Easter Egg" que gestiona la gamificación de la app.
 * Optimizado para búsqueda O(1) y gestión reactiva con Signals.
 */
@Injectable({
  providedIn: 'root'
})
export class EasterEggService {
  private readonly eventBus = inject(AppEventBusService);
  private readonly session = inject(SessionStateService);
  private readonly router = inject(Router);
  private readonly editModeService = inject(EditModeService);
  private readonly destroyRef = inject(DestroyRef);

  // --- Signals de Estado ---
  private readonly _currentPath = signal<string>('');
  private readonly _peekState = signal<'hidden' | 'peeking' | 'active' | 'minimized'>('hidden');
  private readonly _peekPosition = signal<'top' | 'bottom' | 'left' | 'right'>('left');
  private readonly _peekCoordinate = signal<number>(50);

  /** Indica si el usuario ya vio y cerró la recompensa final */
  private readonly _rewardAcknowledged = signal<boolean>(false);

  /** Set de tipos de eventos (objetivos) completados */
  private readonly _completedIds = signal<Set<AppEventType>>(new Set());

  /** Indica si el modo juego está activo */
  private readonly _isActive = signal<boolean>(false);
  private readonly _currentMessage = signal<string | null>(null);
  /** Indica si el usuario ha solicitado abrir el overlay de recompensa */
  private readonly _showRewardOverlay = signal<boolean>(false);

  /** Indica si la gamificación está habilitada globalmente */
  public readonly isEnabled = signal(environment.enableGamification).asReadonly();

  /** Totales estáticos para cálculos */
  private readonly totalViewer = Object.values(EASTER_EGG_MISSIONS).filter(m => m.role === 'viewer').length;
  private readonly totalAdmin = Object.values(EASTER_EGG_MISSIONS).filter(m => m.role === 'admin').length;

  /** Lista de objetivos filtrada por el rol del usuario y enriquecida con estado de completitud */
  public readonly objectives = computed<GameObjective[]>(() => {
    const role = this.session.user()?.role || 'viewer';
    const completed = this._completedIds();

    return Object.entries(EASTER_EGG_MISSIONS)
      .map(([type, config]) => ({
        ...config,
        eventType: type as AppEventType,
        isCompleted: completed.has(type as AppEventType)
      }))
      .filter(o => role === 'admin' || o.role === 'viewer');
  });

  /** Indica cuántos objetivos viewer se han completado */
  private readonly completedViewerCount = computed(() => {
    const completed = this._completedIds();
    return Array.from(completed).filter(type => EASTER_EGG_MISSIONS[type]?.role === 'viewer').length;
  });

  /** Indica si todos los objetivos de rol 'viewer' han sido completados */
  public readonly viewerPhaseCompleted = computed(() => this.completedViewerCount() === this.totalViewer);

  /** Indica si el modo juego está activo */
  public readonly isActive = this._isActive.asReadonly();
  /** Mensaje actual del personaje (pistas o saludos) */
  public readonly currentMessage = this._currentMessage.asReadonly();

  /** Indica si estamos en el Home (donde aparece el anciano) */
  public readonly isHome = computed(() => this._currentPath() === '/' || this._currentPath() === '/home');
  /** Estado de aparición (asomado, oculto, etc) */
  public readonly peekState = this._peekState.asReadonly();
  /** Posición de la arista por donde se asoma */
  public readonly peekPosition = this._peekPosition.asReadonly();
  /** Coordenada relativa (0-100) en la arista */
  public readonly peekCoordinate = this._peekCoordinate.asReadonly();

  /** Indica si se debe mostrar el overlay de recompensa final */
  public readonly isFinished = computed(() => this._showRewardOverlay() && !this._rewardAcknowledged());

  /** Estado global derivado */
  public readonly gameState = computed<GameState>(() => {
    const list = this.objectives();
    const completed = list.filter(o => o.isCompleted).length;
    const total = list.length;

    return {
      isActive: this._isActive(),
      isFinished: total > 0 && completed === total,
      completedCount: completed,
      totalCount: total
    };
  });

  // --- Timers ---
  private hintTimer?: ReturnType<typeof setTimeout>;
  private peekTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (!this.isEnabled()) return;

    this.setupEventListeners();
    this.loadProgress();
    this.initPathTracking();
    this.startPeekCycle();

    if (this._isActive()) {
      this.resetHintTimer();
    }

    // Prevención de fugas de memoria
    this.destroyRef.onDestroy(() => {
      this.clearHintTimer();
      if (this.peekTimer) clearTimeout(this.peekTimer);
    });
  }

  private initPathTracking(): void {
    this._currentPath.set(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(url => {
      this._currentPath.set(url);

      if (!this.isHome()) {
        if (this.peekTimer) clearTimeout(this.peekTimer);
        if (!this._isActive()) {
          this._peekState.set('hidden');
        }
      } else if (!this._isActive()) {
        this.startPeekCycle();
      }
    });
  }

  startNarrative(): void {
    this.stopPeekCycle();
    this._peekState.set('active');
    this._currentMessage.set(EASTER_EGG_NARRATIVE.INTRO);
  }

  confirmMission(): void {
    this._isActive.set(true);
    const msg = EASTER_EGG_NARRATIVE.MISSION_CONFIRMED;
    this._currentMessage.set(msg);

    setTimeout(() => {
      if (this._currentMessage() === msg) this.clearMessage();
    }, 4000);

    this.resetHintTimer();
    this.saveProgress();
  }

  resetGame(): void {
    this._isActive.set(false);
    this._peekState.set('hidden');
    this._currentMessage.set(null);
    this._rewardAcknowledged.set(false);
    this._showRewardOverlay.set(false);
    this._completedIds.set(new Set());

    localStorage.removeItem(STORAGE_KEY);
    this.saveProgress();
    this.startPeekCycle();
  }

  stopGame(): void {
    if (this._isActive()) {
      this._peekState.set('minimized');
      this._currentMessage.set(null);
    } else {
      this._peekState.set('hidden');
      this._currentMessage.set(null);
      this.startPeekCycle();
    }
    this.clearHintTimer();
    this.saveProgress();
  }

  clearMessage(): void {
    this._currentMessage.set(null);
  }

  restoreGame(): void {
    this._peekState.set('active');
    this.resetHintTimer();
  }

  finishGame(): void {
    this._rewardAcknowledged.set(true);
    this._showRewardOverlay.set(false);
    this._peekState.set('minimized');
    this.clearHintTimer();
    this.saveProgress();
  }

  openReward(): void {
    if (this.gameState().isFinished) {
      this._showRewardOverlay.set(true);
    }
  }

  reopenReward(): void {
    this._rewardAcknowledged.set(false);
    this._showRewardOverlay.set(true);
    this._peekState.set('active');
    this.saveProgress();
  }

  private setupEventListeners(): void {
    // Escuchamos todos los eventos definidos en el diccionario
    Object.keys(EASTER_EGG_MISSIONS).forEach(typeStr => {
      const type = typeStr as AppEventType;
      this.eventBus.on(type).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(event => {
        // Validación especial para Modo Edición
        if (type === AppEventType.EDIT_MODE_TOGGLED) {
          const payload = event.payload as { enabled: boolean };
          if (payload?.enabled === true) {
            this.completeObjective(type);
          }
          return;
        }

        this.completeObjective(type);
      });
    });
  }

  /**
   * [DEBUG] Completa objetivos de nivel Viewer menos el último.
   */
  public debugCompleteViewer(): void {
    if (!isDevMode()) return;

    const viewers = Object.entries(EASTER_EGG_MISSIONS)
      .filter(([_, m]) => m.role === 'viewer')
      .map(([type]) => type as AppEventType);

    if (viewers.length === 0) return;

    const lastEvent = viewers[viewers.length - 1];
    const toComplete = viewers.filter(t => t !== lastEvent);

    this._completedIds.update(set => new Set([...set, ...toComplete]));
    this.saveProgress();
    this._currentMessage.set(EASTER_EGG_NARRATIVE.DEBUG.VIEWER_NEAR_COMPLETE);
  }

  /**
   * [DEBUG] Completa objetivos de nivel Admin menos el último.
   */
  public debugCompleteAdmin(): void {
    if (!isDevMode()) return;

    const admins = Object.entries(EASTER_EGG_MISSIONS)
      .filter(([_, m]) => m.role === 'admin')
      .map(([type]) => type as AppEventType);

    if (admins.length === 0) return;

    const lastEvent = admins[admins.length - 1];
    const toComplete = admins.filter(t => t !== lastEvent);

    this._completedIds.update(set => new Set([...set, ...toComplete]));
    this.saveProgress();
    this._currentMessage.set(EASTER_EGG_NARRATIVE.DEBUG.ADMIN_NEAR_COMPLETE);
  }

  /**
   * Marca un objetivo como completado basándose en el tipo de evento. O(1).
   */
  private completeObjective(eventType: AppEventType): void {
    if (!this._isActive()) return;

    const config = EASTER_EGG_MISSIONS[eventType];
    if (!config) {
      return;
    }

    if (this._completedIds().has(eventType)) {
      return;
    }

    // --- BLOQUEO JERÁRQUICO ESTRICTO ---
    if (config.role === 'admin' && !this.viewerPhaseCompleted()) {
      return;
    }

    if (config.role === 'admin' && config.id !== 'v5') {
      if (!this._completedIds().has(AppEventType.EDIT_MODE_TOGGLED)) {
        return;
      }
    }

    // Marcar como completado
    this._completedIds.update(set => {
      const next = new Set(set);
      next.add(eventType);
      return next;
    });

    // --- GESTIÓN DE HITOS NARRATIVOS ---
    if (config.role === 'viewer' && this.viewerPhaseCompleted()) {
      const explorerMsg = EASTER_EGG_NARRATIVE.PHASE_EXPLORER_COMPLETED;
      this._currentMessage.set(explorerMsg);
      this.editModeService.disableEditMode();
      setTimeout(() => { if (this._currentMessage() === explorerMsg) this.clearMessage(); }, 8000);
    }
    else if (config.id === 'v5') {
      const guardianMsg = EASTER_EGG_NARRATIVE.PHASE_GUARDIAN_UNLOCKED;
      this._currentMessage.set(guardianMsg);
      setTimeout(() => { if (this._currentMessage() === guardianMsg) this.clearMessage(); }, 8000);
    }
    else {
      const successMsg = EASTER_EGG_NARRATIVE.OBJECTIVE_SUCCESS(config.description);
      this._currentMessage.set(successMsg);
      setTimeout(() => { if (this._currentMessage() === successMsg) this.clearMessage(); }, 7000);
    }

    this.saveProgress();

    if (this.gameState().isFinished) {
      const finalMsg = EASTER_EGG_NARRATIVE.GAME_FINISHED;
      this._currentMessage.set(finalMsg);
    }
  }

  private saveProgress(): void {
    const data = {
      completedIds: Array.from(this._completedIds()),
      isActive: this._isActive(),
      rewardAcknowledged: this._rewardAcknowledged()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private loadProgress(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      this._isActive.set(!!data.isActive);
      this._rewardAcknowledged.set(!!data.rewardAcknowledged);

      if (data.completedIds) {
        this._completedIds.set(new Set(data.completedIds));
      }

      if (this._isActive()) {
        this._peekState.set('minimized');
        setTimeout(() => this.resetHintTimer(), 1000);
      }
    } catch (e) {
      console.error('Error cargando progreso:', e);
    }
  }

  private resetHintTimer(): void {
    this.clearHintTimer();
    if (this._isActive() && !this.gameState().isFinished) {
      this.hintTimer = setTimeout(() => {
        if (!this._currentMessage()) this.showNextHint();
        else this.resetHintTimer();
      }, IDLE_HINT_TIMEOUT_MS);
    }
  }

  private clearHintTimer(): void {
    if (this.hintTimer) clearTimeout(this.hintTimer);
  }

  public showNextHint(): void {
    const pending = this.objectives().filter(o => !o.isCompleted);
    if (pending.length === 0) return;

    const pendingViewers = pending.filter(o => o.role === 'viewer');
    let eligibleHints: GameObjective[] = [];

    if (pendingViewers.length > 0) {
      eligibleHints = pendingViewers;
    } else if (this.viewerPhaseCompleted()) {
      eligibleHints = pending.filter(o => o.role === 'admin');
    }

    if (eligibleHints.length > 0) {
      const randomObj = eligibleHints[Math.floor(Math.random() * eligibleHints.length)];
      const hintMsg = `${EASTER_EGG_NARRATIVE.HINT_PREFIX}${randomObj.hint}`;
      this._currentMessage.set(hintMsg);

      if (this._peekState() === 'minimized') {
        setTimeout(() => { if (this._currentMessage() === hintMsg) this.clearMessage(); }, 8000);
      }
    }
  }

  private startPeekCycle(): void {
    this.stopPeekCycle();
    if (!this.isHome() || this._isActive()) return;

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 4000) + 1000;
      this.peekTimer = setTimeout(() => {
        if (this._isActive()) return;
        const positions: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
        this._peekPosition.set(positions[Math.floor(Math.random() * positions.length)]);
        this._peekCoordinate.set(Math.floor(Math.random() * 60) + 20);
        this._peekState.set('peeking');
        setTimeout(() => {
          if (this._peekState() === 'peeking') {
            this._peekState.set('hidden');
            scheduleNext();
          }
        }, 4000);
      }, delay);
    };
    scheduleNext();
  }

  private stopPeekCycle(): void {
    if (this.peekTimer) clearTimeout(this.peekTimer);
    if (!this._isActive()) this._peekState.set('hidden');
  }
}
