import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    FormsModule,
    ReactiveFormsModule,
    TextInputComponent,
  ],
  templateUrl: './password-change.component.html',
  styleUrl: './password-change.component.scss',
})
/**
 * Componente responsable de gestionar el formulario de cambio de contraseña.
 */
export class PasswordChangeComponent {
  readonly token = input<string | undefined>();
  readonly submitForm = output<{ token: string; password: string }>();
  readonly goBack = output<boolean>();

  private readonly fb = inject(FormBuilder);

  protected readonly icons = APP_ICONS;

  passwordChangeForm!: FormGroup;

  /**
   * Inicializa el formulario de cambio de contraseña con sus validaciones.
   */
  ngOnInit(): void {
    this.passwordChangeForm = new FormGroup(
      {
        token: new FormControl(this.token() ?? ''),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
          this.passwordStrengthValidator,
        ]),
        passwordRepeat: new FormControl('', [Validators.required]),
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  /**
   * Actualiza el valor del token en el formulario cuando cambia la entrada.
   */
  ngOnChanges(): void {
    const currentToken = this.token();
    if (this.passwordChangeForm && currentToken) {
      this.passwordChangeForm.patchValue({ token: currentToken });
    }
  }

  /**
   * Maneja el cambio de valor del campo de nueva contraseña desde el componente de texto.
   * @param value Nuevo valor ingresado para la contraseña.
   */
  onPasswordChange(value: string): void {
    const control = this.passwordChangeForm.get('password');
    control?.setValue(value);
    control?.markAsDirty();
  }

  /**
   * Marca el campo de nueva contraseña como tocado cuando pierde el foco.
   */
  onPasswordBlur(): void {
    const control = this.passwordChangeForm.get('password');
    control?.markAsTouched();
  }

  /**
   * Maneja el cambio de valor del campo de repetición de contraseña desde el componente de texto.
   * @param value Nuevo valor ingresado para la repetición de contraseña.
   */
  onPasswordRepeatChange(value: string): void {
    const control = this.passwordChangeForm.get('passwordRepeat');
    control?.setValue(value);
    control?.markAsDirty();
  }

  /**
   * Marca el campo de repetición de contraseña como tocado cuando pierde el foco.
   */
  onPasswordRepeatBlur(): void {
    const control = this.passwordChangeForm.get('passwordRepeat');
    control?.markAsTouched();
  }

  /**
   * Obtiene el estado de validación del campo de nueva contraseña para el componente de texto.
   * @returns Estado de validación a mostrar.
   */
  getPasswordValidationState(): TextInputValidationState {
    const control = this.passwordChangeForm.get('password');
    if (!control) {
      return 'none';
    }

    const showError = control.invalid && (control.dirty || control.touched);
    return showError ? 'error' : 'none';
  }

  /**
   * Obtiene el mensaje de error del campo de nueva contraseña según sus validaciones.
   * @returns Mensaje de error a mostrar o cadena vacía si no hay error.
   */
  getPasswordErrorMessage(): string {
    const control = this.passwordChangeForm.get('password');
    const errors = control?.errors;

    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return 'La contraseña es requerida.';
    }

    if (errors['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (errors['weakPassword']) {
      return 'La contraseña debe ser más fuerte (mayúsculas, minúsculas, números y caracteres especiales).';
    }

    return 'El valor ingresado no es válido.';
  }

  /**
   * Obtiene el estado de validación del campo de repetición de contraseña para el componente de texto.
   * @returns Estado de validación a mostrar.
   */
  getPasswordRepeatValidationState(): TextInputValidationState {
    const control = this.passwordChangeForm.get('passwordRepeat');
    if (!control) {
      return 'none';
    }

    const hasMismatch = this.passwordChangeForm.hasError('mismatch');
    const showError =
      (control.invalid || hasMismatch) && (control.dirty || control.touched);

    return showError ? 'error' : 'none';
  }

  /**
   * Obtiene el mensaje de error del campo de repetición de contraseña según sus validaciones.
   * @returns Mensaje de error a mostrar o cadena vacía si no hay error.
   */
  getPasswordRepeatErrorMessage(): string {
    const control = this.passwordChangeForm.get('passwordRepeat');
    const errors = control?.errors;

    if (errors?.['required']) {
      return 'Debes repetir la contraseña.';
    }

    if (this.passwordChangeForm.hasError('mismatch')) {
      return 'Las contraseñas no coinciden.';
    }

    return '';
  }

  /**
   * Envía el formulario de cambio de contraseña si es válido.
   */
  onSubmit(): void {
    if (this.passwordChangeForm.valid) {
      const formValue = this.passwordChangeForm.value;
      this.submitForm.emit({
        token: formValue.token,
        password: formValue.password,
      });
    }
  }

  /**
   * Valida que las contraseñas ingresadas coincidan.
   * @param control Control de formulario que contiene los campos de contraseña.
   * @returns Objeto de error si las contraseñas no coinciden, de lo contrario `null`.
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('passwordRepeat')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  /**
   * Valida la fortaleza de la contraseña comprobando mayúsculas, minúsculas, números y caracteres especiales.
   * @param control Control de formulario que contiene la contraseña.
   * @returns Objeto de error si la contraseña es débil, de lo contrario `null`.
   */
  passwordStrengthValidator(control: { value: string }) {
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonAlphanumeric = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLengthValid = password && password.length >= 6;

    if (
      isLengthValid &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasNonAlphanumeric
    ) {
      return null;
    }

    return { weakPassword: true };
  }

  /**
   * Emite el evento para volver a la pantalla anterior.
   */
  onGoBackClick(): void {
    this.goBack.emit(true);
  }
}
