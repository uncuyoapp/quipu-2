import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import { ButtonHtmlType, ButtonPalette, ButtonSize, ButtonVariant, DEFAULT_BUTTON_CONFIG, IconPosition, PALETTE_COLORS, RIPPLE_DURATION } from './button.config';

interface RippleState {
  active: boolean;
  x: number;
  y: number;
}

/**
 * Button Component (Angular 18+ with Signals)
 * 
 * Componente de botón moderno usando Signals y nueva API de control flow.
 * Soporta múltiples variantes, tamaños, paletas de colores, estados y efectos visuales.
 * 
 * @example
 * ```html
 * <app-button 
 *   label="Guardar"
 *   variant="primary"
 *   palette="blue"
 *   [loading]="isLoading()"
 *   (btnClick)="onSave()">
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    NgIconComponent
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  // ============================================
  // Inputs (usando la nueva API de signals)
  // ============================================

  /** Texto que se muestra en el botón */
  readonly label = input<string>(DEFAULT_BUTTON_CONFIG.label);

  /** Variante visual del botón (primary, secondary, text, link, icon-only, icon-circle) */
  readonly variant = input<ButtonVariant>(DEFAULT_BUTTON_CONFIG.variant);

  /** Paleta de colores del botón (blue, red, green, gray, purple, white) */
  readonly palette = input<ButtonPalette>(DEFAULT_BUTTON_CONFIG.palette);

  /** Tamaño del botón (small, medium, large) */
  readonly size = input<ButtonSize>(DEFAULT_BUTTON_CONFIG.size);

  /** Deshabilita el botón y previene interacciones */
  readonly disabled = input<boolean>(DEFAULT_BUTTON_CONFIG.disabled);

  /** Muestra spinner de carga y deshabilita el botón */
  readonly loading = input<boolean>(DEFAULT_BUTTON_CONFIG.loading);

  /** Nombre del icono de ionicons (ej: 'ionCheckmark') */
  readonly icon = input<string | undefined>(undefined);

  /** Posición del icono relativa al texto (left, right) */
  readonly iconPosition = input<IconPosition>(DEFAULT_BUTTON_CONFIG.iconPosition);

  /** Tipo HTML del elemento button */
  readonly htmlType = input<ButtonHtmlType>(DEFAULT_BUTTON_CONFIG.htmlType);

  /** Habilita el efecto visual ripple al hacer click */
  readonly ripple = input<boolean>(DEFAULT_BUTTON_CONFIG.ripple);

  /** Habilita el efecto de pulsación para llamar la atención */
  readonly pulse = input<boolean>(DEFAULT_BUTTON_CONFIG.pulse);

  /** Label de accesibilidad ARIA (opcional, por defecto usa el label) */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Referencia al elemento del componente */
  readonly elementRef = inject(ElementRef);

  // ============================================
  // Outputs (usando la nueva API de signals)
  // ============================================

  /** Emitido cuando se hace click en el botón */
  readonly btnClick = output<Event>();

  // ============================================
  // Internal State (Signals)
  // ============================================

  protected readonly icons = APP_ICONS;

  /** Estado reactivo del efecto ripple */
  protected readonly rippleState = signal<RippleState>({
    active: false,
    x: 0,
    y: 0
  });

  // ============================================
  // Computed Signals
  // ============================================

  /** Determina si el botón está deshabilitado (disabled o loading) */
  protected readonly isDisabled = computed(() =>
    this.disabled() || this.loading()
  );

  /** Obtiene los colores de la paleta seleccionada */
  protected readonly paletteColors = computed(() =>
    PALETTE_COLORS[this.palette()]
  );

  /** Genera las clases CSS del botón */
  protected readonly buttonClasses = computed(() => {
    const classes = [
      'btn',
      `btn--${this.variant()}`,
      `btn--${this.size()}`
    ];

    if (this.pulse() && !this.isDisabled()) {
      classes.push('btn--pulse');
    }

    return classes.join(' ');
  });

  /** Genera los estilos CSS dinámicos para la paleta de colores */
  protected readonly buttonStyles = computed(() => {
    const colors = this.paletteColors();
    return {
      '--btn-solid': colors.solid,
      '--btn-solid-hover': colors.solidHover,
      '--btn-solid-active': colors.solidActive,
      '--btn-text': colors.text,
      '--btn-text-hover': colors.textHover,
      '--btn-text-active': colors.textActive,
      '--btn-border': colors.border,
      '--btn-border-hover': colors.borderHover,
      '--btn-border-active': colors.borderActive,
      '--btn-contrast': colors.contrast
    };
  });

  /** Obtiene el tamaño del icono según el tamaño del botón */
  protected readonly iconSize = computed(() => {
    const sizeMap = {
      small: '16',
      medium: '18',
      large: '20'
    } as const;
    return sizeMap[this.size()];
  });

  /** Obtiene el aria-label efectivo */
  protected readonly effectiveAriaLabel = computed(() =>
    this.ariaLabel() || this.label() || 'Button'
  );

  /** Determina si es una variante de solo icono */
  protected readonly isIconVariant = computed(() =>
    this.variant() === 'icon-only' || this.variant() === 'icon-circle'
  );

  /** Determina si debe mostrar el icono en la posición izquierda */
  protected readonly showIconLeft = computed(() =>
    this.icon() && this.iconPosition() === 'left' && !this.isIconVariant()
  );

  /** Determina si debe mostrar el icono en la posición derecha */
  protected readonly showIconRight = computed(() =>
    this.icon() && this.iconPosition() === 'right' && !this.isIconVariant()
  );

  /** Determina si debe mostrar el spinner de loading a la izquierda */
  protected readonly showLoadingLeft = computed(() =>
    this.loading() && (!this.icon() || this.iconPosition() === 'left') && !this.isIconVariant()
  );

  /** Determina si debe mostrar el spinner de loading a la derecha */
  protected readonly showLoadingRight = computed(() =>
    this.loading() && this.icon() && this.iconPosition() === 'right' && !this.isIconVariant()
  );

  /** Determina si debe mostrar el efecto ripple */
  protected readonly shouldShowRipple = computed(() =>
    this.ripple() && this.variant() !== 'icon-only'
  );

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Maneja el evento click del botón
   * - Previene el evento si el botón está deshabilitado
   * - Crea el efecto ripple si está habilitado
   * - Emite el evento click
   * 
   * @param event El evento de click original.
   */
  protected handleClick(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.ripple()) {
      this.createRippleEffect(event as MouseEvent);
    }

    this.btnClick.emit(event);
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Crea el efecto visual ripple en la posición del click
   * 
   * @param event El evento de mouse que desencadenó el ripple.
   */
  private createRippleEffect(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    this.rippleState.set({
      active: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });

    setTimeout(() => {
      this.rippleState.set({
        active: false,
        x: 0,
        y: 0
      });
    }, RIPPLE_DURATION);
  }
}