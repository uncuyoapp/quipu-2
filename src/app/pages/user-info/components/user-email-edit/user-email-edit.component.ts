import { Component, inject, OnInit } from '@angular/core';
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
import { SessionPersistenceService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';
import { finalize } from 'rxjs';

/**
 * Componente para la edición del correo electrónico del usuario.
 * Sigue el patrón de flujo Formulario -> Éxito/Error.
 */
@Component({
  selector: 'app-user-email-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    TextInputComponent,
    NgIconComponent
  ],
  templateUrl: './user-email-edit.component.html',
  styleUrl: './user-email-edit.component.scss'
})
export class UserEmailEditComponent implements OnInit {
  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly router = inject(Router);

  protected readonly icons = APP_ICONS;

  /** Formulario reactivo para la edición del email */
  emailForm!: FormGroup;

  /** Estado del flujo de actualización */
  status: 'form' | 'loading' | 'success' | 'error' = 'form';

  /** Mensaje de error a mostrar en caso de fallo */
  errorMessage = '';

  /**
   * Inicializa el formulario con el email actual del usuario.
   */
  ngOnInit(): void {
    const currentEmail = this.sessionState.user()?.email || '';
    this.emailForm = new FormGroup({
      email: new FormControl(currentEmail, [Validators.required, Validators.email]),
      confirmEmail: new FormControl(currentEmail, [Validators.required, Validators.email])
    }, {
      validators: this.emailMatchValidator
    });
  }

  /**
   * Procesa el envío del formulario de cambio de email.
   */
  onSubmit(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.status = 'loading';
    const { email } = this.emailForm.value;

    this.sessionPersistence.updateEmail(email)
      .pipe(finalize(() => {
        if (this.status === 'loading') {
          this.status = 'form';
        }
      }))
      .subscribe({
        next: () => {
          this.status = 'success';
        },
        error: (err: unknown) => {
          this.status = 'error';
          this.errorMessage = (err as any).message || 'Error al actualizar el correo electrónico';
        }
      });
  }

  onEmailChange(value: string): void {
    this.emailForm.get('email')?.setValue(value);
    this.emailForm.get('email')?.markAsDirty();
  }

  onEmailBlur(): void {
    this.emailForm.get('email')?.markAsTouched();
  }

  onConfirmEmailChange(value: string): void {
    this.emailForm.get('confirmEmail')?.setValue(value);
    this.emailForm.get('confirmEmail')?.markAsDirty();
  }

  onConfirmEmailBlur(): void {
    this.emailForm.get('confirmEmail')?.markAsTouched();
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

  getValidationState(controlName: string): TextInputValidationState {
    const control = this.emailForm.get(controlName);
    if (!control || (!control.dirty && !control.touched)) return 'none';
    return control.invalid ? 'error' : 'success';
  }

  getError(controlName: string): string {
    const control = this.emailForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['email']) return 'Formato de correo electrónico inválido';

    return '';
  }

  getEmailRepeatValidationState(): TextInputValidationState {
    const control = this.emailForm.get('confirmEmail');
    if (!control || (!control.dirty && !control.touched)) return 'none';
    const hasMismatch = this.emailForm.hasError('mismatch');
    return (control.invalid || hasMismatch) ? 'error' : 'success';
  }

  getEmailRepeatErrorMessage(): string {
    const control = this.emailForm.get('confirmEmail');
    if (!control) return '';
    if (control.errors?.['required']) return 'Debes repetir el correo electrónico';
    if (control.errors?.['email']) return 'Formato de correo electrónico inválido';
    if (this.emailForm.hasError('mismatch')) return 'Los correos electrónicos no coinciden';
    return '';
  }

  private emailMatchValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const email = group.get('email')?.value;
    const confirmEmail = group.get('confirmEmail')?.value;
    return email === confirmEmail ? null : { mismatch: true };
  }
}
