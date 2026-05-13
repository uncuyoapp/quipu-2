import { Component, OnInit, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DimensionSelectComponent } from '@components/dimension-select/dimension-select.component';
import { DatasetInfo } from '@core/data/data.provider';
import { AppEventType } from '@core/models/events/app-event.types';
import { VisualizationFactory } from '@pages/visualization/visualization.factory';
import { AppEventBusService, VisualizationStateService } from '@services';
import {
    Dataset,
    Dimension,
    FiltersConfig
} from '@uncuyoapp/ngx-data-visualizer';

export interface DataConfigResult {
    dataset: Dataset;
    baseFilters: FiltersConfig;
}

@Component({
    selector: 'app-data-filter-step',
    standalone: true,
    imports: [
        DimensionSelectComponent
    ],
    templateUrl: './step2-data-filter.component.html',
    styleUrl: './step2-data-filter.component.scss'
})
/**
 * @class DataFilterStepComponent
 * @description
 * Segundo paso del wizard de creación de visualizaciones.
 * Permite al usuario aplicar filtros de dimensiones (corte físico) sobre el dataset 
 * seleccionado, previsualizando los datos en tiempo real antes de generar la visualización.
 */
export class DataFilterStepComponent implements OnInit {
    /** Información técnica del dataset seleccionado en el paso 1. */
    datasetInfo = input.required<DatasetInfo>();

    /** Emite el dataset procesado y los filtros aplicados cuando el usuario confirma la selección. */
    configured = output<DataConfigResult>();

    private readonly visualizationState = inject(VisualizationStateService);
    private readonly eventBus = inject(AppEventBusService);

    /** Entidad Dataset cargada y gestionada por la librería ngx-data-visualizer. */
    dataset = signal<Dataset | null>(null);

    /** Lista de dimensiones disponibles para el filtrado. */
    dimensions = signal<Dimension[]>([]);


    /** Datos filtrados actuales del dataset */
    filteredData = computed(() => {
        const ds = this.dataset();
        if (!ds) return [];
        // Forzamos la dependencia de dimensions para que se recalcule al filtrar
        this.dimensions();
        return ds.getCurrentData();
    });

    /** Dimensiones activas (no en roll-up) para las cabeceras de la tabla */
    activeDimensions = computed(() => {
        const ds = this.dataset();
        if (!ds) return [];
        this.dimensions();
        return ds.getActiveDimensions();
    });

    constructor() {
        // Efecto para reaplicar filtros cuando cambian las dimensiones
        effect(() => {
            const ds = this.dataset();
            const dims = this.dimensions();
            if (ds && dims.length > 0) {
                untracked(() => this.applyFilters());
            }
        }, { allowSignalWrites: true });
    }

    ngOnInit() {
        this.loadDataset();
    }

    loadDataset() {
        this.visualizationState.getDataset(this.datasetInfo().id).subscribe({
            next: (ds) => {
                this.dataset.set(ds);
                this.dimensions.set(ds.getAllDimensions());
            },
            error: (error) => {
                console.error('Error loading dataset:', error);
            }
        });
    }

    onDimensionChange(index: number, updatedDimension: Dimension): void {
        this.dimensions.update(dims =>
            dims.map((d, i) =>
                i === index
                    ? {
                        ...updatedDimension,
                        items: updatedDimension.items.map((item) => ({ ...item })),
                    }
                    : {
                        ...d,
                        items: d.items.map((item) => ({ ...item })),
                    }
            )
        );

        this.eventBus.emit({
            type: AppEventType.VISUALIZATION_WIZARD_STEP2_ACTION,
            payload: {
                action: updatedDimension.selected ? 'filter' : 'rollup',
                dimension: updatedDimension.id
            }
        });
    }

    private getCurrentFilters(): FiltersConfig {
        const dimensions = this.dimensions();
        return {
            rollUp: dimensions
                .filter((dimension) => !dimension.selected)
                .map((dimension) => dimension.id),
            filter: dimensions
                .filter((dimension) => dimension.items.some((item) => !item.selected))
                .map((dimension) => ({
                    name: dimension.id,
                    items: dimension.items
                        .filter((item) => item.selected)
                        .map((item) => item.name),
                })),
        };
    }

    private applyFilters() {
        const filters = this.getCurrentFilters();
        this.dataset()?.applyFilters(filters);
    }

    onNext() {
        const ds = this.dataset();
        if (ds) {
            const filters = this.getCurrentFilters();
            // Creamos el "corte físico" del dataset para la previsualización
            const shrunkDataset = VisualizationFactory.transformDataset(ds, filters);

            this.configured.emit({
                dataset: shrunkDataset,
                baseFilters: filters
            });
        }
    }
}
