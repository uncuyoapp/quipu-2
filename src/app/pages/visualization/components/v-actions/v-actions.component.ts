import { Component, inject, input, model, output } from '@angular/core';
import { DimensionSelectComponent } from '@components/dimension-select/dimension-select.component';
import { AppEventType } from '@core/models/events/app-event.types';
import { AppEventBusService, VisualizationStateService } from '@services';
import { SwitchComponent } from '@shared/components/switch/switch.component';
import { Dimension, Series } from '@uncuyoapp/ngx-data-visualizer';

/**
 * @class VActionsComponent
 * @description
 * Componente que provee las acciones y filtros laterales para modificar la vista
 * actual de una visualización (dimensiones, series, vista porcentual emergente).
 */
@Component({
  selector: 'app-v-actions',
  standalone: true,
  imports: [
    DimensionSelectComponent,
    SwitchComponent
  ],
  templateUrl: './v-actions.component.html',
  styleUrl: './v-actions.component.scss',
})
export class VActionsComponent {
  /** ID de la visualización para los eventos */
  visualizationId = input<string | number>('unknown');

  private readonly eventBus = inject(AppEventBusService);
  private readonly visualizationState = inject(VisualizationStateService);
  /** Arreglo bidireccional de dimensiones disponibles en el dataset */
  dimensions = model.required<Dimension[]>();

  /** Arreglo bidireccional de las series aplicables e iterables */
  series = model.required<Series[]>();

  /** Dimensiones habilitadas para mostrar múltiples instancias de gráficos */
  splitedDimensions = input<Dimension[]>([]);

  /** Determina si se debe mostrar la acción de vista porcentual */
  showPercentageView = input<boolean>(false);

  /** Determina si se debe mostrar la sección de múltiples gráficos */
  showMultiChart = input<boolean>(false);

  /** Evento emitido al habilitar/deshabilitar gráficos múltiples por dimensión */
  multipleGraphsChange = output<Dimension>();

  /** Evento emitido para alternar la visualización en porcentajes */
  percentageViewChange = output<boolean>();

  /** Evento emitido para alternar la visibilidad de una serie específica */
  seriesToggle = output<Series>();

  /**
   * Maneja el cambio profundo dentro de una dimensión (ej. selección de ítems)
   * y desencadena una reactividad explícita actualizando la señal.
   *
   * @param index El índice de la dimensión que fue modificada.
   * @param updatedDimension El nuevo estado de la dimensión seleccionada.
   */
  onDimensionChange(index: number, updatedDimension: Dimension): void {
    // Capturar estado anterior para comparar
    const oldDimension = this.dimensions()[index];
    const vizId = this.visualizationId();

    // Actualizar el array con deep copy para forzar detección de cambios
    this.dimensions.set(
      this.dimensions().map((d, i) =>
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

    // --- Emisión de Eventos ---

    // Detectar RollUp (Cambio en la selección de la dimensión completa)
    if ((oldDimension as any).selected !== (updatedDimension as any).selected) {
      this.eventBus.emit({
        type: AppEventType.VISUALIZATION_ROLLUP_CHANGED,
        payload: {
          id: vizId,
          dimension: updatedDimension.name,
          active: !!(updatedDimension as any).selected
        }
      });
    }

    // Detectar Filtrado de ítems (Cambio en la cantidad de ítems seleccionados)
    const activeItems = updatedDimension.items.filter(i => (i as any).selected).length;
    const oldActiveItems = oldDimension.items.filter(i => (i as any).selected).length;

    if (activeItems !== oldActiveItems) {
      this.eventBus.emit({
        type: AppEventType.VISUALIZATION_ITEMS_FILTERED,
        payload: {
          id: vizId,
          dimension: updatedDimension.name,
          itemsCount: activeItems
        }
      });
    }
  }

  /**
   * Emite el evento de inserción o remoción de una dimensión para múltiples gráficos.
   *
   * @param index El índice posicional (uso en tracking, opcionalmente de utilidad).
   * @param updatedDimension La dimensión que será activada/desactivada en "Multi Chart".
   */
  onMultipleGraphsChange(index: number, updatedDimension: Dimension): void {
    const isSelected = this.isDimensionSelected(updatedDimension);
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_MULTI_CHARTS_CHANGED,
      payload: {
        id: this.visualizationId(),
        dimension: updatedDimension.name,
        enabled: !isSelected // Invertimos porque emitimos antes de cambiar el estado real en el padre
      }
    });
    this.multipleGraphsChange.emit(updatedDimension);
  }

  /**
   * Emite la solicitud de cambio a modo de vista base 100% (porcentual).
   *
   * @param value Estado destino para la vista porcentual.
   */
  onPercentageViewChange(value: boolean): void {
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_PERCENTAGE_TOGGLED,
      payload: {
        id: this.visualizationId(),
        enabled: value
      }
    });
    this.percentageViewChange.emit(value);
  }

  /**
   * Determina si una dimensión dada se encuentra actualmente seleccionada
   * en la configuración de "Múltiples gráficos".
   *
   * @param dimension La dimensión a verificar.
   * @returns Un valor booleano indicando su selección temporal.
   */
  isDimensionSelected(dimension: Dimension): boolean {
    return this.splitedDimensions().some((d) => d.id === dimension.id);
  }
}
