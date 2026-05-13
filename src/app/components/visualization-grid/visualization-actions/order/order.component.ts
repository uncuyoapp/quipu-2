import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { Visualization, VisualizationOrder } from '@models/domain/visualization.model';

import { AppEventBusService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { RadioButtonComponent } from '@shared/components/radio-button/radio-button.component';
import { RadioOption } from '@shared/components/radio-button/radio-button.config';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RadioButtonComponent,
    ButtonComponent
  ],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  /** Lista completa de visualizaciones para posibles cálculos de ordenamiento futuros. */
  visualizations = input<Visualization[]>([]);

  /** Criterio de ordenamiento actual recibido. */
  order = input<VisualizationOrder>('default');

  /** Emisión del nuevo criterio de ordenamiento seleccionado. */
  orderChange = output<VisualizationOrder>();

  /** Emisión para cerrar el panel de ordenamiento. */
  closeOrder = output<void>();

  /** Estado de apertura del panel (para animaciones). */
  animationState = signal<boolean>(false);

  private readonly eventBus = inject(AppEventBusService);
  protected readonly icons = APP_ICONS;

  /** Opciones de ordenamiento disponibles. */
  orderOptions: RadioOption<VisualizationOrder>[] = [
    { value: 'default', label: 'Más relevantes' },
    { value: 'name-asc', label: 'Título (a-z)' },
    { value: 'name-desc', label: 'Título (z-a)' },
    { value: 'recent', label: 'Más reciente' },
    { value: 'serie-recent', label: 'Serie (más reciente)' },
    { value: 'serie-old', label: 'Serie (más antigua)' },
    { value: 'dimensions-more', label: 'Dimensiones (mayor cantidad)' },
    { value: 'dimensions-less', label: 'Dimensiones (menor cantidad)' }
  ];

  ngOnInit(): void {
    /** Inicia la animación de entrada. */
    setTimeout(() => {
      this.animationState.set(true);
    }, 50);
  }

  /**
   * Cierra el panel de ordenamiento con una animación de salida.
   */
  close(): void {
    this.animationState.set(false);
    setTimeout(() => {
      this.closeOrder.emit();
    }, 300);
  }

  /**
   * Maneja el cambio de opción de ordenamiento.
   * Emite el nuevo valor y cierra el panel.
   * @param value Nuevo criterio de ordenamiento.
   */
  onOrderChange(value: VisualizationOrder): void {
    this.orderChange.emit(value);
    this.eventBus.emit({ type: AppEventType.GRID_ORDER_CHANGED, payload: { order: value } });
    this.close();
  }
}
