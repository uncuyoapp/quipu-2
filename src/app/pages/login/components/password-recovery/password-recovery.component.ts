import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FormsModule,
    ReactiveFormsModule,
    TextInputComponent,
  ],
  templateUrl: './password-recovery.component.html',
  styleUrl: './password-recovery.component.scss',
})
/**
 * Componente responsable de gestionar el formulario de recuperación de contraseña.
 */
export class PasswordRecoveryComponent implements OnInit {
  readonly goBack = output<boolean>();
  readonly recovery = output<string>();

  private readonly fb = inject(FormBuilder);

  protected readonly icons = APP_ICONS;

  formRecovery!: FormGroup;

  /**
   * Inicializa el formulario de recuperación de contraseña con sus validaciones.
   */
  ngOnInit(): void {
    this.formRecovery = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Maneja el cambio de valor del campo de email/usuario desde el componente de texto.
   * @param value Nuevo valor ingresado.
   */
  onEmailChange(value: string): void {
    const control = this.formRecovery.get('email');
    control?.setValue(value);
    control?.markAsDirty();
  }

  /**
   * Marca el campo de email/usuario como tocado cuando pierde el foco.
   */
  onEmailBlur(): void {
    const control = this.formRecovery.get('email');
    control?.markAsTouched();
  }

  /**
   * Obtiene el estado de validación del campo de email/usuario para el componente de texto.
   * @returns Estado de validación a mostrar.
   */
  getEmailValidationState(): TextInputValidationState {
    const control = this.formRecovery.get('email');
    if (!control) {
      return 'none';
    }

    const showError = control.invalid && (control.dirty || control.touched);
    return showError ? 'error' : 'none';
  }

  /**
   * Obtiene el mensaje de error del campo de email/usuario según sus validaciones.
   * @returns Mensaje de error a mostrar o cadena vacía si no hay error.
   */
  getEmailErrorMessage(): string {
    const control = this.formRecovery.get('email');
    const errors = control?.errors;

    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return 'El usuario o email es requerido.';
    }

    if (errors['email']) {
      return 'Formato de email incorrecto';
    }

    return 'El valor ingresado no es válido.';
  }

  /**
   * Emite el evento para volver a la pantalla anterior.
   */
  onGoBackClick(): void {
    this.goBack.emit(true);
  }

  /**
   * Envía el formulario de recuperación de contraseña si es válido.
   */
  onSubmit(): void {
    if (this.formRecovery.valid) {
      this.recovery.emit(this.formRecovery.value.email);
    }
  }
}
