/**
 * Colores disponibles para el switch
 */
export type SwitchColor = 'primary' | 'accent' | 'warn';

/**
 * Interface que define las propiedades de configuración del SwitchComponent
 */
export interface SwitchConfig {
  /** Texto del label asociado al switch */
  label: string;
  /** Posición del label respecto al switch */
  labelPosition: 'before' | 'after';
  /** Indica si el switch está deshabilitado */
  disabled: boolean;
  /** Color del switch cuando está activado */
  color: SwitchColor;
  /** Indica si se debe mostrar el estado on/off como texto */
  showStateText: boolean;
  /** Texto para el estado ON */
  onText: string;
  /** Texto para el estado OFF */
  offText: string;
}

/**
 * Valores por defecto para la configuración del SwitchComponent
 */
export const SWITCH_DEFAULT_CONFIG: SwitchConfig = {
  label: '',
  labelPosition: 'after',
  disabled: false,
  color: 'primary',
  showStateText: false,
  onText: 'ON',
  offText: 'OFF'
};