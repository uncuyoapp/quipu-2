import { Injectable, computed, inject, signal } from '@angular/core';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { SessionStateService } from '../state/session-state.service';

/**
 * Servicio encargado de gestionar el estado del "Modo de Edición" en toda la aplicación.
 * Permite habilitar o deshabilitar la edición de componentes si el usuario tiene los permisos adecuados.
 */
@Injectable({
  providedIn: 'root'
})
export class EditModeService {
  private readonly sessionState = inject(SessionStateService);
  private readonly eventBus = inject(AppEventBusService);
  private readonly storageKey = 'editModeEnabled';
  private readonly visibilityStorageKey = 'editModeBarVisible';

  /** Signal privado que mantiene el estado actual del modo de edición. */
  private _isEditModeEnabled = signal<boolean>(false);

  /** Signal privado que mantiene la visibilidad de la barra de edición. */
  private _isBarVisible = signal<boolean>(true);

  /** Signal que lleva el conteo de modales que solicitan ocultar la barra. */
  private _hidingModalsCount = signal<number>(0);

  /** Signal de solo lectura para el estado de edición. */
  public isEditModeEnabled = computed(() => this._isEditModeEnabled() && this.canEdit());

  /** Signal de solo lectura para la visibilidad de la barra. */
  public isBarVisible = this._isBarVisible.asReadonly();

  /** Signal computado que indica si la barra debe estar oculta temporalmente por un modal. */
  public isTemporarilyHidden = computed(() => this._hidingModalsCount() > 0);

  constructor() {
    this.initializeState();
  }

  /**
   * Inicializa el estado del servicio cargando las preferencias guardadas
   * de 'Modo Edición' y visibilidad de la barra desde el almacenamiento local.
   * @private
   */
  private initializeState(): void {
    // Cargar estado de edición
    const savedEditMode = localStorage.getItem(this.storageKey);
    if (savedEditMode !== null) {
      this._isEditModeEnabled.set(savedEditMode === 'true');
    }

    // Cargar estado de visibilidad de la barra
    const savedVisibility = localStorage.getItem(this.visibilityStorageKey);
    if (savedVisibility !== null) {
      this._isBarVisible.set(savedVisibility === 'true');
    }
  }

  /**
   * Guarda el estado del modo de edición en el almacenamiento local.
   */
  private saveState(state: boolean): void {
    localStorage.setItem(this.storageKey, String(state));
  }

  /**
   * Guarda el estado de visibilidad de la barra en el almacenamiento local.
   */
  private saveVisibilityState(state: boolean): void {
    localStorage.setItem(this.visibilityStorageKey, String(state));
  }

  /** 
   * Signal computado que verifica si el usuario actual tiene permisos para usar el modo de edición.
   * Los roles 'admin' y 'editor' cuentan con permisos de edición.
   */
  public canEdit = computed(() => {
    const user = this.sessionState.user();
    return user?.role === 'admin' || user?.role === 'editor';
  });

  /**
   * Alterna el estado actual del modo de edición, siempre y cuando el usuario tenga permisos.
   */
  public toggleEditMode(): void {
    if (this.canEdit()) {
      this._isEditModeEnabled.update(state => {
        const newState = !state;
        this.saveState(newState);
        this.eventBus.emit({ type: AppEventType.EDIT_MODE_TOGGLED, payload: { enabled: newState } });
        return newState;
      });
    }
  }

  /**
   * Activa explícitamente el modo de edición si el usuario tiene permisos.
   */
  public enableEditMode(): void {
    if (this.canEdit()) {
      this._isEditModeEnabled.set(true);
      this.saveState(true);
      this.eventBus.emit({ type: AppEventType.EDIT_MODE_TOGGLED, payload: { enabled: true } });
    }
  }

  /**
   * Desactiva explícitamente el modo de edición.
   */
  public disableEditMode(): void {
    this._isEditModeEnabled.set(false);
    this.saveState(false);
    this.eventBus.emit({ type: AppEventType.EDIT_MODE_TOGGLED, payload: { enabled: false } });
  }

  /**
   * Establece explícitamente el estado del modo de edición.
   */
  public setEditMode(enabled: boolean): void {
    if (this.canEdit()) {
      this._isEditModeEnabled.set(enabled);
      this.saveState(enabled);
      this.eventBus.emit({ type: AppEventType.EDIT_MODE_TOGGLED, payload: { enabled } });
    }
  }

  /**
   * Cambia la visibilidad de la barra de edición.
   */
  public setBarVisibility(visible: boolean): void {
    this._isBarVisible.set(visible);
    this.saveVisibilityState(visible);
    this.eventBus.emit({ type: AppEventType.EDIT_BAR_TOGGLED, payload: { visible } });
  }

  /**
   * Alterna la visibilidad de la barra de edición.
   */
  public toggleBarVisibility(): void {
    this._isBarVisible.update(visible => {
      const newState = !visible;
      this.saveVisibilityState(newState);
      this.eventBus.emit({ type: AppEventType.EDIT_BAR_TOGGLED, payload: { visible: newState } });
      return newState;
    });
  }

  /**
   * Incrementa el contador de modales que ocultan la barra.
   */
  public registerHidingModal(): void {
    this._hidingModalsCount.update(count => count + 1);
  }

  /**
   * Decrementa el contador de modales que ocultan la barra.
   */
  public unregisterHidingModal(): void {
    this._hidingModalsCount.update(count => Math.max(0, count - 1));
  }
}
