/**
 * @fileoverview Componente de input de texto con autocompletado y gestión automática de estados
 * @module text-input.component
 */

import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { APP_ICONS } from '@core/config/icons.config';
import { NgIconComponent } from '@ng-icons/core';
import { TEXT_INPUT_DEFAULT_CONFIG, TextInputType, TextInputValidationState, TextInputVariant } from './text-input.config';

/**
 * Componente de input de texto con capacidades de autocompletado
 * 
 * @component
 * @standalone
 * 
 * @description
 * TextInputComponent es un componente standalone que proporciona un input de texto
 * con funcionalidad de autocompletado avanzada. Utiliza HTML nativo (no Material Input)
 * para tener control total sobre los estilos y signals de Angular para la reactividad.
 * 
 * **Características principales:**
 * - Gestión automática de estados visuales (default, hover, focused, typing, disabled)
 * - Estados de validación manuales (error, success)
 * - Autocompletado con filtrado y highlight de coincidencias
 * - Iconos clickeables con ng-icons
 * - Ícono de limpiar automático al escribir
 * - Dos variantes visuales (default y search)
 * - Soporte para diferentes tipos de input HTML (text, email, password, etc.)
 * 
 * @example
 * ```typescript
 * // Uso básico
 * <app-text-input
 *   [placeholder]="'Buscar ciudad'"
 *   [suggestions]="cities()"
 *   (valueChange)="onSearch($event)" />
 * ```
 * 
 * @example
 * ```typescript
 * // Input de búsqueda con iconos y sugerencias
 * <app-text-input
 *   [variant]="'search'"
 *   [leftIcon]="'heroMagnifyingGlass'"
 *   [suggestions]="['Buenos Aires', 'Córdoba', 'Rosario']"
 *   [minCharsForSuggestions]="2"
 *   (valueChange)="handleSearch($event)"
 *   (optionSelected)="onCitySelected($event)" />
 * ```
 * 
 * @example
 * ```typescript
 * // Input de email con validación de error
 * <app-text-input
 *   [type]="'email'"
 *   [validationState]="'error'"
 *   [errorMessage]="'Email inválido'"
 *   [leftIcon]="'heroEnvelope'"
 *   (valueChange)="validateEmail($event)" />
 * ```
 * 
 * @example
 * ```typescript
 * // Filter input sin borde con fondo
 * <app-text-input
 *   [showBorder]="false"
 *   [backgroundColor]="'#F5F5F5'"
 *   [leftIcon]="'heroFunnel'"
 *   [placeholder]="'Filtrar resultados'"
 *   (valueChange)="onFilter($event)" />
 * ```
 */
@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIconComponent
  ],
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInputComponent {

  // ============================================================================
  // INPUTS - Propiedades configurables desde el componente padre
  // ============================================================================

  /**
   * Identificador único del input. Si no se provee, se genera uno automáticamente.
   * @input
   * @type {string}
   * @default ''
   */
  readonly id = input<string>('');

  /**
   * Valor inicial del input
   * @input
   * @type {string}
   * @default ''
   */
  readonly initialValue = input<string>('');

  /**
   * Texto placeholder que se muestra cuando el input está vacío
   * @input
   * @type {string}
   * @default 'Buscar'
   * @example [placeholder]="'Ingresa tu búsqueda'"
   */
  readonly placeholder = input<string>(TEXT_INPUT_DEFAULT_CONFIG.placeholder);

  /**
   * Tipo de input HTML a renderizar
   * @input
   * @type {TextInputType}
   * @default 'text'
   * @example [type]="'email'"
   * @example [type]="'password'"
   */
  readonly type = input<TextInputType>(TEXT_INPUT_DEFAULT_CONFIG.type);

  /**
   * Variante visual del componente
   * - 'default': Input estándar de 40px de altura
   * - 'search': Input de búsqueda de 56px con border-bottom decorativo
   * @input
   * @type {TextInputVariant}
   * @default 'default'
   * @example [variant]="'search'"
   */
  readonly variant = input<TextInputVariant>(TEXT_INPUT_DEFAULT_CONFIG.variant);

  /**
   * Deshabilita el input y previene la interacción del usuario
   * Aplica fondo gris y cursor not-allowed
   * @input
   * @type {boolean}
   * @default false
   * @example [disabled]="isLoading()"
   */
  readonly disabled = input<boolean>(TEXT_INPUT_DEFAULT_CONFIG.disabled);

  /**
   * Controla la visibilidad del borde del input
   * Útil para crear inputs de filtro con solo fondo de color
   * @input
   * @type {boolean}
   * @default true
   * @example [showBorder]="false"
   */
  readonly showBorder = input<boolean>(TEXT_INPUT_DEFAULT_CONFIG.showBorder);

  /**
   * Color de fondo del contenedor del input
   * Acepta cualquier valor CSS válido
   * @input
   * @type {string}
   * @default 'transparent'
   * @example [backgroundColor]="'#F5F5F5'"
   * @example [backgroundColor]="'rgba(0,0,0,0.05)'"
   */
  readonly backgroundColor = input<string>(TEXT_INPUT_DEFAULT_CONFIG.backgroundColor);

  /**
   * Nombre del ícono izquierdo usando ng-icons
   * El ícono es clickeable y emite el evento leftIconClick
   * @input
   * @type {string}
   * @default ''
   * @example [leftIcon]="'heroMagnifyingGlass'"
   * @example [leftIcon]="'heroFunnel'"
   */
  readonly leftIcon = input<string>(TEXT_INPUT_DEFAULT_CONFIG.leftIcon);

  /**
   * Nombre del ícono derecho usando ng-icons
   * NOTA: Cuando el usuario escribe, este ícono es reemplazado automáticamente
   * por ionClose (ícono de limpiar) que tiene prioridad
   * @input
   * @type {string}
   * @default ''
   * @example [rightIcon]="'heroXMark'"
   */
  readonly rightIcon = input<string>(TEXT_INPUT_DEFAULT_CONFIG.rightIcon);

  /**
   * Texto de ayuda que se muestra debajo del input
   * Solo se muestra cuando validationState es 'none'
   * @input
   * @type {string}
   * @default ''
   * @example [helperText]="'Ingresa al menos 3 caracteres'"
   */
  readonly helperText = input<string>(TEXT_INPUT_DEFAULT_CONFIG.helperText);

  /**
   * Lista de sugerencias para el autocompletado
   * Las sugerencias se filtran automáticamente (case-insensitive) y
   * las coincidencias se resaltan en amarillo
   * @input
   * @type {string[]}
   * @default []
   * @example [suggestions]="['Buenos Aires', 'Córdoba', 'Rosario']"
   */
  readonly suggestions = input<string[]>(TEXT_INPUT_DEFAULT_CONFIG.suggestions);

  /**
   * Cantidad mínima de caracteres necesarios para mostrar sugerencias
   * Evita mostrar listas largas con pocos caracteres escritos
   * @input
   * @type {number}
   * @default 1
   * @example [minCharsForSuggestions]="2"
   */
  readonly minCharsForSuggestions = input<number>(TEXT_INPUT_DEFAULT_CONFIG.minCharsForSuggestions);

  /**
   * Estado de validación del input (controlado por el padre)
   * - 'none': Sin validación, muestra helperText
   * - 'error': Muestra errorMessage en rojo con iconos rojos
   * - 'success': Muestra successMessage en verde con ícono check verde
   * @input
   * @type {TextInputValidationState}
   * @default 'none'
   * @example [validationState]="hasError() ? 'error' : 'none'"
   */
  readonly validationState = input<TextInputValidationState>(TEXT_INPUT_DEFAULT_CONFIG.validationState);

  /**
   * Mensaje de error a mostrar cuando validationState es 'error'
   * @input
   * @type {string}
   * @default ''
   * @example [errorMessage]="'Este campo es requerido'"
   */
  readonly errorMessage = input<string>(TEXT_INPUT_DEFAULT_CONFIG.errorMessage);

  /**
   * Mensaje de éxito a mostrar cuando validationState es 'success'
   * @input
   * @type {string}
   * @default ''
   * @example [successMessage]="'Email verificado correctamente'"
   */
  readonly successMessage = input<string>(TEXT_INPUT_DEFAULT_CONFIG.successMessage);

  /**
   * Atributo autocomplete para el input HTML nativo
   * @input
   * @type {string}
   * @default 'off'
   */
  readonly autocomplete = input<string>(TEXT_INPUT_DEFAULT_CONFIG.autocomplete);

  // ============================================================================
  // OUTPUTS - Eventos emitidos hacia el componente padre
  // ============================================================================

  /**
   * Emite el valor actual del input cada vez que cambia
   * @output
   * @type {OutputEmitterRef<string>}
   * @example (valueChange)="onSearch($event)"
   */
  readonly valueChange = output<string>();

  /**
   * Emite cuando el usuario selecciona una opción del autocompletado
   * @output
   * @type {OutputEmitterRef<string>}
   * @example (optionSelected)="onCitySelected($event)"
   */
  readonly optionSelected = output<string>();

  /**
   * Emite cuando el input recibe el foco
   * @output
   * @type {OutputEmitterRef<void>}
   * @example (focused)="onInputFocus()"
   */
  readonly focused = output<void>();

  /**
   * Emite cuando el input pierde el foco
   * @output
   * @type {OutputEmitterRef<void>}
   * @example (blurred)="onInputBlur()"
   */
  readonly blurred = output<void>();

  /**
   * Emite cuando se hace click en el ícono izquierdo
   * @output
   * @type {OutputEmitterRef<void>}
   * @example (leftIconClick)="toggleFilter()"
   */
  readonly leftIconClick = output<void>();

  /**
   * Emite cuando se hace click en el ícono derecho
   * NOTA: Si el ícono derecho es el de limpiar (automático al escribir),
   * este evento se emite DESPUÉS de ejecutar la función clear()
   * @output
   * @type {OutputEmitterRef<void>}
   * @example (rightIconClick)="onClearClick()"
   */
  readonly rightIconClick = output<void>();

  /**
   * Emite el valor actual del input cuando se presiona la tecla Enter
   * @output
   * @type {OutputEmitterRef<string>}
   */
  readonly enterPressed = output<string>();

  // ============================================================================
  // PROPIEDADES PÚBLICAS
  // ============================================================================

  /**
   * Control de formulario reactivo para manejar el valor del input
   * @public
   * @type {FormControl<string>}
   */
  control = new FormControl('');

  protected readonly icons = APP_ICONS;

  /**
   * Signal que controla la visibilidad del panel de sugerencias
   * @public
   * @type {WritableSignal<boolean>}
   */
  showSuggestions = signal(false);

  // ============================================================================
  // PROPIEDADES PRIVADAS - Signals internos para gestión de estados
  // ============================================================================

  /**
   * Signal que indica si el input tiene el foco actualmente
   * @private
   * @type {WritableSignal<boolean>}
   */
  private readonly isFocused = signal(false);

  /**
   * Signal que indica si el mouse está sobre el input
   * Usado para el estado hover
   * @private
   * @type {WritableSignal<boolean>}
   */
  private readonly isHovered = signal(false);

  /**
   * Signal interno para mantener el valor del input de forma reactiva
   * Necesario porque control.value no es una signal y no actualiza los computed
   * @private
   * @type {WritableSignal<string>}
   */
  private readonly _value = signal('');

  /**
   * ID generado automáticamente para uso interno si no se provee uno
   * @private
   * @readonly
   */
  private readonly _generatedId = `text-input-${Math.random().toString(36).substring(2, 9)}`;

  /**
   * Referencia para limpiar recursos al destruir el componente
   * @private
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * ID del timeout de blur para poder limpiarlo
   * @private
   */
  private blurTimeout: ReturnType<typeof setTimeout> | undefined;

  // ============================================================================
  // COMPUTED SIGNALS - Valores derivados calculados automáticamente
  // ============================================================================

  /**
   * Computed signal que determina el estado visual actual del input
   * 
   * @description
   * Calcula automáticamente el estado visual basándose en la interacción del usuario
   * y las propiedades de validación. El orden de prioridad es:
   * 1. disabled (si está deshabilitado)
   * 2. error (si hay error de validación)
   * 3. success (si hay validación exitosa)
   * 4. focused (si tiene el foco)
   * 5. hover (si el mouse está encima)
   * 6. typing (si tiene contenido)
   * 7. default (estado inicial)
   * 
   * @returns {'disabled'|'error'|'success'|'focused'|'hover'|'typing'|'default'} Estado actual
   * @public
   * @readonly
   */
  readonly currentState = computed(() => {
    if (this.disabled()) return 'disabled';
    if (this.validationState() === 'error') return 'error';
    if (this.validationState() === 'success') return 'success';
    if (this.isFocused()) return 'focused';
    if (this.isHovered()) return 'hover';
    if (this._value() && this._value().length > 0) return 'typing';
    return 'default';
  });

  /**
   * Computed signal que genera las clases CSS dinámicas del componente
   * 
   * @description
   * Genera un objeto de clases CSS basado en:
   * - La variante del componente (default/search)
   * - El estado visual actual
   * - Si tiene o no borde
   * - Si el panel de sugerencias está abierto
   * 
   * @returns {Object} Objeto con clases CSS como keys y boolean como values
   * @public
   * @readonly
   * @example
   * {
   *   'text-input': true,
   *   'text-input--variant-search': true,
   *   'text-input--state-focused': true,
   *   'text-input--no-border': false,
   *   'text-input--suggestions-open': true
   * }
   */
  readonly cssClasses = computed(() => ({
    'text-input': true,
    [`text-input--variant-${this.variant()}`]: true,
    [`text-input--state-${this.currentState()}`]: true,
    'text-input--no-border': !this.showBorder(),
    'text-input--suggestions-open': this.showSuggestions()
  }));

  /**
   * Computed signal que determina el ID final a usar en el input
   * Usa el ID proporcionado o el generado automáticamente
   */
  readonly inputId = computed(() => this.id() || this._generatedId);

  /**
   * Computed signal que filtra las sugerencias basándose en el texto ingresado
   * 
   * @description
   * Filtra la lista de sugerencias usando los siguientes criterios:
   * - Solo filtra si hay al menos minCharsForSuggestions caracteres escritos
   * - Filtrado case-insensitive
   * - Busca coincidencias parciales en cualquier parte del texto
   * - Retorna array vacío si no hay suficientes caracteres o no hay sugerencias
   * 
   * @returns {string[]} Lista filtrada de sugerencias que coinciden con el texto
   * @public
   * @readonly
   * @example
   * // Con suggestions: ['Buenos Aires', 'Córdoba', 'Buenas noches']
   * // Y texto: 'bue'
   * // Retorna: ['Buenos Aires', 'Buenas noches']
   */
  readonly filteredOptions = computed(() => {
    const value = this._normalizar(this._value());
    const suggestions = this.suggestions();
    const minChars = this.minCharsForSuggestions();

    if (!value || value.length < minChars || !suggestions.length) {
      return [];
    }

    return suggestions.filter(option =>
      this._normalizar(option).includes(value)
    );
  });

  /**
   * Computed signal que determina qué ícono derecho mostrar según el estado
   * 
   * @description
   * Lógica de prioridad para el ícono derecho:
   * 
   * **Cuando está escribiendo (typing):**
   * - Si validationState es 'success' → muestra ionCheckmark (no clickeable)
   * - Si validationState es 'error' o 'none' → muestra ionClose (clickeable para limpiar)
   * 
   * **Cuando NO está escribiendo:**
   * - Muestra el rightIcon configurado por el usuario (si existe)
   * 
   * NOTA: El ícono de limpiar (ionClose) tiene prioridad sobre el rightIcon personalizado
   * 
   * @returns {string} Nombre del ícono a mostrar (vacío si no hay ícono)
   * @public
   * @readonly
   */
  readonly effectiveRightIcon = computed(() => {
    const isTyping = this._value() && this._value().length > 0;

    if (isTyping) {
      if (this.validationState() === 'success') {
        return this.icons.status.success;
      }
      return this.icons.actions.close;
    }

    return this.rightIcon();
  });

  /**
   * Computed signal que determina si el ícono derecho es clickeable
   * 
   * @description
   * El ícono derecho NO es clickeable solo en un caso:
   * - Cuando está en estado typing + validationState 'success' (ionCheckmark verde)
   * 
   * En todos los demás casos, si existe un ícono, es clickeable
   * 
   * @returns {boolean} true si el ícono es clickeable
   * @public
   * @readonly
   */
  readonly isRightIconClickable = computed(() => {
    const isTyping = this._value() && this._value().length > 0;

    if (isTyping && this.validationState() === 'success') {
      return false; // ionCheckmark no es clickeable
    }

    return !!this.effectiveRightIcon();
  });

  /**
   * Computed signal que determina si debe ejecutar la función clear() al hacer click
   * 
   * @description
   * Retorna true cuando:
   * - Hay contenido en el input (typing)
   * - Y validationState NO es 'success'
   * 
   * Esto significa que el ícono ionClose ejecutará clear() antes de emitir el evento
   * 
   * @returns {boolean} true si debe limpiar al hacer click
   * @public
   * @readonly
   */
  readonly shouldClearOnRightIconClick = computed(() => {
    const isTyping = this._value() && this._value().length > 0;
    return isTyping && this.validationState() !== 'success';
  });

  /**
   * Computed signal que determina qué mensaje mostrar debajo del input
   * 
   * @description
   * Orden de prioridad:
   * 1. errorMessage (si validationState es 'error')
   * 2. successMessage (si validationState es 'success')
   * 3. helperText (en todos los demás casos)
   * 
   * @returns {string} Mensaje a mostrar (vacío si no hay ninguno)
   * @public
   * @readonly
   */
  readonly displayMessage = computed(() => {
    if (this.validationState() === 'error' && this.errorMessage()) {
      return this.errorMessage();
    }
    if (this.validationState() === 'success' && this.successMessage()) {
      return this.successMessage();
    }
    return this.helperText();
  });

  /**
   * Computed signal que determina si se debe mostrar el botón de ícono derecho
   * 
   * @returns {boolean} true si hay ícono derecho a mostrar
   * @public
   * @readonly
   */
  readonly showRightIconButton = computed(() => !!this.effectiveRightIcon());

  /**
   * Computed signal que determina si se debe mostrar el botón de ícono izquierdo
   * 
   * @returns {boolean} true si hay ícono izquierdo configurado
   * @public
   * @readonly
   */
  readonly showLeftIconButton = computed(() => !!this.leftIcon());

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  /**
   * Constructor del componente
   * 
   * @description
   * Configura los effects necesarios para la sincronización automática:
   * - Sincroniza cambios del control con el output valueChange
   * - Actualiza la visibilidad del panel de sugerencias cuando cambia el valor
   * 
   * @constructor
   */
  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.blurTimeout);
    });

    effect(() => {
      const subscription = this.control.valueChanges.subscribe(value => {
        const newValue = value || '';
        this._value.set(newValue);
        this.valueChange.emit(newValue);
        this.updateSuggestionsVisibility();
      });

      return () => subscription.unsubscribe();
    });

    effect(() => {
      const initialValue = this.initialValue();
      if (initialValue) {
        this.control.setValue(initialValue, { emitEvent: false });
        this._value.set(initialValue);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.disabled()) {
        this.control.disable({ emitEvent: false });
      } else {
        this.control.enable({ emitEvent: false });
      }
    });

    effect(() => {
      // Recalcular visibilidad de sugerencias cuando cambia la lista de sugerencias
      // (por ejemplo, resultados devueltos por una llamada a la API)
      this.suggestions();
      this.updateSuggestionsVisibility();
    }, { allowSignalWrites: true });
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS
  // ============================================================================

  /**
   * Limpia el contenido del input y cierra el panel de sugerencias
   * 
   * @description
   * Esta función:
   * 1. Limpia el valor del FormControl
   * 2. Emite un evento valueChange con string vacío
   * 3. Cierra el panel de sugerencias
   * 
   * Puede ser llamada desde el componente padre usando ViewChild
   * 
   * @public
   * @returns {void}
   * @example
   * // En el componente padre
   * ＠ViewChild(TextInputComponent) textInput!: TextInputComponent;
   * clearSearch() {
   *   this.textInput.clear();
   * }
   */
  clear(): void {
    this.control.setValue('');
    this._value.set('');
    this.valueChange.emit('');
    this.showSuggestions.set(false);
  }

  /**
   * Resalta las coincidencias del texto ingresado en una opción de sugerencia
   * 
   * @description
   * Envuelve el texto coincidente en un tag <mark> para resaltarlo visualmente.
   * El resaltado es case-insensitive pero preserva el case original del texto.
   * 
   * @public
   * @param {string} option - La opción de sugerencia completa
   * @returns {string} HTML string con las coincidencias envueltas en <mark>
   * 
   * @example
   * highlightMatch('Buenos Aires') // con input 'bue'
   * // Retorna: '<mark>Bue</mark>nos Aires'
   * 
   * @example
   * highlightMatch('Argentina') // con input 'gen'
   * // Retorna: 'Ar<mark>gen</mark>tina'
   */
  highlightMatch(option: string): string {
    const value = this._value().trim();
    if (!value) return option;

    // Escapar caracteres especiales y normalizar (quitar tildes del buscador)
    const normalizedSearch = this._normalizar(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Mapa de reemplazo para convertir cada letra en un grupo que incluya sus tildes
    const accentMap: Record<string, string> = {
      'a': '[aáàäâã]',
      'e': '[eéèëê]',
      'i': '[iíìïî]',
      'o': '[oóòöôõ]',
      'u': '[uúùüû]',
      'n': '[nñ]'
    };

    // Construir la regex: cada letra del término normalizado se expande a sus variantes
    const regexSource = normalizedSearch.split('').map(char => accentMap[char] || char).join('');
    const regex = new RegExp(`(${regexSource})`, 'gi');

    return option.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Normaliza un string eliminando diacríticos y convirtiendo a minúsculas.
   * Permite búsquedas insensibles a tildes (ej: "credito" coincide con "crédito").
   * @param valor Texto a normalizar.
   * @returns Texto en minúsculas sin diacríticos.
   */
  private _normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // ============================================================================
  // MANEJADORES DE EVENTOS - Event handlers para interacciones del usuario
  // ============================================================================

  /**
   * Manejador del evento focus del input
   * 
   * @description
   * Cuando el input recibe el foco:
   * 1. Actualiza el signal isFocused a true
   * 2. Emite el evento focused hacia el padre
   * 3. Actualiza la visibilidad de sugerencias si corresponde
   * 
   * @public
   * @returns {void}
   */
  onFocus(): void {
    this.isFocused.set(true);
    this.focused.emit();
    this.updateSuggestionsVisibility();
  }

  /**
   * Manejador del evento blur del input
   * 
   * @description
   * Cuando el input pierde el foco:
   * 1. Espera 200ms (para permitir clicks en sugerencias)
   * 2. Actualiza el signal isFocused a false
   * 3. Emite el evento blurred hacia el padre
   * 4. Cierra el panel de sugerencias
   * 
   * NOTA: El setTimeout es crucial para que los clicks en sugerencias
   * se procesen antes de cerrar el panel
   * 
   * @public
   * @returns {void}
   */
  onBlur(): void {
    clearTimeout(this.blurTimeout);
    this.blurTimeout = setTimeout(() => {
      this.isFocused.set(false);
      this.blurred.emit();
      this.showSuggestions.set(false);
    }, 200);
  }

  /**
   * Manejador del evento mouseenter en el contenedor del input
   * 
   * @description
   * Activa el estado hover solo si el input no está deshabilitado
   * 
   * @public
   * @returns {void}
   */
  onMouseEnter(): void {
    if (!this.disabled()) {
      this.isHovered.set(true);
    }
  }

  /**
   * Manejador del evento mouseleave en el contenedor del input
   * 
   * @description
   * Desactiva el estado hover
   * 
   * @public
   * @returns {void}
   */
  onMouseLeave(): void {
    this.isHovered.set(false);
  }

  /**
   * Manejador de selección de una opción del autocompletado
   * 
   * @description
   * Cuando el usuario hace click en una sugerencia:
   * 1. Establece el valor del control con la opción seleccionada
   * 2. Emite el evento optionSelected con el valor
   * 3. Cierra el panel de sugerencias
   * 
   * @public
   * @param {string} value - Valor de la opción seleccionada
   * @returns {void}
   * @example
   * // El usuario hace click en 'Buenos Aires'
   * // Se ejecuta: onOptionSelected('Buenos Aires')
   */
  onOptionSelected(value: string): void {
    this.control.setValue(value);
    this.optionSelected.emit(value);
    this.showSuggestions.set(false);
  }

  /**
   * Manejador del click en el ícono izquierdo
   * 
   * @description
   * Emite el evento leftIconClick solo si el input no está deshabilitado
   * 
   * @public
   * @returns {void}
   */
  onLeftIconClick(): void {
    if (!this.disabled()) {
      this.leftIconClick.emit();
    }
  }

  /**
   * Manejador del click en el ícono derecho
   * 
   * @description
   * Lógica de ejecución:
   * 1. Verifica que el input no esté deshabilitado y que el ícono sea clickeable
   * 2. Si debe limpiar (shouldClearOnRightIconClick), ejecuta clear() primero
   * 3. Siempre emite el evento rightIconClick al final
   * 
   * IMPORTANTE: Para el ícono de limpiar automático (ionClose), se ejecuta
   * clear() ANTES de emitir el evento, permitiendo al padre reaccionar después
   * de que el input ya esté limpio
   * 
   * @public
   * @returns {void}
   * @example
   * // Usuario escribe "test" y hace click en ionClose
   * // 1. Se ejecuta clear() → input queda vacío
   * // 2. Se emite rightIconClick → padre puede hacer algo adicional
   */
  onRightIconClick(): void {
    if (!this.disabled() && this.isRightIconClickable()) {
      if (this.shouldClearOnRightIconClick()) {
        this.clear();
      }
      this.rightIconClick.emit();
    }
  }

  /**
   * Manejador del evento keydown.enter
   * Emite el valor actual cuando se presiona Enter
   * 
   * @public
   * @returns {void}
   */
  onEnterPressed(): void {
    if (!this.disabled()) {
      this.enterPressed.emit(this._value());
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - Utilidades internas del componente
  // ============================================================================

  /**
   * Actualiza la visibilidad del panel de sugerencias
   * 
   * @description
   * El panel se muestra solo cuando:
   * - Hay opciones filtradas disponibles
   * - Y el input tiene el foco
   * 
   * Se oculta en cualquier otro caso
   * 
   * @private
   * @returns {void}
   */
  private updateSuggestionsVisibility(): void {
    const hasFiltered = this.filteredOptions().length > 0;
    const isFocused = this.isFocused();
    this.showSuggestions.set(hasFiltered && isFocused);
  }
}