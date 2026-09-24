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
 * Componente para la edición del área de trabajo del usuario.
 * Utiliza un campo de texto simple.
 */
@Component({
  selector: 'app-user-work-area-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    TextInputComponent,
    NgIconComponent
  ],
  templateUrl: './user-work-area-edit.component.html',
  styleUrl: './user-work-area-edit.component.scss'
})
export class UserWorkAreaEditComponent implements OnInit {
  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);
  private readonly router = inject(Router);

  protected readonly icons = APP_ICONS;

  /** Formulario reactivo para la edición del área de trabajo */
  workAreaForm!: FormGroup;

  /** Estado del flujo de actualización */
  status: 'form' | 'loading' | 'success' | 'error' = 'form';

  /** Mensaje de error a mostrar en caso de fallo */
  errorMessage = '';

  /**
   * Inicializa el formulario con el área de trabajo actual.
   */
  ngOnInit(): void {
    const currentArea = this.sessionState.user()?.workArea || '';
    this.workAreaForm = new FormGroup({
      workArea: new FormControl(currentArea, [Validators.required, Validators.minLength(2)])
    });
  }

  /**
   * Procesa el envío del formulario de actualización de área de trabajo.
   */
  onSubmit(): void {
    if (this.workAreaForm.invalid) {
      this.workAreaForm.markAllAsTouched();
      return;
    }

    this.status = 'loading';
    const { workArea } = this.workAreaForm.value;

    this.sessionPersistence.updateWorkArea(workArea)
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
          this.errorMessage = extractHttpErrorMessage(err, 'Error al actualizar el área de trabajo.');
        }
      });
  }

  onWorkAreaChange(value: string): void {
    this.workAreaForm.get('workArea')?.setValue(value);
    this.workAreaForm.get('workArea')?.markAsDirty();
  }

  onWorkAreaBlur(): void {
    this.workAreaForm.get('workArea')?.markAsTouched();
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
    const control = this.workAreaForm.get(controlName);
    if (!control || (!control.dirty && !control.touched)) return 'none';
    return control.invalid ? 'error' : 'success';
  }

  getError(controlName: string): string {
    const control = this.workAreaForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) return 'Debe tener al menos 2 caracteres';

    return '';
  }
}
