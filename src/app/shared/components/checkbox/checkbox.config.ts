/**
 * Tamaños disponibles para el checkbox
 */
export type CheckboxSize = 'small' | 'medium' | 'large';

/**
 * Color del checkbox - puede ser un preset de Material o un color personalizado
 */
export type CheckboxColor = 'primary' | 'accent' | 'warn' | (string & {});

/**
 * Interface que define las propiedades de configuración del CheckboxComponent
 */
export interface CheckboxConfig {
  /** Tamaño del checkbox */
  size: CheckboxSize;
  /** Texto del label asociado al checkbox */
  label: string;
  /** Indica si el checkbox está deshabilitado */
  disabled: boolean;
  /** Indica si el checkbox está en estado indeterminado */
  indeterminate: boolean;
  /** Color del checkbox cuando está marcado */
  color: CheckboxColor;
}

/**
 * Valores por defecto para la configuración del CheckboxComponent
 */
export const CHECKBOX_DEFAULT_CONFIG: CheckboxConfig = {
  size: 'medium',
  label: '',
  disabled: false,
  indeterminate: false,
  color: 'primary'
};
