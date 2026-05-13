import { Injectable, inject } from '@angular/core';
import { AppDialogService } from './app-dialog.service';

/** 
 * Interfaz temporal para modelar el evento nativo del navegador 'beforeinstallprompt' 
 * que aún no es un estándar definitivo en todos los motores de TS.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

/**
 * @class PwaInstallService
 * @description
 * Servicio encargado de interceptar el intento del navegador de mostrar el
 * banner de instalación nativo genérico. Lo secuestra para poder invocar 
 * un Diálogo propio (AppDialogService) controlado y hermoso, mejorando la 
 * conversión de descargas de la PWA.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  /** Guarda la instancia del evento nativo disparado por Chrome/Edge */
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly appDialog = inject(AppDialogService);

  constructor() {
    this.initInstallInterceptor();
  }

  /**
   * Pone la aplicación en "modo escucha" esperando a ver si el contexto 
   * cumple con todas las reglas PWA para poder ser instalada.
   */
  private initInstallInterceptor(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // 1. Evitar que Chrome muestre su mini-banner nativo sutil en la pantalla inferior
      e.preventDefault();
      
      // 2. Guardar el evento en memoria para lanzarlo después
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      
      // 3. Revisar si no lo hemos molestado en la sesión actual
      const hasIgnoredPrompt = sessionStorage.getItem('quipu_pwa_ignored');
      if (!hasIgnoredPrompt) {
        this.showCustomInstallPrompt();
      }
    });

    // Limpiar evento si finalmente se instaló con éxito 
    // (Ej: El usuario uso el menú nativo del navegador)
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      console.log('Quipu se ha instalado nativamente en el dispositivo.');
    });
  }

  /**
   * Lanza nuestro Pop-up / Dialog modal estilizado por UI.
   */
  public showCustomInstallPrompt(): void {
    if (!this.deferredPrompt) {
      return; 
    }

    this.appDialog.confirm({
      title: 'Instalar Quipu',
      message: 'Te sugerimos instalar la aplicación oficial en tu pantalla de inicio. Obtendrás una experiencia nativa más fluida sin barras de navegación.',
      confirmText: 'Instalar App',
      cancelText: 'Continuar en navegador'
    }).subscribe(confirmed => {
      if (confirmed && this.deferredPrompt) {
        // Lanzar el modal nativo a nivel Sistema Operativo
        this.deferredPrompt.prompt();
        
        // Esperar el resultado de la acción nativa
        this.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Usuario instaló satisfactoriamente.');
          } else {
            console.log('Usuario canceló desde la interfaz C operativa.');
          }
          // Limpiar la instancia, no se puede usar 2 veces
          this.deferredPrompt = null;
        });
      } else {
        // El usuario cerro nuestro modal. 
        // Silenciamos la alerta por el resto de su día (session) para no acosarlo en cambios de ruta.
        sessionStorage.setItem('quipu_pwa_ignored', 'true');
      }
    });
  }
}
