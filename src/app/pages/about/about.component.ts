import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { environment } from '@environments/environment';
import { AppEventBusService, SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TagComponent } from '@shared/components/tag/tag.component';

/**
 * Componente para la página institucional "Acerca de".
 * Gestiona la visualización de información institucional y la versión de la app.
 * Implementa un bloqueo de scroll global para asegurar un diseño de mural en desktop.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TagComponent, ButtonComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit, OnDestroy {
  // ============================================
  // Dependencias e Inyectables
  // ============================================

  /** Referencia al documento para manipulación del DOM raíz. */
  private readonly document = inject(DOCUMENT);

  /** Motor de renderizado de Angular para manipulación segura del DOM. */
  private readonly renderer = inject(Renderer2);

  /** Estado de la sesión para obtener la unidad de información actual. */
  public readonly sessionState = inject(SessionStateService);

  /** Bus de eventos global. */
  private readonly eventBus = inject(AppEventBusService);

  // ============================================
  // Propiedades Públicas
  // ============================================

  /** Configuración gráfica centralizada para la vista About */
  public readonly graphics = SECTION_GRAPHICS.about;

  /** Versión actual de la aplicación extraída del entorno. */
  public readonly version = environment.appVersion;

  // ============================================
  // Ciclo de Vida
  // ============================================

  /**
   * Inicialización del componente.
   * Aplica un bloqueo de scroll al body para permitir el layout de scroll interno.
   */
  public ngOnInit(): void {
    this.eventBus.emit({ type: AppEventType.ABOUT_PAGE_VIEWED });
    if (this.document.body) {
      this.renderer.addClass(this.document.body, 'no-scroll-view');
    }
  }

  /**
   * Abre una URL externa en una nueva pestaña.
   * @param url Dirección web a abrir.
   */
  public openUrl(url: string): void {
    window.open(url, '_blank');
  }

  /**
   * Destrucción del componente.
   * Limpia la clase de bloqueo de scroll para restaurar el comportamiento normal de la app.
   */
  public ngOnDestroy(): void {
    if (this.document.body) {
      this.renderer.removeClass(this.document.body, 'no-scroll-view');
    }
  }
}
