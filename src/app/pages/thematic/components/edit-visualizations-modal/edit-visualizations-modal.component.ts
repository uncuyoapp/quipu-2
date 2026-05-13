import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { VisualizationGridEditService } from '@components/visualization-grid/visualization-grid-edit.service';
import { VisualizationGridComponent } from '@components/visualization-grid/visualization-grid.component';
import { APP_ICONS } from '@core/config/icons.config';
import { ThematicFactory } from '@core/factories/thematic.factory';
import { AppEventType } from '@core/models/events/app-event.types';


import { Thematic } from '@models/domain/thematic.model';
import { Visualization, VisualizationFilter, VisualizationOrder } from '@models/domain/visualization.model';
import { NgIconComponent } from '@ng-icons/core';
import { AppDialogService, AppEventBusService, EditModeService, ThematicStateService, VisualizationStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { OrientationWarningComponent } from '@shared/components/orientation-warning/orientation-warning.component';
import { TagComponent } from '@shared/components/tag/tag.component';

export interface EditVisualizationsModalData {
    thematic: Thematic;
    associatedVisualizations: Visualization[];
}

/**
 * @class EditVisualizationsModalComponent
 * @description
 * Modal para gestionar las visualizaciones asociadas a una temática.
 * Muestra una grilla con todas las visualizaciones del sistema y permite
 * marcarlas/desmarcarlas para actualizar la asociación.
 */
@Component({
    selector: 'app-edit-visualizations-modal',
    standalone: true,
    providers: [VisualizationGridEditService],
    imports: [
        MatDialogModule,
        VisualizationGridComponent,
        ButtonComponent,
        NgIconComponent,
        OrientationWarningComponent,
        TagComponent
    ],
    templateUrl: './edit-visualizations-modal.component.html',
    styleUrl: './edit-visualizations-modal.component.scss'
})
export class EditVisualizationsModalComponent implements OnInit, OnDestroy {
    private readonly dialogRef = inject(MatDialogRef<EditVisualizationsModalComponent>);
    public readonly data = inject<EditVisualizationsModalData>(MAT_DIALOG_DATA);
    private readonly visualizationState = inject(VisualizationStateService);
    private readonly thematicState = inject(ThematicStateService);
    private readonly dialogs = inject(AppDialogService);
    public readonly editService = inject(VisualizationGridEditService);
    private readonly editModeService = inject(EditModeService);
    private readonly eventBus = inject(AppEventBusService);

    protected readonly icons = APP_ICONS;

    /** Partes del breadcrumb para mostrar como tags individuales */
    breadcrumbParts = computed(() => {
        return this.data.thematic.breadcrumb.split(' > ');
    });

    /** 
     * Resuelve el color de la temática raíz asociada.
     * Es mandatorio que todos los tags del breadcrumb usen este color para mantener
     * la coherencia visual con la categoría principal (raíz).
     */
    thematicColor = computed(() => {
        const currentId = this.data.thematic.id;
        const allThematics = this.thematicState.thematics();

        // Buscamos la temática raíz que contiene a la temática actual
        const root = allThematics.find(t =>
            t.id === currentId || (t.childrens && ThematicFactory.findRecursively(t.childrens, currentId))
        );

        return root?.color || this.data.thematic.color;
    });

    /** Listado de todas las visualizaciones del sistema */
    allVisualizations = signal<Visualization[]>([]);
    /** Indica si se están cargando los datos */
    loading = signal(true);

    // Estados de la grilla
    filter: VisualizationFilter = {};
    order: VisualizationOrder = 'default';

    /** IDs iniciales para detectar cambios */
    private initialSelectedIds: (number | string)[] = [];

    ngOnInit(): void {
        this.editModeService.registerHidingModal();
        const initialIds = this.data.associatedVisualizations.map(v => v.id!).filter(id => id !== undefined);
        this.initialSelectedIds = [...initialIds];

        this.editService.initialize({
            isSelectable: true,
            initialSelectedIds: initialIds
        });

        this.eventBus.emit({
            type: AppEventType.THEMATIC_ASSOCIATION_OPENED,
            payload: {
                thematicId: this.data.thematic.id,
                thematicName: this.data.thematic.name
            }
        });

        this.loadAllVisualizations();

        // Recargar datos cuando una acción por lote tenga éxito
        this.editService.onActionSuccess.subscribe(() => {
            this.loadAllVisualizations();
        });
    }

    ngOnDestroy(): void {
        this.editModeService.unregisterHidingModal();
    }

    /**
     * Carga todas las visualizaciones disponibles en el sistema.
     */
    loadAllVisualizations(): void {
        this.loading.set(true);
        // Cargamos una "página" grande para el modal (TODO: Implementar scroll infinito si es necesario)
        this.visualizationState.getVisualizationsPage(1, 100).subscribe({
            next: (page) => {
                this.allVisualizations.set(page.items);
                this.loading.set(false);
            },
            error: (error: unknown) => {
                console.error('Error al cargar visualizaciones:', error);
                this.loading.set(false);
            }
        });
    }

    /**
     * Verifica si hay cambios sin guardar.
     */
    hasChanges(): boolean {
        const currentIds = this.editService.selectedIds();
        if (currentIds.length !== this.initialSelectedIds.length) return true;

        const currentSet = new Set(currentIds);
        return !this.initialSelectedIds.every(id => currentSet.has(id));
    }

    /**
     * Guarda los cambios y cierra el modal.
     */
    onSave(): void {
        this.eventBus.emit({
            type: AppEventType.THEMATIC_ASSOCIATION_SAVED,
            payload: {
                thematicId: this.data.thematic.id,
                visualizationsCount: this.editService.selectedIds().length
            }
        });
        this.dialogRef.close(this.editService.selectedIds());
    }

    /**
     * Intenta cerrar el modal, alertando si hay cambios sin guardar.
     */
    onClose(): void {
        if (this.hasChanges()) {
            this.dialogs.confirm({
                title: 'Cambios sin guardar',
                message: '¿Deseas guardar los cambios antes de salir?',
                confirmText: 'Guardar y salir',
                cancelText: 'Salir sin guardar',
                confirmPalette: 'blue'
            }).subscribe(result => {
                if (result === true) {
                    this.onSave();
                } else {
                    // result === false significa que presionó "Salir sin guardar" (botón secundario/cancelar)
                    this.dialogRef.close();
                }
            });
        } else {
            this.dialogRef.close();
        }
    }
}
