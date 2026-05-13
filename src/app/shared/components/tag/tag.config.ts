export type TagVariant = 'pill' | 'default';
export type TagAppearance = 'filled' | 'outlined';
export type TagSize = 'large' | 'medium' | 'small';
export type TagPalette = 'blue' | 'red' | 'green' | 'gray' | 'purple' | 'white' | 'orange';
export type TagIconPosition = 'left' | 'right';

export interface TagConfig {
  label: string;
  variant?: TagVariant;
  appearance?: TagAppearance;
  size?: TagSize;
  palette?: TagPalette;
  icon?: string;
  iconPosition?: TagIconPosition;
  background?: string;
  disabled?: boolean;
}

export const TAG_VARIANTS: Record<TagVariant, string> = {
  pill: 'pill',
  default: 'default'
} as const;

export const TAG_APPEARANCES: Record<TagAppearance, string> = {
  filled: 'filled',
  outlined: 'outlined'
} as const;

export const TAG_SIZES: Record<TagSize, string> = {
  large: 'large',
  medium: 'medium',
  small: 'small'
} as const;

export const TAG_PALETTES: Record<TagPalette, string> = {
  blue: 'blue',
  red: 'red',
  green: 'green',
  gray: 'gray',
  purple: 'purple',
  white: 'white',
  orange: 'orange'
} as const;

export const TAG_ICON_POSITIONS: Record<TagIconPosition, string> = {
  left: 'left',
  right: 'right'
} as const;

export const TAG_DEFAULTS: Required<Omit<TagConfig, 'label' | 'icon' | 'background'>> = {
  variant: 'default',
  appearance: 'filled',
  size: 'medium',
  palette: 'blue',
  iconPosition: 'right',
  disabled: false
} as const;

// Color palettes
export interface TagColorPalette {
  filled: {
    default: { background: string; color: string };
    hover: { background: string; color: string };
    active: { background: string; color: string };
  };
  outlined: {
    default: { background: string; color: string; border: string };
    hover: { background: string; color: string; border: string };
    active: { background: string; color: string; border: string };
  };
}

export const TAG_COLOR_PALETTES: Record<TagPalette, TagColorPalette> = {
  blue: {
    filled: {
      default: { background: 'var(--q-primary-bg)', color: 'var(--q-primary)' },
      hover: { background: 'var(--q-primary-light)', color: 'var(--q-primary-dark)' },
      active: { background: 'var(--q-primary)', color: 'var(--q-white)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-primary)', border: 'var(--q-primary)' },
      hover: { background: 'var(--q-primary-bg)', color: 'var(--q-primary-dark)', border: 'var(--q-primary-dark)' },
      active: { background: 'var(--q-primary-light)', color: 'var(--q-primary-dark)', border: 'var(--q-primary-dark)' }
    }
  },
  red: {
    filled: {
      default: { background: 'var(--q-danger-bg)', color: 'var(--q-danger)' },
      hover: { background: 'var(--q-danger)', color: 'var(--q-white)' },
      active: { background: 'var(--q-danger)', color: 'var(--q-white)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-danger)', border: 'var(--q-danger)' },
      hover: { background: 'var(--q-danger-bg)', color: 'var(--q-danger)', border: 'var(--q-danger)' },
      active: { background: 'var(--q-danger)', color: 'var(--q-white)', border: 'var(--q-danger)' }
    }
  },
  green: {
    filled: {
      default: { background: 'var(--q-success-bg)', color: 'var(--q-success)' },
      hover: { background: 'var(--q-success)', color: 'var(--q-white)' },
      active: { background: 'var(--q-success)', color: 'var(--q-white)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-success)', border: 'var(--q-success)' },
      hover: { background: 'var(--q-success-bg)', color: 'var(--q-success)', border: 'var(--q-success)' },
      active: { background: 'var(--q-success)', color: 'var(--q-white)', border: 'var(--q-success)' }
    }
  },
  gray: {
    filled: {
      default: { background: 'var(--q-gray-100)', color: 'var(--q-gray-600)' },
      hover: { background: 'var(--q-gray-200)', color: 'var(--q-gray-800)' },
      active: { background: 'var(--q-gray-600)', color: 'var(--q-white)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-gray-600)', border: 'var(--q-gray-300)' },
      hover: { background: 'var(--q-gray-100)', color: 'var(--q-gray-800)', border: 'var(--q-gray-400)' },
      active: { background: 'var(--q-gray-200)', color: 'var(--q-gray-900)', border: 'var(--q-gray-500)' }
    }
  },
  purple: {
    filled: {
      default: { background: 'var(--q-comp-1-bg)', color: 'var(--q-comp-1)' }, // Usando comp-1 como alternativa si no hay purple
      hover: { background: 'var(--q-comp-1)', color: 'var(--q-white)' },
      active: { background: 'var(--q-comp-1)', color: 'var(--q-white)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-comp-1)', border: 'var(--q-comp-1)' },
      hover: { background: 'var(--q-comp-1-bg)', color: 'var(--q-comp-1)', border: 'var(--q-comp-1)' },
      active: { background: 'var(--q-comp-1)', color: 'var(--q-white)', border: 'var(--q-comp-1)' }
    }
  },
  white: {
    filled: {
      default: { background: 'transparent', color: 'var(--q-white)' },
      hover: { background: 'transparent', color: 'var(--q-gray-400)' },
      active: { background: 'transparent', color: 'var(--q-gray-500)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-gray-700)', border: 'var(--q-gray-200)' },
      hover: { background: 'var(--q-gray-100)', color: 'var(--q-gray-900)', border: 'var(--q-gray-400)' },
      active: { background: 'var(--q-gray-200)', color: 'var(--q-gray-900)', border: 'var(--q-gray-500)' }
    }
  },
  orange: {
    filled: {
      default: { background: 'var(--q-warning-bg)', color: 'var(--q-warning)' },
      hover: { background: 'var(--q-warning)', color: 'var(--q-white)' },
      active: { background: 'var(--q-warning)', color: 'var(--q-white)' }
    },
    outlined: {
      default: { background: 'transparent', color: 'var(--q-warning)', border: 'var(--q-warning)' },
      hover: { background: 'var(--q-warning-bg)', color: 'var(--q-warning)', border: 'var(--q-warning)' },
      active: { background: 'var(--q-warning)', color: 'var(--q-white)', border: 'var(--q-warning)' }
    }
  }
};