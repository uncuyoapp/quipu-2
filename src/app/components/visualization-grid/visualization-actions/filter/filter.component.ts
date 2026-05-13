import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { Visualization, VisualizationFilter } from '@models/domain/visualization.model';

import { AppEventBusService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { TagComponent } from '@shared/components/tag/tag.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TextInputComponent,
    TagComponent,
    CheckboxComponent,
    ButtonComponent,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
})
export class FilterComponent implements OnInit {
  /** Referencia al input de dimensiones para limpieza. */
  dimensionInput = viewChild<TextInputComponent>('dimensionInput');

  /** Referencia al input de medidas para limpieza. */
  measureInput = viewChild<TextInputComponent>('measureInput');

  /** Lista completa de visualizaciones para extraer opciones de filtrado. */
  visualizations = input<Visualization[]>([]);

  /** Filtro actual recibido. */
  filter = input.required<VisualizationFilter>();

  /** Emisión de los nuevos filtros aplicados. */
  filterChange = output<VisualizationFilter>();

  /** Emisión para cerrar el panel de filtros. */
  closeFilter = output<void>();

  /** Estado de apertura del panel (para animaciones). */
  animationState = signal<boolean>(false);

  private readonly eventBus = inject(AppEventBusService);
  protected readonly icons = APP_ICONS;

  /** Lista de dimensiones únicas extraídas de las visualizaciones. */
  dimensions = signal<string[]>([]);

  /** Lista de unidades de medida únicas extraídas de las visualizaciones. */
  measures = signal<string[]>([]);

  /** Opciones de periodicidad predefinidas. */
  periodicities: string[] = [
    'Anual',
    'Bimestral',
    'Semestral',
    'Trimestral',
    'Mensual',
    'Cuatrimestral',
  ];

  /** Dimensiones actualmente seleccionadas. */
  selectedDimensions = signal<string[]>([]);

  /** Unidad de medida actualmente seleccionada. */
  selectedMeasure = signal<string>('');

  /** Periodicidades actualmente seleccionadas. */
  selectedPeriodicities = signal<string[]>([]);

  constructor() {
    /** 
     * Extrae opciones de filtrado cada vez que cambia la lista de visualizaciones.
     */
    effect(
      () => {
        const list = this.visualizations();
        if (list?.length) {
          this.extractFilterOptions(list);
        }
      },
      { allowSignalWrites: true }
    );

    /** 
     * Sincroniza el estado interno de las señales cuando el input de filtro cambia.
     */
    effect(
      () => {
        const value = this.filter();
        if (value) {
          this.selectedDimensions.set(value.dimensions || []);
          this.selectedMeasure.set(value.measureUnit || '');
          this.selectedPeriodicities.set(
            value.periodicity ? [value.periodicity] : []
          );
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    /** Inicia la animación de entrada. */
    setTimeout(() => {
      this.animationState.set(true);
    }, 50);
  }

  /**
   * Extrae dimensiones y medidas únicas de las visualizaciones proporcionadas.
   * @param list Lista de visualizaciones.
   */
  private extractFilterOptions(list: Visualization[]): void {
    const allDimensions = list.flatMap((v) => v.dimensions || []);
    this.dimensions.set([...new Set(allDimensions)].filter(Boolean).sort());

    const allMeasures = list.map((v) => v.measureUnit);
    this.measures.set([...new Set(allMeasures)].filter(Boolean).sort());
  }

  /**
   * Cierra el panel de filtros con una animación de salida.
   */
  close(): void {
    this.animationState.set(false);
    setTimeout(() => {
      this.closeFilter.emit();
    }, 300);
  }

  /**
   * Alterna la selección de una dimensión.
   * @param dimension Nombre de la dimensión.
   */
  toggleDimension(dimension: string): void {
    this.selectedDimensions.update(current => {
      const exists = current.includes(dimension);
      if (exists) {
        return current.filter(d => d !== dimension);
      } else {
        this.dimensionInput()?.clear();
        return [...current, dimension];
      }
    });
    this.applyFilter();
  }

  /**
   * Alterna la selección de una periodicidad.
   * @param periodicity Nombre de la periodicidad.
   */
  togglePeriodicity(periodicity: string): void {
    this.selectedPeriodicities.update(current => {
      const exists = current.includes(periodicity);
      return exists ? current.filter(p => p !== periodicity) : [...current, periodicity];
    });
    this.applyFilter();
  }

  /**
   * Selecciona o deselecciona una unidad de medida.
   * @param measure Nombre de la medida.
   */
  selectMeasure(measure: string): void {
    this.selectedMeasure.update(current => {
      const isSame = current === measure;
      if (!isSame && measure) {
        this.measureInput()?.clear();
      }
      return isSame ? '' : measure;
    });
    this.applyFilter();
  }

  /**
   * Construye y emite el nuevo objeto de filtro basado en las selecciones actuales.
   */
  private applyFilter(): void {
    const newFilter: VisualizationFilter = {
      ...this.filter(),
      dimensions: this.selectedDimensions().length ? this.selectedDimensions() : undefined,
      measureUnit: this.selectedMeasure() || undefined,
      periodicity: this.selectedPeriodicities().length === 1 ? this.selectedPeriodicities()[0] : undefined,
    };

    this.filterChange.emit(newFilter);
    this.eventBus.emit({ type: AppEventType.GRID_FILTER_CHANGED, payload: { filter: newFilter } });
  }

  /**
   * Limpia todos los filtros seleccionados.
   */
  clearFilters(): void {
    this.selectedDimensions.set([]);
    this.selectedMeasure.set('');
    this.selectedPeriodicities.set([]);
    this.applyFilter();
  }

  /**
   * Indica si hay algún filtro activo actualmente.
   */
  get hasActiveFilters(): boolean {
    return (
      this.selectedDimensions().length > 0 ||
      this.selectedMeasure() !== '' ||
      this.selectedPeriodicities().length > 0
    );
  }
}
