/**
 * @fileoverview Configuración y tipos para el componente TextInput
 * @module text-input.config
 */

/**
 * Variantes visuales disponibles para el componente TextInput
 * 
 * @typedef {('default'|'search')} TextInputVariant
 * 
 * @property {'default'} default - Input estándar de 40px de altura con borde normal
 * @property {'search'} search - Input de búsqueda de 56px de altura con border-bottom decorativo interno
 * 
 * @example
 * // Input estándar
 * <app-text-input [variant]="'default'" />
 * 
 * @example
 * // Input de búsqueda con altura mayor
 * <app-text-input [variant]="'search'" />
 */
export type TextInputVariant = 'default' | 'search';

/**
 * Estados de validación que el componente padre puede establecer manualmente
 * 
 * @typedef {('none'|'error'|'success')} TextInputValidationState
 * 
 * @property {'none'} none - Sin validación, muestra helperText si existe
 * @property {'error'} error - Estado de error, muestra errorMessage en rojo con iconos rojos
 * @property {'success'} success - Estado de éxito, muestra successMessage en verde con ícono check verde
 * 
 * @example
 * // Input con error de validación
 * <app-text-input 
 *   [validationState]="'error'" 
 *   [errorMessage]="'Campo requerido'" />
 * 
 * @example
 * // Input con validación exitosa
 * <app-text-input 
 *   [validationState]="'success'" 
 *   [successMessage]="'Guardado correctamente'" />
 */
export type TextInputValidationState = 'none' | 'error' | 'success';

/**
 * Tipos de input HTML estándar disponibles
 * 
 * @typedef {('text'|'email'|'password'|'tel'|'url'|'search'|'number')} TextInputType
 * 
 * @property {'text'} text - Texto normal (por defecto)
 * @property {'email'} email - Input para correos electrónicos con validación HTML5
 * @property {'password'} password - Input para contraseñas con caracteres ocultos
 * @property {'tel'} tel - Input para números telefónicos
 * @property {'url'} url - Input para URLs con validación HTML5
 * @property {'search'} search - Input de búsqueda (comportamiento nativo del navegador)
 * @property {'number'} number - Input numérico con controles de incremento/decremento
 * 
 * @example
 * // Input de email
 * <app-text-input [type]="'email'" [placeholder]="'usuario@ejemplo.com'" />
 * 
 * @example
 * // Input de contraseña
 * <app-text-input [type]="'password'" [placeholder]="'Ingresa tu contraseña'" />
 */
export type TextInputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number';

/**
 * Interface que define las propiedades de configuración del TextInputComponent
 * 
 * @interface TextInputConfig
 * 
 * @description
 * Define todas las propiedades configurables del componente TextInput.
 * Cada propiedad tiene un valor por defecto definido en TEXT_INPUT_DEFAULT_CONFIG.
 */
export interface TextInputConfig {
  /**
   * Texto que se muestra cuando el input está vacío
   * @type {string}
   * @default 'Buscar'
   */
  placeholder: string;

  /**
   * Tipo de input HTML a renderizar
   * @type {TextInputType}
   * @default 'text'
   */
  type: TextInputType;

  /**
   * Variante visual del componente
   * @type {TextInputVariant}
   * @default 'default'
   */
  variant: TextInputVariant;

  /**
   * Indica si el input está deshabilitado
   * Cuando está deshabilitado, el input tiene fondo gris y no responde a interacciones
   * @type {boolean}
   * @default false
   */
  disabled: boolean;

  /**
   * Controla si se muestra el borde del input
   * Útil para crear inputs de filtro con solo fondo de color
   * @type {boolean}
   * @default true
   */
  showBorder: boolean;

  /**
   * Color de fondo del contenedor del input
   * Acepta cualquier valor CSS válido de color
   * @type {string}
   * @default 'transparent'
   * @example '#F5F5F5' para inputs de filtro con fondo gris
   */
  backgroundColor: string;

  /**
   * Nombre del ícono izquierdo usando la librería ng-icons
   * El ícono es clickeable y emite el evento leftIconClick
   * @type {string}
   * @default ''
   * @example 'heroMagnifyingGlass' para ícono de búsqueda
   * @example 'heroFunnel' para ícono de filtro
   */
  leftIcon: string;

  /**
   * Nombre del ícono derecho usando la librería ng-icons
   * Cuando el usuario escribe, este ícono es reemplazado automáticamente por el ícono de limpiar
   * @type {string}
   * @default ''
   * @example 'heroXMark' para ícono de cerrar/limpiar
   */
  rightIcon: string;

  /**
   * Texto de ayuda que se muestra debajo del input
   * Solo se muestra cuando validationState es 'none'
   * @type {string}
   * @default ''
   * @example 'Ingresa al menos 3 caracteres'
   */
  helperText: string;

  /**
   * Lista de sugerencias para el autocompletado
   * Las sugerencias se filtran automáticamente según el texto ingresado (case-insensitive)
   * El texto coincidente se resalta en amarillo
   * @type {string[]}
   * @default []
   * @example ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza']
   */
  suggestions: string[];

  /**
   * Cantidad mínima de caracteres que el usuario debe escribir antes de mostrar las sugerencias
   * Ayuda a evitar mostrar una lista muy larga de sugerencias con pocos caracteres
   * @type {number}
   * @default 1
   * @example 2 // Mostrar sugerencias solo después de escribir 2 caracteres
   */
  minCharsForSuggestions: number;

  /**
   * Estado de validación del input controlado manualmente por el componente padre
   * @type {TextInputValidationState}
   * @default 'none'
   */
  validationState: TextInputValidationState;

  /**
   * Mensaje de error a mostrar cuando validationState es 'error'
   * Se muestra en rojo debajo del input y los iconos también se vuelven rojos
   * @type {string}
   * @default ''
   * @example 'Este campo es requerido'
   * @example 'El email no es válido'
   */
  errorMessage: string;

  /**
   * Mensaje de éxito a mostrar cuando validationState es 'success'
   * Se muestra en verde debajo del input y aparece un ícono check verde
   * @type {string}
   * @default ''
   * @example 'Guardado correctamente'
   * @example 'Email verificado'
   */
  successMessage: string;
 
  /**
   * Atributo autocomplete para el input HTML nativo
   * @type {string}
   * @default 'off'
   * @example 'current-password'
   * @example 'new-password'
   * @example 'email'
   */
  autocomplete: string;
}

/**
 * Valores por defecto para la configuración del TextInputComponent
 * 
 * @constant {TextInputConfig}
 * 
 * @description
 * Configuración por defecto aplicada cuando no se especifican valores en los inputs.
 * Estos valores representan el comportamiento estándar del componente.
 * 
 * @example
 * // Usar valores por defecto
 * <app-text-input /> // Usa todos los valores de TEXT_INPUT_DEFAULT_CONFIG
 * 
 * @example
 * // Override solo algunos valores
 * <app-text-input 
 *   [placeholder]="'Buscar productos'"
 *   [leftIcon]="'heroMagnifyingGlass'" />
 * // El resto de propiedades usa los valores por defecto
 */
export const TEXT_INPUT_DEFAULT_CONFIG: TextInputConfig = {
  placeholder: 'Buscar',
  type: 'text',
  variant: 'default',
  disabled: false,
  showBorder: true,
  backgroundColor: 'transparent',
  leftIcon: '',
  rightIcon: '',
  helperText: '',
  suggestions: [],
  minCharsForSuggestions: 1,
  validationState: 'none',
  errorMessage: '',
  successMessage: '',
  autocomplete: 'off'
};