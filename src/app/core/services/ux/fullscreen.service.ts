import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';

/**
 * @service FullscreenService
 * @description
 * Servicio centralizado para gestionar el modo de pantalla completa (nativo o pseudo-css).
 * Permite alternar la visualización de componentes para que ocupen todo el viewport
 * de forma consistente en toda la aplicación.
 */
@Injectable({
  providedIn: 'root',
})
export class FullscreenService implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  /** Estado reactivo del elemento actualmente en pantalla completa (modo CSS) */
  private readonly activeElement = signal<HTMLElement | null>(null);

  /** Estado reactivo para sincronización con la API nativa */
  private readonly isNativeActive = signal<boolean>(false);

  /** 
   * Modo de operación actual. 
   * 'css': Simula pantalla completa usando estilos (position fixed).
   * 'native': Utiliza la API requestFullscreen del navegador.
   */
  private readonly mode = signal<'css' | 'native'>('css');

  constructor() {
    this.setupListeners();
  }

  /**
   * Comprueba si un elemento específico es el que está en pantalla completa.
   * @param element El elemento a verificar.
   */
  isActive(element: HTMLElement) {
    return computed(() => {
      if (this.mode() === 'native') {
        return this.isNativeActive() && this.document.fullscreenElement === element;
      }
      return this.activeElement() === element;
    });
  }

  /**
   * Alterna el estado de pantalla completa para el elemento proporcionado.
   * @param element Elemento del DOM a expandir.
   */
  async toggle(element: HTMLElement): Promise<void> {
    const active = this.isActive(element)();
    if (active) {
      await this.exit();
    } else {
      await this.enter(element);
    }
  }

  /**
   * Activa el modo de pantalla completa para un elemento.
   * @param element Elemento del DOM a expandir.
   */
  async enter(element: HTMLElement): Promise<void> {
    if (this.mode() === 'native') {
      try {
        await element.requestFullscreen();
      } catch (err) {
        console.warn('FullscreenService: Error al solicitar fullscreen nativo, reintentando con CSS.', err);
        this.enterCSS(element);
      }
    } else {
      this.enterCSS(element);
    }
  }

  /**
   * Sale de cualquier modo de pantalla completa activo.
   */
  async exit(): Promise<void> {
    if (this.mode() === 'native' && this.document.fullscreenElement) {
      await this.document.exitFullscreen();
    } else {
      this.exitCSS();
    }
  }

  private enterCSS(element: HTMLElement): void {
    this.activeElement.set(element);
    this.document.body.style.overflow = 'hidden';
    this.triggerResize();
  }

  private exitCSS(): void {
    this.activeElement.set(null);
    this.document.body.style.overflow = '';
    this.triggerResize();
  }

  /**
   * Dispara un evento de redimensionamiento global para notificar a componentes
   * dependientes del tamaño (como ECharts o tablas dinámicas).
   */
  private triggerResize(): void {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  private setupListeners(): void {
    // Listener para la tecla ESC (necesario para el modo CSS)
    this.document.addEventListener('keydown', this.handleEsc);

    // Listener para cambios nativos (F11, API del navegador, etc.)
    this.document.addEventListener('fullscreenchange', this.handleNativeChange);
  }

  private handleEsc = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.activeElement()) {
      this.exitCSS();
    }
  };

  private handleNativeChange = (): void => {
    this.isNativeActive.set(!!this.document.fullscreenElement);
    if (!this.document.fullscreenElement) {
      // Si salimos del modo nativo, aseguramos limpieza de estados CSS por si acaso
      this.exitCSS();
    }
  };

  ngOnDestroy(): void {
    this.document.removeEventListener('keydown', this.handleEsc);
    this.document.removeEventListener('fullscreenchange', this.handleNativeChange);
  }
}
