import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { ThematicFactory } from '@core/factories/thematic.factory';
import { Thematic } from '@models/domain/thematic.model';
import { Observable, finalize, tap } from 'rxjs';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEventBusService } from '../events/app-event-bus.service';
import { DataReadService } from '../infrastructure/data-read.service';
import { SessionStateService } from './session-state.service';


/**
 * Servicio de solo lectura para la gestión del estado de temáticas.
 * Mantiene el signal store reactivo con el árbol de categorías y subcategorías.
 */
@Injectable({
  providedIn: 'root',
})
export class ThematicStateService {
  private readonly dataRead = inject(DataReadService);
  private readonly sessionState = inject(SessionStateService);
  private readonly eventBus = inject(AppEventBusService);

  /** Almacena el ID de la última Unidad de Información cargada para evitar duplicados en el arranque */
  private lastLoadedIUId: number | null = null;

  /** Signal privado que almacena el árbol completo de temáticas */
  private readonly _thematics = signal<Thematic[]>([]);
  /** Signal público de solo lectura para ser consumido por los componentes */
  readonly thematics = this._thematics.asReadonly();

  /** Signal privado que indica si se están cargando las temáticas */
  private readonly _loading = signal<boolean>(true);
  /** Signal público de solo lectura para el estado de carga */
  readonly loading = this._loading.asReadonly();

  /**
   * Paleta de colores oficial para las temáticas.
   * Los valores se resuelven desde los design tokens CSS (--q-comp-*) para mantener
   * sincronización con el tema activo.
   */
  readonly palette = signal<string[]>(
    this.resolveThematicPalette()
  );

  /** Resuelve la paleta leyendo los tokens CSS de complementarios + primario */
  private resolveThematicPalette(): string[] {
    try {
      if (typeof window === 'undefined' || !document?.documentElement) {
        return ['#ff3e84', '#fab217', '#70cacd', '#2979ff'];
      }
      const root = getComputedStyle(document.documentElement);
      return [
        root.getPropertyValue('--q-comp-1').trim() || '#ff3e84',
        root.getPropertyValue('--q-comp-2').trim() || '#fab217',
        root.getPropertyValue('--q-comp-3').trim() || '#70cacd',
        root.getPropertyValue('--q-primary').trim() || '#2979ff',
      ];
    } catch (e) {
      return ['#ff3e84', '#fab217', '#70cacd', '#2979ff'];
    }
  }

  constructor() {
    /**
     * Reacciona al cambio de unidad de información en la sesión.
     * Al cambiar de unidad, se deben recargar las temáticas desde el proveedor.
     */
    effect(() => {
      const currentIU = this.sessionState.currentInformationUnit();
      const allUnits = this.sessionState.allInformationUnits();
      const isAuthenticated = this.sessionState.isAuthenticated();

      if (currentIU) {
        if (currentIU.id !== this.lastLoadedIUId) {
          untracked(() => {
            this.lastLoadedIUId = currentIU.id;
            this.loadAll().subscribe();
          });
        }
      } else {
        // Sesión cerrada o sin unidad activa
        untracked(() => {
          this.lastLoadedIUId = null;
          this._patchTree(() => []);

          // Solo dejamos de cargar si no estamos autenticados (no habrá unidad)
          // o si ya se cargaron las unidades y ninguna es la actual.
          if (!isAuthenticated || allUnits.length > 0) {
            this._loading.set(false);
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Carga todas las temáticas desde el servidor y las almacena en el signal.
   * @returns Un observable con el listado cargado.
   */
  loadAll(): Observable<Thematic[]> {
    untracked(() => {
      this._loading.set(true);
      this._patchTree(() => []); // Limpiar datos previos inmediatamente
    });
    return this.dataRead.getThematics().pipe(
      tap((thematics) => {
        this.updateLocalTree(() => thematics);
        this.eventBus.emit({ type: AppEventType.THEMATICS_LOADED });
      }),
      finalize(() => this._loading.set(false))
    );
  }

  /**
   * Obtiene una temática por su ID buscando recursivamente en el árbol.
   * @param id ID de la temática a buscar.
   * @returns La temática encontrada o undefined.
   */
  getThematic(id: number): Thematic | undefined {
    return ThematicFactory.findRecursively(this._thematics(), id);
  }

  /**
   * Obtiene la cadena de breadcrumb (ruta completa) de una temática por su ID.
   * @param id ID de la temática.
   * @returns La cadena de breadcrumb o una cadena vacía.
   */
  getBreadcrumb(id: number): string {
    const thematic = this.getThematic(id);
    return thematic?.breadcrumb || '';
  }

  /**
   * Obtiene todos los IDs de las temáticas descendientes de una temática dada (incluyéndola).
   * @param id ID de la temática raíz de la búsqueda.
   * @returns Un arreglo plano con todos los IDs de la rama.
   */
  getDescendantIds(id: number): number[] {
    return ThematicFactory.getDescendantIds(this._thematics(), id);
  }

  /**
   * Actualiza el árbol local de temáticas.
   * Uso exclusivo para sincronización desde la capa de persistencia (ThematicPersistenceService).
   * @param fn Función de transformación del árbol.
   */

  _patchTree(fn: (tree: Thematic[]) => Thematic[]): void {
    this.updateLocalTree(fn);
  }

  /**
   * Actualiza el estado reactivo del árbol aplicando transformaciones y re-asignación de colores.
   * @param fn Función que retorna la nueva versión del árbol.
   */
  private updateLocalTree(fn: (tree: Thematic[]) => Thematic[]): void {
    const rawTree = fn([...this._thematics()]);
    // Aplicar colores de nivel raíz vía Factory
    const coloredTree = ThematicFactory.assignColors(rawTree, this.palette());
    this._thematics.set(coloredTree);
  }

  /**
   * Limpia la caché de datos para forzar una recarga fresca.
   * Se invoca desde AppComponent al detectar cambio de Unidad de Información.
   */
  clearCache(): void {
    this.dataRead.clearCache();
  }
}
