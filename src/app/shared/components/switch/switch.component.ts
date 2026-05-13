import { Component, ChangeDetectionStrategy, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SWITCH_DEFAULT_CONFIG, SwitchColor } from './switch.config';

/**
 * Componente Switch (Slide Toggle) reutilizable basado en Material Design
 * 
 * @description
 * Implementa un switch toggle con soporte completo para formularios reactivos,
 * múltiples variantes de color, estados (on/off, disabled) y accesibilidad.
 * Utiliza signals de Angular 18+ para una reactividad óptima.
 * 
 * @example
 * ```typescript
 * // Uso básico
 * <app-switch
 *   [label]="'Notificaciones'"
 *   (valueChange)="onToggle($event)" />
 * 
 * // Con FormControl
 * <app-switch
 *   [control]="notificationsControl"
 *   [label]="'Activar notificaciones push'"
 *   [color]="'accent'" />
 * 
 * // Label antes del switch
 * <app-switch
 *   [label]="'Modo oscuro'"
 *   [labelPosition]="'before'"
 *   [showStateText]="true"
 *   (valueChange)="onDarkModeToggle($event)" />
 * 
 * // Switch deshabilitado
 * <app-switch
 *   [label]="'Función premium'"
 *   [disabled]="true"
 *   [checked]="false" />
 * 
 * // Con indicador de estado
 * <app-switch
 *   [label]="'Auto-guardado'"
 *   [showStateText]="true"
 *   [color]="'primary'" />
 * ```
 * 
 * @usageNotes
 * - El componente se integra perfectamente con formularios reactivos de Angular
 * - Los eventos se emiten tanto al hacer clic como al cambiar programáticamente
 * - Accesible por teclado (Space para toggle)
 * - El label es opcional pero recomendado para accesibilidad
 * - El texto de estado (ON/OFF) es opcional y configurable
 * - Transiciones suaves entre estados para mejor UX
 */
@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchComponent {
  /**
     * Texto del label asociado al switch
     * @default ''
     */
  readonly label = input<string>(SWITCH_DEFAULT_CONFIG.label);

  /**
   * Posición del label respecto al switch
   * @default 'after'
   */
  readonly labelPosition = input<'before' | 'after'>(SWITCH_DEFAULT_CONFIG.labelPosition);

  /**
   * Indica si el switch está deshabilitado
   * @default false
   */
  readonly disabled = input<boolean>(SWITCH_DEFAULT_CONFIG.disabled);

  /**
   * Estado inicial del switch (activado/desactivado)
   * @default false
   */
  readonly checked = input<boolean>(false);

  /**
   * Color del switch cuando está activado
   * @default 'primary'
   */
  readonly color = input<SwitchColor>(SWITCH_DEFAULT_CONFIG.color);

  /**
   * Indica si se debe mostrar el estado on/off como texto
   * @default false
   */
  readonly showStateText = input<boolean>(SWITCH_DEFAULT_CONFIG.showStateText);

  /**
   * Texto para el estado ON
   * @default 'ON'
   */
  readonly onText = input<string>(SWITCH_DEFAULT_CONFIG.onText);

  /**
   * Texto para el estado OFF
   * @default 'OFF'
   */
  readonly offText = input<string>(SWITCH_DEFAULT_CONFIG.offText);

  /**
   * FormControl externo para integración con formularios reactivos
   * Si no se proporciona, se crea uno interno
   */
  readonly control = input<FormControl<boolean | null>>();

  /**
   * Evento emitido cuando el valor del switch cambia
   * @event valueChange
   */
  readonly valueChange = output<boolean>();

  /**
   * FormControl interno para el manejo del estado
   * @internal
   */
  protected formControl = signal<FormControl<boolean | null>>(new FormControl(false));

  /**
   * Valor actual del switch manejado como signal para asegurar reactividad en el template
   * @internal
   */
  protected currentValue = signal<boolean>(false);

  constructor() {
    // Sincronizar el control externo si se proporciona
    effect(() => {
      const externalControl = this.control();
      if (externalControl) {
        this.formControl.set(externalControl);
      }
    }, { allowSignalWrites: true });

    // Sincronizar el valor actual del switch mediante suscripción al valueChanges
    // Esto asegura que currentValue() sea reactivo incluso si el FormControl cambia internamente
    effect((onCleanup) => {
      const control = this.formControl();
      
      // Establecer valor inicial
      this.currentValue.set(control.value ?? false);

      const sub = control.valueChanges.subscribe(value => {
        this.currentValue.set(value ?? false);
      });

      onCleanup(() => sub.unsubscribe());
    }, { allowSignalWrites: true });

    // Establecer valor inicial cuando cambia el input 'checked' y no hay control externo
    effect(() => {
      const checkedValue = this.checked();
      if (!this.control()) {
        this.formControl().setValue(checkedValue, { emitEvent: true });
      }
    }, { allowSignalWrites: true });

    // Sincronizar estado disabled
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.formControl().disable({ emitEvent: false });
      } else {
        this.formControl().enable({ emitEvent: false });
      }
    });
  }

  /**
   * Maneja el cambio de valor del switch
   * @param value - Nuevo valor del switch
   * @internal
   */
  protected handleChange(value: boolean): void {
    this.valueChange.emit(value);
  }

  /**
   * Establece el valor del switch programáticamente
   * @param value - Valor a establecer
   * @public
   */
  setValue(value: boolean): void {
    this.formControl().setValue(value);
  }

  /**
   * Obtiene el valor actual del switch
   * @returns Valor actual (true/false)
   * @public
   */
  getValue(): boolean {
    return this.currentValue();
  }

  /**
   * Alterna el estado del switch
   * @public
   */
  toggle(): void {
    if (!this.disabled()) {
      const newValue = !this.currentValue();
      this.setValue(newValue);
    }
  }
}
