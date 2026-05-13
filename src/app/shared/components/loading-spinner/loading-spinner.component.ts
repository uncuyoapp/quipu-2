import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Componente Loading Spinner reutilizable
 *
 * @description
 * Muestra un indicador de carga (spinner) con soporte para texto opcional y templates personalizados.
 * Utiliza signals de Angular 18+ para una reactividad óptima.
 *
 * @example
 * ```typescript
 * // Uso básico
 * <app-loading-spinner text="Cargando..." />
 *
 * // Con template personalizado
 * <app-loading-spinner [spinnerTemplate]="myTemplate" />
 * ```
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [NgTemplateOutlet, MatProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  /**
   * Texto a mostrar debajo del spinner
   * @default ''
   */
  readonly text = input<string>('');

  /**
   * Template personalizado para reemplazar el spinner por defecto
   * @default null
   */
  readonly spinnerTemplate = input<TemplateRef<any> | null>(null);
}
