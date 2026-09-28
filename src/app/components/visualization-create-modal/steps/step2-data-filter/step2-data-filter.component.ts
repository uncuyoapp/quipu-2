import { Component, DestroyRef, OnInit, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DimensionSelectComponent } from '@components/dimension-select/dimension-select.component';
import { AppEventType } from '@core/models/events/app-event.types';
import { Dataset, DatasetInfo, Dimension } from '@models/domain/dataset.model';
import { FiltersConfig } from '@models/domain/visualization.model';
import { VisualizationFactory } from '@pages/visualization/visualization.factory';
import { AppEventBusService, VisualizationStateService } from '@services';

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
    private readonly destroyRef = inject(DestroyRef);

    /** Entidad Dataset cargada y gestionada por la librería ngx-data-visualizer. */
    dataset = signal<Dataset | null>(null);

    /** Lista de dimensiones disponibles para el filtrado. */
    dimensions = signal<Dimension[]>([]);

    /** Señal de versión para sincronizar reactivamente las mutaciones internas del Dataset con Signals. */
    private readonly dataVersion = signal<number>(0);

    /** Datos filtrados actuales del dataset */
    filteredData = computed(() => {
        const ds = this.dataset();
        this.dataVersion();
        if (!ds) return [];
        return ds.getCurrentData();
    });

    /** Dimensiones activas (no en roll-up) para las cabeceras de la tabla */
    activeDimensions = computed(() => {
        const ds = this.dataset();
        this.dataVersion();
        if (!ds) return [];
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
                this.dimensions.set(VisualizationFactory.normalizeDimensions(ds.getAllDimensions()));
                this.listenDatasetUpdates(ds);
            },
            error: (error) => {
                console.error('Error loading dataset:', error);
            }
        });
    }

    private listenDatasetUpdates(ds: Dataset): void {
        ds.dataUpdated.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.dataVersion.update(v => v + 1);
        });
    }

    onDimensionChange(index: number, updatedDimension: Dimension): void {
        this.dimensions.update(dims =>
            dims.map((d, i) => (i === index ? updatedDimension : d))
        );

        this.eventBus.emit({
            type: AppEventType.VISUALIZATION_WIZARD_STEP2_ACTION,
            payload: {
                action: updatedDimension.selected ? 'filter' : 'rollup',
                dimension: updatedDimension.id
            }
        });
    }

    /**
     * Resuelve el valor textual de una dimensión en una fila dada,
     * utilizando la clave mapeada internamente por Dataset con fallbacks resilientes.
     */
    getDimensionValue(row: Record<string, any>, dim: Dimension): any {
        const key = this.dataset()?.getDimensionKey(dim.id) ?? dim.nameView ?? dim.name;
        return row[key] ?? row[dim.nameView] ?? row[dim.name] ?? '';
    }

    private getCurrentFilters(): FiltersConfig {
        return VisualizationFactory.getFiltersFromDimensions(this.dimensions());
    }

    private applyFilters() {
        const filters = this.getCurrentFilters();
        this.dataset()?.applyFilters(filters);
        this.dataVersion.update(v => v + 1);
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

