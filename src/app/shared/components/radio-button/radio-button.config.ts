/**
 * Orientación disponible para el grupo de radio buttons
 */
export type RadioGroupOrientation = 'horizontal' | 'vertical';

/**
 * Colores disponibles para los radio buttons
 */
export type RadioColor = 'primary' | 'accent' | 'warn';

/**
 * Interface que representa una opción individual de radio button
 */
export interface RadioOption<T = any> {
  /** Valor único de la opción */
  value: T;
  /** Texto a mostrar como label */
  label: string;
  /** Indica si esta opción está deshabilitada */
  disabled?: boolean;
}

/**
 * Interface que define las propiedades de configuración del RadioButtonComponent
 */
export interface RadioButtonConfig {
  /** Orientación del grupo de radio buttons */
  orientation: RadioGroupOrientation;
  /** Color de los radio buttons cuando están seleccionados */
  color: RadioColor;
  /** Indica si todo el grupo está deshabilitado */
  disabled: boolean;
  /** Nombre del grupo de radio buttons (para accesibilidad) */
  name: string;
}

/**
 * Valores por defecto para la configuración del RadioButtonComponent
 */
export const RADIO_BUTTON_DEFAULT_CONFIG: RadioButtonConfig = {
  orientation: 'vertical',
  color: 'primary',
  disabled: false,
  name: 'radio-group'
};