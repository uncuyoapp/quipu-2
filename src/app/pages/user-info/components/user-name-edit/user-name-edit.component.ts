import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import { SessionPersistenceService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';
import { extractHttpErrorMessage } from '@core/utils/http-error.utils';
import { finalize } from 'rxjs';

/**
 * Componente para la edición del nombre y apellido del usuario.
 */
@Component({
  selector: 'app-user-name-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    TextInputComponent,
    NgIconComponent
  ],
  templateUrl: './user-name-edit.component.html',
  styleUrl: './user-name-edit.component.scss'
})
export class UserNameEditComponent implements OnInit {
  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly router = inject(Router);

  protected readonly icons = APP_ICONS;

  /** Formulario reactivo para la edición del nombre */
  nameForm!: FormGroup;

  /** Estado del flujo de actualización */
  status: 'form' | 'loading' | 'success' | 'error' = 'form';

  /** Mensaje de error a mostrar en caso de fallo */
  errorMessage = '';

  /**
   * Inicializa el formulario con el nombre actual del usuario.
   */
  ngOnInit(): void {
    const currentName = this.sessionState.user()?.name || '';
    this.nameForm = new FormGroup({
      name: new FormControl(currentName, [Validators.required, Validators.minLength(3)])
    });
  }

  /**
   * Procesa el envío del formulario de actualización de nombre.
   */
  onSubmit(): void {
    if (this.nameForm.invalid) {
      this.nameForm.markAllAsTouched();
      return;
    }

    this.status = 'loading';
    const { name } = this.nameForm.value;

    this.sessionPersistence.updateName(name)
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
          this.errorMessage = extractHttpErrorMessage(err, 'Error al actualizar el nombre.');
        }
      });
  }

  onNameChange(value: string): void {
    this.nameForm.get('name')?.setValue(value);
    this.nameForm.get('name')?.markAsDirty();
  }

  onNameBlur(): void {
    this.nameForm.get('name')?.markAsTouched();
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
    const control = this.nameForm.get(controlName);
    if (!control || (!control.dirty && !control.touched)) return 'none';
    return control.invalid ? 'error' : 'success';
  }

  getError(controlName: string): string {
    const control = this.nameForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) return 'Debe tener al menos 3 caracteres';

    return '';
  }
}
