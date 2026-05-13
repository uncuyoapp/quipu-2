import { Injectable, signal } from '@angular/core';

export interface LoadingState {
    isLoading: boolean;
    text?: string;
}

export const QUIPU_MESSAGES = [
    "Desenredando nudos como un buen tejedxr andinx de datos...",
    "Pidiéndole a los Apus que ordenen estos cerros de información...",
    "Consultando a la llama oráculo… no siempre acierta, pero es simpática.",
    "Tejiendo tramas digitales con paciencia milenaria...",
    "Afilando el tumi para cortar datos que no sirven...",
    "Buscando patrones entre los nudos como si fueran historias ancestrales...",
    "Trazando líneas entre visualizaciones y valles sagrados...",
    "Entrenando a una alpaca para que transporte estos datos… paciencia...",
    "Interpretando señales del Inti para descifrar esta consulta...",
    "Cruzando quebradas informacionales como un verdadero chasqui...",
    "Invocando a los espíritus del data-binding para que cooperan...",
    "Reuniendo fibras sueltas de datos para tejer una idea clara...",
    "Dibujando un quipu digital con hilos de visualización...",
    "Tomando matecito mientras esperamos que el dataset se acomode...",
    "Ordenando estos hilos informativos mejor que un curandero ordena energías...",
    "Puliendo estas métricas hasta que brillen como el sol del Inti Raymi...",
    "Soplando la quena para ver si estos datos se alinean...",
    "Cargando información con la precisión de un arquitecto incaico...",
    "Sacudiéndole el polvo del camino a este dataset viajero...",
    "Persuadiendo a los datos rebeldes para que se dejen visualizar..."
];

/**
 * @class LoadingService
 * @description Servicio encargado de gestionar el estado de carga global de la aplicación.
 * Proporciona un mecanismo sincronizado (mediante un contador) para mostrar y ocultar
 * un spinner/pantalla de carga con mensajes aleatorios o personalizados.
 */
@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    /** Estado reactivo del loading */
    readonly loadingState = signal<LoadingState>({ isLoading: false });

    private counter = 0;
    private rotationInterval: ReturnType<typeof setInterval> | null = null;
    private lastMessage: string | null = null;
    private currentMessage: string | null = null;

    /**
     * Incrementa el contador de carga y activa el estado de 'isLoading'.
     * Si es la primera llamada (o el contador estaba en 0), selecciona un mensaje.
     * @param customText Texto opcional para mostrar en lugar de los mensajes aleatorios.
     */
    show(customText?: string) {
        const wasIdle = this.counter === 0;  // 👈 detectar si el loading estaba apagado

        this.counter++;

        if (wasIdle) {
            // 👈 solo si pasamos de 0 → 1 elegimos un mensaje
            const message = customText ?? this.randomMessage();
            this.currentMessage = message;

            this.loadingState.set({
                isLoading: true,
                text: message
            });

            this.startRotation();
        } else {
            // 👈 si el spinner ya estaba visible, NO cambiar mensaje
            this.loadingState.update(state => ({
                ...state,
                isLoading: true,
                text: this.currentMessage!
            }));
        }
    }

    /**
     * Decrementa el contador de carga. Si el contador llega a 0,
     * desactiva el estado de 'isLoading' y detiene la rotación de mensajes.
     */
    hide() {
        this.counter--;

        if (this.counter <= 0) {
            this.counter = 0;
            this.stopRotation();
            this.currentMessage = null;

            this.loadingState.set({ isLoading: false });
        }
    }

    /**
     * Reinicia forzosamente el contador de carga y oculta el spinner independientemente
     * del número de llamadas pendientes a 'show()'.
     */
    reset() {
        this.counter = 0;
        this.stopRotation();
        this.currentMessage = null;
        this.loadingState.set({ isLoading: false });
    }

    private randomMessage(): string {
        let msg;
        do {
            msg = QUIPU_MESSAGES[Math.floor(Math.random() * QUIPU_MESSAGES.length)];
        } while (msg === this.lastMessage);

        this.lastMessage = msg;
        return msg;
    }

    private startRotation() {
        if (this.rotationInterval) return;

        this.rotationInterval = setInterval(() => {
            if (!this.loadingState().isLoading) return;

            const msg = this.randomMessage();
            this.currentMessage = msg;

            this.loadingState.update(state => ({
                ...state,
                text: msg
            }));

        }, 2500);
    }

    private stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
        }
    }
}
