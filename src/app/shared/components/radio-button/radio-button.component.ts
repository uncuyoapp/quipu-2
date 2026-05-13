import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { startWith } from 'rxjs/operators';
import {
  RADIO_BUTTON_DEFAULT_CONFIG,
  RadioColor,
  RadioGroupOrientation,
  RadioOption
} from './radio-button.config';

@Component({
  selector: 'app-radio-button',
  standalone: true,
  imports: [ReactiveFormsModule, MatRadioModule],
  templateUrl: './radio-button.component.html',
  styleUrl: './radio-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonComponent<T = any> {
  readonly options = input.required<RadioOption<T>[]>();
  readonly orientation = input<RadioGroupOrientation>(RADIO_BUTTON_DEFAULT_CONFIG.orientation);
  readonly color = input<RadioColor>(RADIO_BUTTON_DEFAULT_CONFIG.color);
  readonly disabled = input<boolean>(RADIO_BUTTON_DEFAULT_CONFIG.disabled);
  readonly value = input<T | null>(null);
  readonly name = input<string>(RADIO_BUTTON_DEFAULT_CONFIG.name);
  readonly control = input<FormControl<T | null>>();
  readonly valueChange = output<T>();

  protected formControl = signal<FormControl<T | null>>(new FormControl<T | null>(null));

  /**
   * Valor actual seleccionado, reactivo a los cambios del control
   * @internal
   */
  protected currentValue = toSignal(
    this.formControl().valueChanges.pipe(
      startWith(this.formControl().value)
    ),
    { initialValue: this.formControl().value }
  );

  constructor() {
    // Sincronizar el control externo si se proporciona
    effect(() => {
      const externalControl = this.control();
      if (externalControl) {
        this.formControl.set(externalControl);
      }
    }, { allowSignalWrites: true });

    // Establecer valor inicial
    effect(() => {
      const initialValue = this.value();
      if (!this.control()) {
        // Quitamos emitEvent: false para que currentValue se actualice
        this.formControl().setValue(initialValue);
      }
    }, { allowSignalWrites: true });

    // Sincronizar estado disabled
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.formControl().disable();
      } else {
        this.formControl().enable();
      }
    });
  }

  protected handleChange(value: T): void {
    this.valueChange.emit(value);
  }

  setValue(value: T): void {
    this.formControl().setValue(value);
  }

  getValue(): T | null {
    return this.currentValue();
  }

  clear(): void {
    this.formControl().setValue(null);
  }

  getSelectedLabel(): string | null {
    const currentVal = this.currentValue();
    if (currentVal === null) return null;

    const selectedOption = this.options().find(opt => opt.value === currentVal);
    return selectedOption?.label ?? null;
  }
}
