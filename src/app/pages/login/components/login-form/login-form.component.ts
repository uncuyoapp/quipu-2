import { Component, inject, input, OnInit, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginCredentials } from '@models/domain/user.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TextInputComponent,
    ButtonComponent,
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
/**
 * Componente responsable de gestionar el formulario de inicio de sesión.
 */
export class LoginFormComponent implements OnInit {
  /**
   * Valor inicial opcional para el campo de nombre de usuario.
   */
  readonly initialUsername = input<string | null>(null);

  readonly submitForm = output<LoginCredentials>();
  readonly recoveryClick = output<boolean>();

  private readonly fb = inject(FormBuilder);

  loginForm!: FormGroup;

  /**
   * Inicializa el formulario de inicio de sesión con sus validaciones.
   */
  ngOnInit(): void {
    const usernameInitialValue = this.initialUsername() ?? '';

    this.loginForm = this.fb.group({
      username: [usernameInitialValue, [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Maneja el cambio de valor del campo de nombre de usuario desde el componente de texto.
   * @param value Nuevo valor ingresado para el usuario.
   */
  onUsernameChange(value: string): void {
    const control = this.loginForm.get('username');
    control?.setValue(value);
    control?.markAsDirty();
  }

  /**
   * Marca el campo de nombre de usuario como tocado cuando pierde el foco.
   */
  onUsernameBlur(): void {
    const control = this.loginForm.get('username');
    control?.markAsTouched();
  }

  /**
   * Maneja el cambio de valor del campo de contraseña desde el componente de texto.
   * @param value Nuevo valor ingresado para la contraseña.
   */
  onPasswordChange(value: string): void {
    const control = this.loginForm.get('password');
    control?.setValue(value);
    control?.markAsDirty();
  }

  /**
   * Marca el campo de contraseña como tocado cuando pierde el foco.
   */
  onPasswordBlur(): void {
    const control = this.loginForm.get('password');
    control?.markAsTouched();
  }

  /**
   * Obtiene el estado de validación del campo de nombre de usuario para el componente de texto.
   * @returns Estado de validación a mostrar.
   */
  getUsernameValidationState(): TextInputValidationState {
    const control = this.loginForm.get('username');
    if (!control) {
      return 'none';
    }

    const showError = control.invalid && (control.dirty || control.touched);
    return showError ? 'error' : 'none';
  }

  /**
   * Obtiene el mensaje de error del campo de nombre de usuario según sus validaciones.
   * @returns Mensaje de error a mostrar o cadena vacía si no hay error.
   */
  getUsernameErrorMessage(): string {
    const control = this.loginForm.get('username');
    const errors = control?.errors;

    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return 'El usuario es requerido.';
    }

    if (errors['minlength']) {
      return 'El usuario debe tener al menos 4 caracteres.';
    }

    return 'El valor ingresado no es válido.';
  }

  /**
   * Obtiene el estado de validación del campo de contraseña para el componente de texto.
   * @returns Estado de validación a mostrar.
   */
  getPasswordValidationState(): TextInputValidationState {
    const control = this.loginForm.get('password');
    if (!control) {
      return 'none';
    }

    const showError = control.invalid && (control.dirty || control.touched);
    return showError ? 'error' : 'none';
  }

  /**
   * Obtiene el mensaje de error del campo de contraseña según sus validaciones.
   * @returns Mensaje de error a mostrar o cadena vacía si no hay error.
   */
  getPasswordErrorMessage(): string {
    const control = this.loginForm.get('password');
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

    return 'El valor ingresado no es válido.';
  }

  /**
   * Envía el formulario de inicio de sesión.
   */
  onSubmit(): void {
    this.submitForm.emit(this.loginForm.value);
  }

  /**
   * Emite el evento para ir al flujo de recuperación de contraseña.
   */
  onRecoveryPasswordClick(): void {
    this.recoveryClick.emit(true);
  }
}
