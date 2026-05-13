import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

/**
 * Directiva que detecta y notifica clics realizados fuera del elemento host.
 * Útil para cerrar menús desplegables, modales o paneles laterales.
 * 
 * Uso: `<div (appClickOutside)="close()"></div>`
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  /** Evento emitido cuando se detecta un clic fuera del elemento */
  appClickOutside = output<void>();

  private elementRef = inject(ElementRef);

  /**
   * Escucha global de clics en el documento.
   * @param target Elemento sobre el cual se realizó el clic.
   */
  @HostListener('document:click', ['$event.target'])
  public onClick(target: EventTarget | null): void {
    const clickedInside = this.elementRef.nativeElement.contains(target as Node);
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
