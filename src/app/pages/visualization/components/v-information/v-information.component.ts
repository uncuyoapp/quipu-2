import { Component, OnInit, inject, input, output } from '@angular/core';
import { APP_ICONS } from '@core/config/icons.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { InformationEditEvent, Visualization } from '@models/domain/visualization.model';
import { NgIconComponent } from '@ng-icons/core';
import { AppEventBusService, EditModeService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TagComponent } from '@shared/components/tag/tag.component';

/**
 * @class VInformationComponent
 * @description
 * Componente que renderiza de manera estática y editable los valores cualitativos
 * de la visualización (título, ficha técnica, metadata, etc.).
 * Habilita el modo `contenteditable` y controles de edición rápida cuando es permitido.
 */
@Component({
  selector: 'app-v-information',
  standalone: true,
  imports: [
    NgIconComponent,
    ButtonComponent,
    TagComponent
  ],
  templateUrl: './v-information.component.html',
  styleUrl: './v-information.component.scss'
})
export class VInformationComponent implements OnInit {
  /** Señal de solo lectura que contiene el estado global e inyectado de la visualización */
  visualization = input.required<Visualization>();

  /** 
   * Evento despachado hacia arriba cuando el componente muta su estado interno 
   * tras una edición válida del usuario.
   */
  edited = output<InformationEditEvent>();

  /** Determina si la información extendida debe estar expandida por defecto. */
  expandMetadata = input<boolean>(false);

  /** Bandera booleana para mostrar u ocultar la información extendida de la "Ficha Técnica" */
  showMoreInfo = false;

  ngOnInit() {
    if (this.expandMetadata()) {
      this.showMoreInfo = true;
    }
  }

  /** Servicio accesible públicamente por la plantilla para condicionar atributos HTML según el estado global */
  public readonly editMode = inject(EditModeService);

  private readonly eventBus = inject(AppEventBusService);

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Alterna la visibilidad local de la ficha técnica renderizada */
  onClickShowMore(): void {
    this.showMoreInfo = !this.showMoreInfo;
    this.eventBus.emit({
      type: AppEventType.VISUALIZATION_TECHNICAL_SHEET_TOGGLED,
      payload: { id: this.visualization().id, expanded: this.showMoreInfo }
    });
  }

  /**
   * Captura el evento nativo blur() dictado en HTML a los elementos editables (h1, span, p) 
   * y mapea ese texto al respectivo key del modelo de datos de visualización.
   * Valida en línea valores vacíos o reservados, formatea strings simples y arreglos (funcionarios).
   * 
   * @param event El evento de teclado o mouse que finaliza el ciclo en el nodo.
   * @param field Propiedad literal mapeada de Visualization Object.
   * @param isTechnicalSheet Booleano flagueado por template para asignar a objeto anidado `technicalSheet`.
   */
  onFieldChange(event: Event, field: string, isTechnicalSheet = false): void {
    const el = event.target as HTMLElement;
    let newValue: string | string[] = el.innerText.trim();
    if (newValue === 'Clic para editar' || newValue === '-') newValue = '';

    // Si es responsible, es un array de strings parseado por coma
    if (field === 'responsible') {
      newValue = newValue ? (newValue as string).split(',').map((s: string) => s.trim()) : [];
    }

    this.edited.emit({ field, value: newValue, isTechnicalSheet });
  }

  /**
   * Posiciona forzosamente el foco y el rango de selección de Windows native
   * para cubrir todo el texto en el nodo DOM objetivo cuando se apreta el botón Editar del lapicito.
   * 
   * @param fieldId ID de elemento HTML válido y contenido con el rol documentable.
   */
  focusField(fieldId: string): void {
    const el = document.getElementById(fieldId);
    if (el) {
      el.focus();
      // Select all text natively allowing easy override by user typing
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  /**
   * Vacía el nodo desde el lapicito tachado e intercepta su valor programático
   * gatillando el blur que captura y limpia la propiedad en objeto JS.
   * 
   * @param fieldId ID de elemento HTML.
   */
  clearField(fieldId: string): void {
    const el = document.getElementById(fieldId);
    if (el) {
      el.innerText = '';
      el.focus();
      el.dispatchEvent(new Event('blur'));
    }
  }
}
