import { Injectable, inject, signal, OnDestroy, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DeviceDetectorService } from 'ngx-device-detector';

/**
 * @class ScreenOrientationService
 * @description
 * Servicio encargado de gestionar la orientación de la pantalla y detectar dispositivos móviles.
 * Proporciona métodos para bloquear la orientación a landscape y señales reactivas para el estado.
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenOrientationService implements OnDestroy {
  private readonly deviceService = inject(DeviceDetectorService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Señal que indica si el dispositivo actual es móvil o tablet (basado en UA y ancho de pantalla) */
  public readonly isMobile = signal<boolean>(false);

  /** Señal reactiva que indica si la pantalla está en sentido vertical (Portrait) */
  public readonly isPortrait = signal<boolean>(this.isBrowser ? window.innerHeight > window.innerWidth : false);

  /** Señal reactiva que indica si ha fallado el intento automático de bloqueo de hardware */
  public readonly rotationFailed = signal<boolean>(false);

  /** Manejador de eventos para cambios de dimensiones/orientación */
  private readonly orientationHandler = () => {
    this.isPortrait.set(window.innerHeight > window.innerWidth);
    this.updateMobileStatus();
  };

  private updateMobileStatus(): void {
    if (this.isBrowser) {
      // Consideramos "mobile" si la librería lo detecta OR si el ancho es menor a 992px (Breakpoint LG de Bootstrap)
      const isMobileByUA = this.deviceService.isMobile() || this.deviceService.isTablet();
      const isMobileByWidth = window.innerWidth < 992;
      this.isMobile.set(isMobileByUA || isMobileByWidth);
    }
  }

  constructor() {
    if (this.isBrowser) {
      this.updateMobileStatus();
      window.addEventListener('resize', this.orientationHandler);
      window.addEventListener('orientationchange', this.orientationHandler);
    }
  }

  /**
   * Implementación de limpieza para el servicio (aunque sea providedIn: root, 
   * se mantiene por buenas prácticas).
   */
  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.orientationHandler);
      window.removeEventListener('orientationchange', this.orientationHandler);
    }
  }

  /** Almacena el estado previo de la orientación antes del bloqueo */
  private previousOrientation: OrientationType | null = null;

  /**
   * Intenta bloquear la pantalla en orientación horizontal (Landscape).
   * Este método es asíncrono y exploratorio. Si las API nativas fallan (Ej: iOS o permisos denegados),
   * emitirá un flag para que la Vista lance un Soft-Lock UI (Pidiendo al usuario que gire).
   */
  async lockLandscape(): Promise<void> {
    if (!this.isBrowser || !this.isMobile()) return;

    this.rotationFailed.set(false); // Reset antes de intentar

    try {
      let locked = false;

      // 1. API Moderna (Screen Orientation API PWA)
      if (screen.orientation && (screen.orientation as any).lock) {
        this.previousOrientation = screen.orientation.type;
        await (screen.orientation as any).lock('landscape');
        locked = true;
      } 
      // 2. APIs de Legacy (Safari antiguo, Firefox OS, etc)
      else {
        const lockFn = (screen as any).lockOrientation || (screen as any).mozLockOrientation || (screen as any).msLockOrientation;
        if (lockFn) {
          locked = lockFn.call(screen, 'landscape');
        }
      }

      // Validar si logramos rotar (en iOS locked quedará false porque no hay APIs disponibles)
      if (!locked) {
        this.rotationFailed.set(true);
      }

    } catch (error) {
      console.warn('ScreenOrientationService: Intervención requerida para rotar (PWA/OS Lock Error)', error);
      this.rotationFailed.set(true);
    }
  }

  /**
   * Libera el bloqueo de orientación, intentando volver al estado previo si existía.
   */
  async unlock(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      if (screen.orientation) {
        // Si teníamos una orientación previa guardada, intentamos volver a ella primero
        if (this.previousOrientation && (screen.orientation as any).lock) {
          const type = this.previousOrientation.includes('portrait') ? 'portrait' : 'landscape';
          try {
            await (screen.orientation as any).lock(type);
          } catch (e) {
            // Ignoramos errores al intentar restaurar, procedemos con el unlock
          }
        }
        
        if (screen.orientation.unlock) {
          screen.orientation.unlock();
        }
        
        this.previousOrientation = null;
      }
    } catch (error) {
      console.warn('ScreenOrientationService: No se pudo liberar la orientación', error);
    }
  }

  /**
   * Gestiona automáticamente el bloqueo y desbloqueo de la orientación basado en el ciclo 
   * de vida del componente que lo solicita.
   * @param destroyRef Referencia de destrucción del llamador (inyectada vía inject(DestroyRef)).
   */
  autoManageOrientation(destroyRef: DestroyRef): void {
    // Bloquear inmediatamente si se cumplen las condiciones
    this.lockLandscape();

    // Registrar el desbloqueo automático para cuando el llamador se destruya
    destroyRef.onDestroy(() => {
      this.unlock();
    });
  }
}
