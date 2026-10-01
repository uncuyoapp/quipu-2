import { Injectable, computed, inject, signal } from '@angular/core';
import { IAuthProvider } from '@core/data/auth.provider';
import { IDataProvider } from '@core/data/data.provider';
import { InformationUnit } from '@models/domain/information-unit.model';
import { User } from '@models/domain/user.model';

/**
 * Servicio de solo lectura para el estado de la sesión de usuario.
 * Proporciona signals reactivos para el usuario autenticado, el token de acceso y la unidad activa.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionStateService {
  private readonly authProvider = inject(IAuthProvider);
  private readonly dataProvider = inject(IDataProvider);

  /** Signal privado mutable — solo modificable vía _patchUser() y _clearUser(). */
  private readonly _user = signal<User | null>(null);

  /** Signal privado con todas las unidades de información disponibles. */
  private readonly _allInformationUnits = signal<InformationUnit[]>([]);

  /** Signal de solo lectura con todas las unidades de información disponibles. */
  public readonly allInformationUnits = this._allInformationUnits.asReadonly();

  /** Signal de solo lectura con los datos del usuario actual. */
  public readonly user = this._user.asReadonly();

  /** Signal computado que indica si un usuario está autenticado actualmente. */
  public readonly isAuthenticated = computed(() => this.user() !== null);

  /** Signal computado con el token JWT actual del usuario. */
  public readonly token = computed(() => this.user()?.token ?? null);

  /** Signal computado con el ID de la Unidad de Información activa. */
  public readonly selectedIUId = computed(() => this.user()?.selectedIU ?? null);

  /** Signal computado que devuelve la Unidad de Información seleccionada actualmente para el usuario. */
  public currentInformationUnit = computed(() =>
    this.allInformationUnits().find(
      (unit) => unit.id === this.user()?.selectedIU
    ) ?? null
  );

  /** Signal computado que devuelve las Unidades de Información a las que el usuario tiene acceso. */
  public userInformationUnits = computed(() => {
    const userUnitsIds = this.user()?.informationUnits ?? [];
    return this.allInformationUnits().filter((unit) =>
      userUnitsIds.includes(unit.id)
    );
  });

  constructor() {
    this.initializeSession();
  }

  /**
   * Verifica si existe un usuario almacenado en el localStorage y si tiene un token válido.
   */
  public hasValidSession(): boolean {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return false;

    try {
      const user: User = JSON.parse(storedUser);
      return !!(user?.token && user?.selectedIU);
    } catch {
      this._clearUser();
      return false;
    }
  }

  /**
   * Obtiene el ID de la Unidad de Información seleccionada actualmente.
   */
  get selectedIU(): number | null {
    return this.user()?.selectedIU ?? null;
  }

  /**
   * Actualiza internamente el estado del usuario (usado por SessionPersistenceService).
   */
  _patchUser(user: User): void {
    this._user.set({ ...user });
    if (this.allInformationUnits().length === 0) {
      this.loadAllInformationUnits();
    }
  }

  /**
   * Limpia internamente el estado del usuario (usado por SessionPersistenceService).
   */
  _clearUser(): void {
    this._user.set(null);
  }

  /**
   * Inicializa la sesión al arrancar la aplicación.
   * Si existe un usuario en localStorage, valida su vigencia.
   * Si no existe usuario en localStorage, intenta auto-hidratar la sesión
   * mediante la cookie central de SSO (quipu_sso).
   */
  private initializeSession(): void {
    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);

        if (user?.token) {
          this._user.set(user);
          queueMicrotask(() => {
            this.loadAllInformationUnits();
            this.validateSession(user);
          });
        } else {
          this._clearUser();
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this._clearUser();
      }
    } else {
      queueMicrotask(() => {
        this.attemptSsoHydration();
      });
    }
  }

  /**
   * Consulta silenciosamente si el usuario tiene una sesión SSO abierta en backend.
   */
  private attemptSsoHydration(): void {
    this.authProvider.checkSsoSession().subscribe({
      next: (ssoUser) => {
        if (ssoUser) {
          localStorage.setItem('currentUser', JSON.stringify(ssoUser));
          this._patchUser(ssoUser);
          this.loadAllInformationUnits();
        }
      },
      error: () => {
        // Silencioso por diseño: el usuario es un visitante anónimo
      },
    });
  }

  /**
   * Valida la sesión actual contra la API del servidor.
   */
  private validateSession(storedUser: User): void {
    this.authProvider.getCurrentUser().subscribe({
      next: (serverUser) => {
        if (serverUser) {
          if (serverUser.id !== storedUser.id) {
            localStorage.removeItem('currentUser');
            this._clearUser();
            return;
          }

          const mergedUser: User = {
            ...serverUser,
            token: storedUser.token,
            selectedIU: storedUser.selectedIU,
          };
          this._patchUser(mergedUser);
        } else {
          localStorage.removeItem('currentUser');
          this._clearUser();
        }
      },
      error: (error) => {
        console.error('Session validation failed:', error);
        localStorage.removeItem('currentUser');
        this._clearUser();
      },
    });
  }

  /**
   * Carga todas las unidades de información desde el proveedor.
   */
  private loadAllInformationUnits(): void {
    this.dataProvider.getInformationUnits().subscribe({
      next: (units) => this._allInformationUnits.set(units),
      error: (error) => console.error('Error loading information units:', error),
    });
  }
}
