import { A11yModule } from "@angular/cdk/a11y";
import { Component, inject, input, model } from '@angular/core';
import { DimensionSelectComponent } from '@components/dimension-select/dimension-select.component';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { AppEventBusService } from '@services';
import { TagComponent } from '@shared/components/tag/tag.component';
import { Dataset, Dimension } from '@models/domain/dataset.model';
import { ChartOptions } from '@models/domain/visualization.model';
import { MultipleChartDirective } from '@uncuyoapp/ngx-data-visualizer';

/**
 * @class VMultiChartComponent
 * @description
 * Permite iterar y visualizar un grupo de gráficos simultáneos segregados por los
 * distintos valores nominales de una dimensión específica ("Small Multiples" o Trellis).
 */
@Component({
  selector: 'app-v-multi-chart',
  standalone: true,
  imports: [MultipleChartDirective, A11yModule, DimensionSelectComponent, TagComponent],
  templateUrl: './v-multi-chart.component.html',
  styleUrl: './v-multi-chart.component.scss',
})
export class VMultiChartComponent {
  /** Dataset inyectado desde el componente de envoltura padre */
  dataset = input.required<Dataset>();

  /** Configuración gráfica centralizada */
  public readonly graphics = SECTION_GRAPHICS.visualizations;

  /** Opciones del gráfico base de las cuales cada sub-gráfico heredará */
  chartOptions = input.required<ChartOptions>();

  /** Dimensiones actualmente habilitadas para hacer el desglose visual */
  splitedDimensions = model<Dimension[]>([]);

  /** ID de la visualización para los eventos */
  visualizationId = input<string | number>('unknown');

  private readonly eventBus = inject(AppEventBusService);

  /**
   * Agrega o quita mutuamente una dimensión al arreglo temporal de desglose `splitedDimensions`.
   * @param dimension La dimensión que el usuario desea ver iterada.
   */
  toggleSplitDimension(dimension: Dimension): void {
    const isSelected = this.isDimensionSelected(dimension);

    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_MULTI_CHARTS_CHANGED,
      payload: {
        id: this.visualizationId(),
        dimension: dimension.name,
        enabled: !isSelected
      }
    });

    this.splitedDimensions.update((dims) => {
      if (dims.some((d) => d.id === dimension.id)) {
        return dims.filter((dim) => dim.id !== dimension.id);
      } else {
        return [...dims, dimension];
      }
    });
  }

  /**
   * Refleja visualmente si un chip/píldora debe estar relleno como activo.
   * @param dimension Dimensión a verificar en el arreglo modelo.
   */
  isDimensionSelected(dimension: Dimension): boolean {
    return this.splitedDimensions().some((d) => d.id === dimension.id);
  }

  /**
   * Refresca las selecciones internas (filtros in-situ) dentro del modal
   * del `dimension-select` de uno de los bloques de gráfico segregado.
   * @param updatedDimension Dimensión mutada que requiere persistencia en la señal.
   */
  onDimensionChange(updatedDimension: Dimension): void {
    this.splitedDimensions.update((dims) =>
      dims.map((d) => (d.id === updatedDimension.id ? updatedDimension : d))
    );
  }
}
