import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { DatasetInfo } from '@core/data/data.provider';
import { AppEventType } from '@core/models/events/app-event.types';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService, DataReadService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TagComponent } from '@shared/components/tag/tag.component';

/** Interfaz para los filtros de las columnas de datasets */
interface DatasetColumnFilters {
    id: string;
    name: string;
    isPercentage: 'all' | 'true' | 'false';
    unit: string;
    dimensions: string[];
    periodicity: string;
    temporal: string;
}

@Component({
    selector: 'app-step1-dataset-selection',
    standalone: true,
    imports: [TagComponent, ButtonComponent, FormsModule, NgIconComponent],
    templateUrl: './step1-dataset-selection.component.html',
    styleUrl: './step1-dataset-selection.component.scss'
})
/**
 * @class Step1DatasetSelectionComponent
 * @description
 * Primer paso del wizard de creación de visualizaciones. 
 * Permite al usuario buscar y seleccionar un dataset de la lista disponible,
 * aplicando filtros por columna y paginación.
 */
export class Step1DatasetSelectionComponent implements OnInit {
    private readonly dataRead = inject(DataReadService);
    private readonly eventBus = inject(AppEventBusService);

    protected readonly icons = APP_ICONS;

    /** Lista completa de datasets obtenidos del servidor. */
    datasets = signal<DatasetInfo[]>([]);

    /** Controla la visibilidad del desplegable de filtro de dimensiones. */
    showDimFilter = signal<boolean>(false);

    /** Estado de los filtros aplicados a cada columna de la tabla. */
    columnFilters = signal<DatasetColumnFilters>({
        id: '',
        name: '',
        isPercentage: 'all',
        unit: '',
        dimensions: [],
        periodicity: '',
        temporal: ''
    });

    /** Página actual de la tabla paginada. */
    currentPage = signal<number>(1);

    /** Cantidad de registros por página. */
    pageSize = signal<number>(20);

    /** Dataset seleccionado actualmente en la tabla (sin confirmar). */
    selectedDataset = signal<DatasetInfo | null>(null);

    /** Emisión de evento cuando se confirma la selección para avanzar al paso 2. */
    datasetSelected = output<DatasetInfo>();

    /**
     * Disponibilidad de dimensiones únicas para el selector
     */
    availableDimensions = computed(() => {
        const allDims = this.datasets().flatMap(ds => ds.dimensions);
        return [...new Set(allDims)].sort();
    });

    /**
     * Datasets filtrados por cada columna
     */
    filteredDatasets = computed(() => {
        const data = this.datasets();
        const filters = this.columnFilters();

        return data.filter(ds => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return true;

                // Filtrado por Porcentaje (Booleano)
                if (key === 'isPercentage') {
                    if (value === 'all') return true;
                    return ds.isPercentage === (value === 'true');
                }

                // Filtrado por Dimensiones (Multi-select)
                if (key === 'dimensions' && Array.isArray(value)) {
                    return value.every(v => ds.dimensions.includes(v));
                }

                // Filtrado por Temporal (Año en rango)
                if (key === 'temporal' && value) {
                    const searchYear = parseInt(value);
                    if (isNaN(searchYear)) return true;

                    // Extraer años del string "2014 - 2016" o "2025"
                    const years = ds.temporal.match(/\d{4}/g);
                    if (!years) return false;

                    const dsFrom = parseInt(years[0]);
                    const dsTo = years.length > 1 ? parseInt(years[1]) : dsFrom;

                    return searchYear >= dsFrom && searchYear <= dsTo;
                }

                const fieldValue = this.getFieldValue(ds, key);
                const normalizedValue = this.normalize(value.toString());
                const normalizedField = this.normalize(fieldValue);

                return normalizedField.includes(normalizedValue);
            });
        });
    });

    /**
     * Datasets de la página actual
     */
    paginatedDatasets = computed(() => {
        const data = this.filteredDatasets();
        const start = (this.currentPage() - 1) * this.pageSize();
        return data.slice(start, start + this.pageSize());
    });

    /**
     * Total de páginas basado en los datos filtrados
     */
    totalPages = computed(() => {
        return Math.ceil(this.filteredDatasets().length / this.pageSize()) || 1;
    });

    ngOnInit() {
        this.loadDatasets();
    }

    loadDatasets() {
        this.dataRead.getDatasets().subscribe({
            next: (data) => {
                this.datasets.set(data);
            },
            error: (error) => {
                console.error('Error loading datasets:', error);
            }
        });
    }

    /**
     * Actualiza el filtro de una columna específica
     */
    onFilterChange<K extends keyof DatasetColumnFilters>(column: K, value: DatasetColumnFilters[K]) {
        this.columnFilters.update(filters => ({
            ...filters,
            [column]: value
        }));
        this.currentPage.set(1);

        this.eventBus.emit({
            type: AppEventType.VISUALIZATION_WIZARD_STEP1_FILTERED,
            payload: {
                filter: column,
                resultsCount: this.filteredDatasets().length
            }
        });
    }

    /**
     * Maneja el cambio en filtros de objeto (como temporal)
     */
    onNestedFilterChange<K extends keyof DatasetColumnFilters>(column: K, field: string, value: string | number | boolean) {
        const current = this.columnFilters()[column];
        if (typeof current === 'object' && current !== null) {
            this.onFilterChange(column, { ...current, [field]: value } as DatasetColumnFilters[K]);
        }
    }

    /**
     * Alterna un valor en un filtro de arreglo (como dimensiones)
     */
    toggleDimensionFilter(dim: string) {
        const current = [...this.columnFilters()['dimensions']];
        const index = current.indexOf(dim);

        if (index > -1) current.splice(index, 1);
        else current.push(dim);

        this.onFilterChange('dimensions', current);
    }

    /**
     * Cambia de página
     */
    setPage(page: number) {
        if (page >= 1 && page <= this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    select(dataset: DatasetInfo) {
        this.selectedDataset.set(dataset);
    }

    /**
     * Confirma la selección actual y la emite al padre.
     */
    onNext() {
        const selected = this.selectedDataset();
        if (selected) {
            this.datasetSelected.emit(selected);
        }
    }

    /**
     * Obtiene el valor de un campo del dataset de forma segura para filtrado
     */
    private getFieldValue(ds: DatasetInfo, key: string): string {
        const val = (ds as unknown as Record<string, unknown>)[key];

        if (key === 'dimensions' && Array.isArray(val)) {
            return val.join(', ');
        }

        if (typeof val === 'boolean') {
            return val ? 'sí' : 'no';
        }

        return val?.toString() || '';
    }

    /**
     * Normaliza texto para búsqueda fuzzy (minúsculas y sin acentos)
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
}
