import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  CHECKBOX_DEFAULT_CONFIG,
  CheckboxColor,
  CheckboxSize,
} from './checkbox.config';

/**
 * Componente Checkbox reutilizable con diseño personalizado
 *
 * @description
 * Implementa un checkbox con soporte completo para formularios reactivos,
 * múltiples tamaños, estados (checked, indeterminate, disabled) y accesibilidad.
 * Utiliza signals de Angular 18+ para una reactividad óptima.
 *
 * @example
 * ```typescript
 * // Uso básico
 * <app-checkbox
 *   [label]="'Aceptar términos'"
 *   (valueChange)="onAccept($event)" />
 *
 * // Con FormControl
 * <app-checkbox
 *   [control]="termsControl"
 *   [label]="'He leído y acepto los términos'"
 *   [size]="'large'" />
 *
 * // Estado indeterminado
 * <app-checkbox
 *   [indeterminate]="true"
 *   [label]="'Seleccionar todos'"
 *   (valueChange)="onSelectAll($event)" />
 *
 * // Checkbox deshabilitado
 * <app-checkbox
 *   [label]="'Opción no disponible'"
 *   [disabled]="true"
 *   [checked]="true" />
 * ```
 *
 * @usageNotes
 * - El componente se integra perfectamente con formularios reactivos de Angular
 * - Soporta estado indeterminado para casos como "seleccionar todos"
 * - Los eventos se emiten tanto al hacer clic como al cambiar programáticamente
 * - Accesible por teclado (Space para toggle)
 * - El label es opcional pero recomendado para accesibilidad
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
  /**
   * Tamaño del checkbox
   * @default 'medium'
   */
  readonly size = input<CheckboxSize>(CHECKBOX_DEFAULT_CONFIG.size);

  /**
   * Texto del label asociado al checkbox
   * @default ''
   */
  readonly label = input<string>(CHECKBOX_DEFAULT_CONFIG.label);

  /**
   * Indica si el checkbox está deshabilitado
   * @default false
   */
  readonly disabled = input<boolean>(CHECKBOX_DEFAULT_CONFIG.disabled);

  /**
   * Estado inicial del checkbox (marcado/desmarcado)
   * @default false
   */
  readonly checked = input<boolean>(false);

  /**
   * Indica si el checkbox está en estado indeterminado
   * @default false
   */
  readonly indeterminate = input<boolean>(CHECKBOX_DEFAULT_CONFIG.indeterminate);

  /**
   * Color del checkbox cuando está marcado
   * @default 'primary'
   */
  readonly color = input<CheckboxColor>(CHECKBOX_DEFAULT_CONFIG.color);

  /**
   * FormControl externo para integración con formularios reactivos
   * Si no se proporciona, se crea uno interno
   */
  readonly control = input<FormControl<boolean | null>>();

  /**
   * Evento emitido cuando el valor del checkbox cambia
   * @event valueChange
   */
  readonly valueChange = output<boolean>();

  /**
   * FormControl interno para el manejo del estado
   * @internal
   */
  protected formControl = signal<FormControl<boolean | null>>(
    new FormControl(false)
  );

  /**
   * Valor actual del checkbox
   * @internal
   */
  protected currentValue = computed(() => {
    return this.formControl().value ?? false;
  });

  /**
   * Color formateado para uso en CSS
   * Si es un preset ('primary', 'accent', 'warn') retorna null para usar estilos por defecto.
   * Si es un color personalizado, lo retorna tal cual.
   * @internal
   */
  protected formattedColor = computed(() => {
    const color = this.color();
    const presets = ['primary', 'accent', 'warn'];
    return presets.includes(color) ? null : color;
  });

  constructor() {
    // Sincronizar el control externo si se proporciona
    effect(
      () => {
        const externalControl = this.control();
        if (externalControl) {
          this.formControl.set(externalControl);
        }
      },
      { allowSignalWrites: true }
    );

    // Establecer valor inicial
    effect(
      () => {
        const checkedValue = this.checked();
        if (!this.control()) {
          this.formControl().setValue(checkedValue, { emitEvent: false });
        }
      },
      { allowSignalWrites: true }
    );

    // Sincronizar estado disabled
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.formControl().disable({ emitEvent: false });
      } else {
        this.formControl().enable({ emitEvent: false });
      }
    });

    // Sincronizar estado indeterminado con el control
    // El estado indeterminado es visual, pero a veces afecta la lógica del valor
    effect(() => {
      // Aquí podríamos añadir lógica extra si el indeterminado afectara al valor,
      // pero por ahora es principalmente visual en el template.
    });
  }

  /**
   * Maneja el cambio de valor desde el input nativo
   * @param event - Evento del input
   * @internal
   */
  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleChange(input.checked);
  }

  /**
   * Lógica central de cambio de valor
   * @param value - Nuevo valor
   * @internal
   */
  protected handleChange(value: boolean): void {
    this.formControl().setValue(value);
    this.valueChange.emit(value);
  }

  /**
   * Establece el valor del checkbox programáticamente
   * @param value - Valor a establecer
   * @public
   */
  setValue(value: boolean): void {
    this.formControl().setValue(value);
  }

  /**
   * Obtiene el valor actual del checkbox
   * @returns Valor actual (true/false)
   * @public
   */
  getValue(): boolean {
    return this.currentValue();
  }

  /**
   * Alterna el estado del checkbox
   * @public
   */
  toggle(): void {
    if (!this.disabled()) {
      const newValue = !this.currentValue();
      this.setValue(newValue);
      this.valueChange.emit(newValue);
    }
  }
}
