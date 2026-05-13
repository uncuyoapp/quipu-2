import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import { SessionPersistenceService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';
import { finalize } from 'rxjs';

/**
 * @class UserPasswordEditComponent
 * @description
 * Componente para la gestión del cambio de contraseña del usuario.
 * Proporciona validaciones de fortaleza de contraseña y coincidencia entre campos.
 */
@Component({
  selector: 'app-user-password-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    TextInputComponent,
    NgIconComponent
  ],
  templateUrl: './user-password-edit.component.html',
  styleUrl: './user-password-edit.component.scss'
})
export class UserPasswordEditComponent {
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly router = inject(Router);

  protected readonly icons = APP_ICONS;

  /** Formulario reactivo para el cambio de contraseña */
  passwordForm!: FormGroup;

  /** Estado del flujo de actualización */
  status: 'form' | 'loading' | 'success' | 'error' = 'form';

  /** Mensaje de error a mostrar en caso de fallo */
  errorMessage = '';

  /**
   * Inicializa el formulario con sus validadores y reglas de negocio.
   */
  ngOnInit(): void {
    this.passwordForm = new FormGroup({
      oldPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]),
      confirmPassword: new FormControl('', [Validators.required])
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Procesa el envío del formulario de cambio de contraseña.
   */
  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.status = 'loading';
    const { oldPassword, newPassword } = this.passwordForm.value;

    this.sessionPersistence.updatePassword(oldPassword, newPassword)
      .pipe(finalize(() => this.status = this.status === 'loading' ? 'form' : this.status))
      .subscribe({
        next: () => {
          this.status = 'success';
        },
        error: (err: unknown) => {
          this.status = 'error';
          this.errorMessage = (err as any).message || 'Error al actualizar la contraseña';
        }
      });
  }

  onOldPasswordChange(value: string): void {
    this.passwordForm.get('oldPassword')?.setValue(value);
    this.passwordForm.get('oldPassword')?.markAsDirty();
  }


  onNewPasswordChange(value: string): void {
    this.passwordForm.get('newPassword')?.setValue(value);
    this.passwordForm.get('newPassword')?.markAsDirty();
  }

  onNewPasswordBlur(): void {
    this.passwordForm.get('newPassword')?.markAsTouched();
  }

  onConfirmPasswordChange(value: string): void {
    this.passwordForm.get('confirmPassword')?.setValue(value);
    this.passwordForm.get('confirmPassword')?.markAsDirty();
  }

  onConfirmPasswordBlur(): void {
    this.passwordForm.get('confirmPassword')?.markAsTouched();
  }

  /**
   * Vuelve a la página principal de perfil.
   */
  goBack(): void {
    this.router.navigate(['/user']);
  }

  /**
   * Resetea el estado del componente para permitir un nuevo intento.
   */
  retry(): void {
    this.status = 'form';
    this.errorMessage = '';
  }

  /**
   * Determina el estado de validación visual para un campo del formulario.
   * @param controlName Nombre del control del formulario.
   * @returns Estado de validación ('success', 'error', 'none').
   */
  getValidationState(controlName: string): TextInputValidationState {
    const control = this.passwordForm.get(controlName);
    if (!control || (!control.dirty && !control.touched)) return 'none';
    return control.invalid ? 'error' : 'success';
  }

  /**
   * Obtiene el primer mensaje de error aplicable para un campo.
   * @param controlName Nombre del control del formulario.
   * @returns Mensaje de error traducido.
   */
  getError(controlName: string): string {
    const control = this.passwordForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) return 'Debe tener al menos 8 caracteres';
    if (control.errors['weakPassword']) return 'Debe incluir 1 mayúscula y 1 número';

    return '';
  }

  getPasswordRepeatValidationState(): TextInputValidationState {
    const control = this.passwordForm.get('confirmPassword');
    if (!control || (!control.dirty && !control.touched)) return 'none';
    const hasMismatch = this.passwordForm.hasError('mismatch');
    return (control.invalid || hasMismatch) ? 'error' : 'success';
  }

  getPasswordRepeatErrorMessage(): string {
    const control = this.passwordForm.get('confirmPassword');
    if (!control) return '';
    if (control.errors?.['required']) return 'Debes repetir la contraseña';
    if (this.passwordForm.hasError('mismatch')) return 'Las contraseñas no coinciden';
    return '';
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumbers = /\d/.test(value);
    return hasUpperCase && hasNumbers ? null : { weakPassword: true };
  }
}
