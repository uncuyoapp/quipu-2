import { Injectable, computed, inject, signal } from '@angular/core';
import { InformationUnit } from '@models/domain/information-unit.model';
import { User } from '@models/domain/user.model';
import { DataReadService } from '../infrastructure/data-read.service';
import { DataWriteService } from '../infrastructure/data-write.service';


/**
 * Servicio de solo lectura para el estado de la sesión de usuario.
 * Proporciona signals reactivos para el usuario autenticado y la unidad de información activa.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionStateService {
  private readonly dataRead = inject(DataReadService);
  private readonly dataWrite = inject(DataWriteService);

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
   * @private (Uso interno tri-capa)
   */
  _patchUser(user: User): void {
    this._user.set({ ...user });
    if (this.allInformationUnits().length === 0) {
      this.loadAllInformationUnits();
    }
  }

  /**
   * Limpia internamente el estado del usuario (usado por SessionPersistenceService).
   * @private (Uso interno tri-capa)
   */
  _clearUser(): void {
    this._user.set(null);
  }

  /**
   * Inicializa la sesión al arrancar la aplicación leyendo desde localStorage.
   */
  private initializeSession(): void {
    const storedUser = localStorage.getItem('currentUser');

    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);

        if (user?.token) {
          this.dataWrite.setAuthToken(user.token);

          this.dataRead.initializeFromStoredData({
            token: user.token,
            selectedIU: user.selectedIU ?? undefined
          });


          this._user.set(user);
          this.loadAllInformationUnits();
          this.validateSession(user);
        } else {
          this._clearUser();
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this._clearUser();
      }
    }
  }

  /**
   * Valida la sesión actual contra la API del servidor.
   */
  private validateSession(storedUser: User): void {
    this.dataRead.getCurrentUser().subscribe({
      next: (serverUser) => {
        if (serverUser) {
          const mergedUser: User = {
            ...serverUser,
            selectedIU: storedUser.selectedIU,
          };
          this._patchUser(mergedUser);
        } else {
          this._clearUser();
        }
      },
      error: (error) => {
        console.error('Session validation failed:', error);
        this._clearUser();
      },
    });
  }

  /**
   * Carga todas las unidades de información desde el proveedor.
   */
  private loadAllInformationUnits(): void {
    this.dataRead.getInformationUnits().subscribe({
      next: (units) => this._allInformationUnits.set(units),
      error: (error) => console.error('Error loading information units:', error),
    });
  }
}
