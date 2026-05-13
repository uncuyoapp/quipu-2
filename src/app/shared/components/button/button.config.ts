export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'link' | 'icon-only' | 'icon-circle';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonPalette = 'blue' | 'red' | 'green' | 'gray' | 'purple' | 'white' | 'pink' | 'white-navbar';
export type IconPosition = 'left' | 'right';
export type ButtonHtmlType = 'button' | 'submit' | 'reset';

/**
 * Colores específicos de cada paleta
 */
export interface PaletteColors {
  // Colores sólidos (backgrounds)
  solid: string;
  solidHover: string;
  solidActive: string;

  // Color de texto e iconos
  text: string;
  textHover: string;
  textActive: string;

  // Color de borde
  border: string;
  borderHover: string;
  borderActive: string;

  // Color de contraste (para texto sobre fondos sólidos)
  contrast: string;
}

/**
 * Definición de paletas de colores disponibles
 */
export const PALETTE_COLORS: Record<ButtonPalette, PaletteColors> = {
  blue: {
    solid: 'var(--q-primary)',
    solidHover: 'var(--q-primary-dark)',
    solidActive: 'var(--q-primary-dark)',
    text: 'var(--q-primary)',
    textHover: 'var(--q-primary-dark)',
    textActive: 'var(--q-primary-dark)',
    border: 'var(--q-primary)',
    borderHover: 'var(--q-primary-dark)',
    borderActive: 'var(--q-primary-dark)',
    contrast: 'var(--q-white)'
  },
  red: {
    solid: 'var(--q-danger)',
    solidHover: 'var(--q-snack-error)',
    solidActive: 'var(--q-snack-error)',
    text: 'var(--q-danger)',
    textHover: 'var(--q-snack-error)',
    textActive: 'var(--q-snack-error)',
    border: 'var(--q-danger)',
    borderHover: 'var(--q-snack-error)',
    borderActive: 'var(--q-snack-error)',
    contrast: 'var(--q-white)'
  },
  green: {
    solid: 'var(--q-success)',
    solidHover: 'var(--q-snack-success)',
    solidActive: 'var(--q-snack-success)',
    text: 'var(--q-success)',
    textHover: 'var(--q-snack-success)',
    textActive: 'var(--q-snack-success)',
    border: 'var(--q-success)',
    borderHover: 'var(--q-snack-success)',
    borderActive: 'var(--q-snack-success)',
    contrast: 'var(--q-white)'
  },
  gray: {
    solid: 'var(--q-gray-600)',
    solidHover: 'var(--q-gray-700)',
    solidActive: 'var(--q-gray-800)',
    text: 'var(--q-gray-600)',
    textHover: 'var(--q-gray-700)',
    textActive: 'var(--q-gray-800)',
    border: 'var(--q-gray-600)',
    borderHover: 'var(--q-gray-700)',
    borderActive: 'var(--q-gray-800)',
    contrast: 'var(--q-white)'
  },
  purple: {
    solid: 'var(--q-comp-1)',
    solidHover: 'var(--q-comp-1)',
    solidActive: 'var(--q-comp-1)',
    text: 'var(--q-comp-1)',
    textHover: 'var(--q-comp-1)',
    textActive: 'var(--q-comp-1)',
    border: 'var(--q-comp-1)',
    borderHover: 'var(--q-comp-1)',
    borderActive: 'var(--q-comp-1)',
    contrast: 'var(--q-white)'
  },
  white: {
    solid: 'var(--q-white)',
    solidHover: 'var(--q-gray-100)',
    solidActive: 'var(--q-gray-200)',
    text: 'var(--q-gray-700)',
    textHover: 'var(--q-gray-900)',
    textActive: 'var(--q-gray-900)',
    border: 'var(--q-gray-300)',
    borderHover: 'var(--q-gray-400)',
    borderActive: 'var(--q-gray-500)',
    contrast: 'var(--q-gray-800)'
  },
  pink: {
    solid: 'var(--q-comp-1)',
    solidHover: 'var(--q-comp-1)',
    solidActive: 'var(--q-comp-1)',
    text: 'var(--q-comp-1)',
    textHover: 'var(--q-comp-1)',
    textActive: 'var(--q-comp-1)',
    border: 'var(--q-comp-1)',
    borderHover: 'var(--q-comp-1)',
    borderActive: 'var(--q-comp-1)',
    contrast: 'var(--q-white)'
  },
  'white-navbar': {
    solid: 'var(--q-white)',
    solidHover: 'rgba(255, 255, 255, 0.1)',
    solidActive: 'rgba(255, 255, 255, 0.2)',
    text: 'var(--q-white)',
    textHover: 'var(--q-white)',
    textActive: 'var(--q-white)',
    border: 'var(--q-white)',
    borderHover: 'var(--q-white)',
    borderActive: 'var(--q-white)',
    contrast: 'var(--q-primary)'
  }
};

/**
 * Configuración completa de props del ButtonComponent
 */
export interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  palette?: ButtonPalette;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: IconPosition;
  htmlType?: ButtonHtmlType;
  ripple?: boolean;
  pulse?: boolean;
  ariaLabel?: string;
}

/**
 * Configuración por defecto del ButtonComponent
 */
export const DEFAULT_BUTTON_CONFIG: Required<Omit<ButtonProps, 'icon' | 'ariaLabel'>> = {
  label: 'Button',
  variant: 'primary',
  palette: 'blue',
  size: 'medium',
  disabled: false,
  loading: false,
  iconPosition: 'left',
  htmlType: 'button',
  ripple: true,
  pulse: false
}

/**
 * Duración del efecto ripple en milisegundos
 */
export const RIPPLE_DURATION = 600;