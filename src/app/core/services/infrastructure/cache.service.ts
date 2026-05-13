import { CacheOptions } from '@models/infrastructure/cache.model';
import { Injectable } from '@angular/core';



interface CacheItem<T> {
  value: T;
  expiry: number | null;
}

@Injectable({
  providedIn: 'root'
})
/**
 * Servicio responsable del almacenamiento en caché de los datos de la aplicación.
 * Cuenta con almacenamiento en caché en memoria y local storage con opciones de caducidad.
 */
export class CacheService {
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly CACHE_PREFIX = 'quipu_cache_';

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Carga la caché desde localStorage al iniciar el servicio
   * Nota: Ahora usamos carga perezosa (lazy loading) para mejorar el rendimiento inicial
   */
  private loadCacheFromStorage(): void {
    // No cargamos todos los datos al inicio para mejorar el rendimiento
    // Los datos se cargarán bajo demanda cuando se soliciten
    // Solo limpiamos los datos expirados
    setTimeout(() => {
      this.clearExpired();
    }, 0);
  }

  /**
   * Obtiene un valor de la caché
   * @param key Clave para buscar en la caché
   * @returns El valor almacenado o null si no existe o expiró
   */
  get<T>(key: string): T | null {
    // Primero buscar en memoria (rápido)
    const item = this.cache.get(key);

    if (item) {
      // Si el item no tiene expiración o no ha expirado, retornar el valor
      if (item.expiry === null || item.expiry > Date.now()) {
        return item.value as T;
      }

      // Si el item expiró, eliminarlo y retornar null
      this.remove(key);
      return null;
    }

    // Si no está en memoria, intentar cargarlo desde localStorage (carga perezosa)
    try {
      const storedItem = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (storedItem) {
        const cacheItem = JSON.parse(storedItem) as CacheItem<unknown>;

        // Verificar si ha expirado
        if (cacheItem.expiry === null || cacheItem.expiry > Date.now()) {
          // Guardar en memoria para futuros accesos rápidos
          this.cache.set(key, cacheItem);
          return cacheItem.value as T;
        } else {
          // Si ha expirado, eliminarlo
          localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        }
      }
    } catch (error) {
      console.error(`Error al recuperar ${key} de localStorage:`, error);
    }

    return null;
  }

  /**
   * Almacena un valor en la caché
   * @param key Clave para almacenar el valor
   * @param value Valor a almacenar
   * @param options Opciones de caché (tiempo de vida)
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const expiry = options?.ttl ? Date.now() + options.ttl : null;
    const cacheItem = { value, expiry };

    // Guardar en memoria
    this.cache.set(key, cacheItem);

    try {
      // Guardar en localStorage
      localStorage.setItem(
        `${this.CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      // Si hay un error (por ejemplo, localStorage lleno), intentar limpiar items expirados
      this.clearExpired();
    }
  }

  /**
   * Elimina un valor de la caché
   * @param key Clave del valor a eliminar
   */
  remove(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }

  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear();

    // Eliminar todos los items de localStorage que empiecen con el prefijo
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Limpia la caché que contiene un patrón específico en la clave
   * @param pattern Patrón a buscar en las claves de caché
   */
  clearByPattern(pattern: string): void {
    // Limpiar de la memoria
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });

    // Limpiar de localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(this.CACHE_PREFIX)) {
        const cacheKey = storageKey.substring(this.CACHE_PREFIX.length);
        if (cacheKey.includes(pattern)) {
          localStorage.removeItem(storageKey);
        }
      }
    }
  }

  /**
   * Limpia los elementos expirados de la caché
   */
  clearExpired(): void {
    const now = Date.now();

    // Limpiar de la memoria
    this.cache.forEach((item, key) => {
      if (item.expiry !== null && item.expiry < now) {
        this.remove(key);
      }
    });

    // Limpiar de localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const storedItem = localStorage.getItem(key);
          if (storedItem) {
            const cacheItem = JSON.parse(storedItem) as CacheItem<unknown>;
            if (cacheItem.expiry !== null && cacheItem.expiry < now) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Si hay un error al parsear, eliminar el item
          localStorage.removeItem(key);
        }
      }
    }
  }
}
