import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { getThematicIllustrationPath, THEMATIC_ILLUSTRATIONS } from '@core/config/illustrations.config';
import { Thematic } from '@models/domain/thematic.model';
import { EditModeService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { TextInputValidationState } from '@shared/components/text-input/text-input.config';

@Component({
  selector: 'app-thematic-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, ButtonComponent, TextInputComponent],
  templateUrl: './thematic-dialog.component.html',
  styleUrl: './thematic-dialog.component.scss'
})
export class ThematicDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ThematicDialogComponent>);
  public readonly data = inject<{ thematic?: Thematic }>(MAT_DIALOG_DATA);
  private readonly editModeService = inject(EditModeService);

  public thematicForm!: FormGroup;
  public isEditMode = false;

  public readonly defaultColor = 'var(--q-primary)';

  public readonly illustrations = [...THEMATIC_ILLUSTRATIONS];
  public readonly getThematicIllustrationPath = getThematicIllustrationPath;

  ngOnInit(): void {
    this.editModeService.registerHidingModal();
    this.isEditMode = !!this.data?.thematic;
    this.initForm();
  }

  ngOnDestroy(): void {
    this.editModeService.unregisterHidingModal();
  }

  private initForm(): void {
    const thematic = this.data?.thematic;
    let currentIllustration = '';

    // Función auxiliar para extraer el nombre del archivo de una ruta
    const getFilename = (path: string | undefined) => {
      if (!path) return '';
      return path.split('/').pop() || '';
    };

    // Intentamos extraer de illustration
    const illuName = getFilename(thematic?.illustration);

    if (this.illustrations.includes(illuName as any)) {
      currentIllustration = illuName;
    } else {
      currentIllustration = this.illustrations[0];
    }

    // Color por defecto si no viene uno
    const currentColor = thematic?.color || this.defaultColor;

    this.thematicForm = this.fb.group({
      name: [thematic?.name || '', [Validators.required, Validators.minLength(3)]],
      color: [currentColor, [Validators.required]], // Mantenemos el color que venga aunque no esté en swatch
      illustration: [currentIllustration, [Validators.required]]
    });

    // Pequeño timeout para dar tiempo a que el DOM se renderice y podamos hacer scroll
    setTimeout(() => {
      this.scrollToSelectedIllustration();
    }, 150);
  }

  private scrollToSelectedIllustration(): void {
    const activeItem = document.querySelector('.illustration-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }



  selectIllustration(illustration: string): void {
    this.thematicForm.patchValue({ illustration });
    setTimeout(() => this.scrollToSelectedIllustration(), 50);
  }

  onNameChange(name: string): void {
    this.thematicForm.patchValue({ name }, { emitEvent: false });
  }

  onNameBlur(): void {
    this.thematicForm.get('name')?.markAsTouched();
  }

  getNameValidationState(): TextInputValidationState {
    const control = this.thematicForm.get('name');
    if (control?.invalid && control?.touched) return 'error';
    return 'none';
  }

  getNameErrorMessage(): string {
    const control = this.thematicForm.get('name');
    if (control?.hasError('required')) return 'El nombre es obligatorio';
    if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
    return '';
  }

  /**
   * Maneja el evento de la rueda del ratón para permitir scroll horizontal
   * en el contenedor de ilustraciones.
   */
  onWheel(event: WheelEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (container && event.deltaY !== 0) {
      // Prevenir el scroll vertical de la página
      event.preventDefault();
      // Aplicar el movimiento vertical de la rueda al scroll horizontal
      container.scrollLeft += event.deltaY;
    }
  }

  onSave(): void {
    if (this.thematicForm.valid) {
      // Mapeamos los campos simplificados a la estructura de Thematic
      const formValue = this.thematicForm.value;
      const result: Partial<Thematic> = {
        ...this.data?.thematic,
        name: formValue.name,
        color: formValue.color,
        illustration: formValue.illustration
      };
      this.dialogRef.close(result);
    } else {
      this.thematicForm.markAllAsTouched();
    }
  }
}
