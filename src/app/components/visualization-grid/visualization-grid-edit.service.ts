import { Injectable, inject, signal } from '@angular/core';
import { AppDialogService, VisualizationPersistenceService, VisualizationStateService } from '@services';
import { Subject, of, switchMap, tap } from 'rxjs';

/**
 * @class VisualizationGridEditService
 * @description
 * Servicio especializado para gestionar el estado de selección de visualizaciones
 * dentro de una grilla cuando se encuentra en "modo edición" o "modo selección".
 * Permite realizar un seguimiento de los IDs seleccionados de forma reactiva.
 */
@Injectable()
export class VisualizationGridEditService {
    /** Indica si la grilla permite la selección de elementos */
    public readonly isSelectable = signal<boolean>(false);

    /** Acciones visibles configuradas para la grilla */
    public readonly visibleActions = signal<string[]>([]);

    /** Servicio especializado de diálogos */
    private readonly dialogs = inject(AppDialogService);

    /** Servicio de dominio para realizar las acciones */
    private readonly visualizationState = inject(VisualizationStateService);
    private readonly persistence = inject(VisualizationPersistenceService);

    /** Sujeto interno para emitir eventos de éxito */
    private readonly _onActionSuccess$ = new Subject<void>();

    /** Observable público que emite cuando una acción por lote se ha completado con éxito */
    public readonly onActionSuccess = this._onActionSuccess$.asObservable();

    /** Conjunto de IDs de visualizaciones seleccionadas */
    private readonly _selectedIds = signal<Set<number | string>>(new Set());

    /** Signal público con el listado de IDs seleccionados */
    public readonly selectedIds = signal<(number | string)[]>([]);

    /**
     * Inicializa el servicio con un estado específico.
     * @param config Configuración inicial.
     */
    initialize(config: { isSelectable: boolean; initialSelectedIds?: (number | string)[]; visibleActions?: string[] }): void {
        this.isSelectable.set(config.isSelectable);
        if (config.visibleActions) {
            this.visibleActions.set(config.visibleActions);
        }
        if (config.initialSelectedIds) {
            const set = new Set(config.initialSelectedIds);
            this._selectedIds.set(set);
            this.syncSelectedIds();
        }
    }

    /**
     * Alterna la selección de una visualización.
     * @param id ID de la visualización.
     */
    toggleSelection(id: number | string): void {
        const set = new Set(this._selectedIds());
        if (set.has(id)) {
            set.delete(id);
        } else {
            set.add(id);
        }
        this._selectedIds.set(set);
        this.syncSelectedIds();
    }

    /**
     * Verifica si una visualización está seleccionada.
     * @param id ID de la visualización.
     * @returns Verdadero si está seleccionada.
     */
    isSelected(id: number | string): boolean {
        return this._selectedIds().has(id);
    }

    /**
     * Sincroniza el listado público de IDs seleccionados.
     * @private
     */
    private syncSelectedIds(): void {
        this.selectedIds.set(Array.from(this._selectedIds()));
    }

    /**
     * Selecciona todas las visualizaciones del listado proporcionado.
     * @param ids IDs de las visualizaciones a seleccionar.
     */
    selectAll(ids: (number | string)[]): void {
        const set = new Set(this._selectedIds());
        ids.forEach(id => set.add(id));
        this._selectedIds.set(set);
        this.syncSelectedIds();
    }

    /**
     * Limpia toda la selección actual.
     */
    clearSelection(): void {
        this._selectedIds.set(new Set());
        this.syncSelectedIds();
    }

    /**
     * Publica las visualizaciones seleccionadas.
     */
    publish(): void {
        const ids = this.selectedIds();
        if (ids.length === 0) return;

        this.persistence.publish(ids).pipe(
            tap(() => {
                this.clearSelection();
                this._onActionSuccess$.next();
            }),
        ).subscribe();
    }

    /**
     * Despublica las visualizaciones seleccionadas.
     */
    unpublish(): void {
        const ids = this.selectedIds();
        if (ids.length === 0) return;

        this.persistence.unpublish(ids).pipe(
            tap(() => {
                this.clearSelection();
                this._onActionSuccess$.next();
            }),
        ).subscribe();
    }

    deleteSelection(): void {
        const ids = this.selectedIds();
        if (ids.length === 0) return;

        this.dialogs.confirm({
            title: 'Eliminar visualizaciones',
            message: `¿Estás seguro de que deseas eliminar las ${ids.length} visualizaciones seleccionadas? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            confirmPalette: 'red'
        }).pipe(
            switchMap(confirmed => confirmed
                ? this.persistence.delete(ids)
                : of(false)
            ),
            tap(success => {
                if (success) {
                    this.clearSelection();
                    this._onActionSuccess$.next();
                }
            })
        ).subscribe();
    }


    /**
     * Notifica que una acción externa se ha realizado con éxito.
     */
    notifyActionSuccess(): void {
        this._onActionSuccess$.next();
    }
}
