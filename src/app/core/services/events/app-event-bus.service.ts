import { Injectable, isDevMode } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppEventType } from '../../models/events/app-event.types';
import { AppEvent } from '../../models/events/app-event.interface';

/**
 * Servicio de Bus de Eventos Global (EventBus).
 * Proporciona un mecanismo de comunicación desacoplado basado en un patrón
 * Publisher/Subscriber fuertemente tipado mediante TypeScript.
 * 
 * Este bus permite que diferentes partes de la aplicación (Servicios, Componentes)
 * reaccionen a eventos sin conocer quién los emitió, facilitando la implementación
 * de funcionalidades transversales como Logs, Analytics o Gamificación.
 */
@Injectable({
  providedIn: 'root'
})
export class AppEventBusService {
  /** 
   * Flujo principal de eventos. 
   * Usamos Subject (y no BehaviorSubject) porque los eventos son transitorios.
   */
  private readonly eventSubject = new Subject<AppEvent>();

  constructor() {
    // Logger opcional en desarrollo para facilitar la trazabilidad del sistema de eventos
    if (isDevMode()) {
      this.eventSubject.asObservable().subscribe(event => {
        console.groupCollapsed(`%c ⚡ EventBus: ${event.type} `, 'color: #7b1fa2; font-weight: bold;');
        console.log('Payload:', event.payload);
        console.groupEnd();
      });
    }
  }

  /**
   * Emite un nuevo evento al bus global.
   * Gracias a la Unión Discriminada, TypeScript validará que el payload coincida
   * exactamente con lo definido para ese tipo de evento.
   * 
   * @param event El objeto evento que cumple con la interfaz AppEvent.
   */
  emit(event: AppEvent): void {
    this.eventSubject.next(event);
  }

  /**
   * Permite suscribirse a un tipo específico de evento con tipado estricto.
   * El observable resultante emitirá eventos donde el payload está correctamente inferido.
   * 
   * @example
   * this.eventBus.on(AppEventType.VISUALIZATION_OPENED).subscribe(ev => {
   *   console.log(ev.payload.id); // 'id' está tipado como string | number
   * });
   * 
   * @param type El tipo de evento (AppEventType) al que deseamos suscribirnos.
   * @returns Un Observable filtrado y tipado según el tipo solicitado.
   */
  on<T extends AppEventType>(type: T): Observable<Extract<AppEvent, { type: T }>> {
    return this.eventSubject.asObservable().pipe(
      filter((event): event is Extract<AppEvent, { type: T }> => event.type === type)
    );
  }
}
