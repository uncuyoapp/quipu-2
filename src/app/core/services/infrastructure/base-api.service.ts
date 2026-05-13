import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SILENT_HTTP } from '../../http/tokens';
import { CacheService } from './cache.service';
import { ApiRequestOptions, ApiParams } from '@models/infrastructure/api.model';



/** Tipo para los parámetros de consulta de la API */


/**
 * Servicio base para el manejo de peticiones HTTP a la API.
 * Proporciona métodos comunes para GET, POST y almacenamiento en caché, 
 * así como el manejo de encabezados de autorización.
 */
@Injectable()
export abstract class BaseApiService {
  protected baseUrl: string;
  protected headers: HttpHeaders;
  protected cacheService = inject(CacheService);

  protected http = inject(HttpClient);

  constructor() {
    this.baseUrl = `${environment.apiUrl}/${environment.apiVersion}`;
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Realiza una petición HTTP GET al endpoint especificado.
   * 
   * @param endpoint El endpoint de la API a solicitar.
   * @param params Parámetros de consulta opcionales.
   * @param options Opciones adicionales para la petición (ej. caché, modo silencioso).
   * @returns Un observable con los datos de la respuesta.
   */
  protected get<T>(endpoint: string, params?: ApiParams, options?: ApiRequestOptions): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;

    const context = new HttpContext().set(SILENT_HTTP, !!options?.silent);

    // Si se solicita usar caché, intentar obtener el valor de la caché
    if (options?.useCache) {
      const cacheKey = this.generateCacheKey(url, httpParams);
      const cachedData = this.cacheService.get<T>(cacheKey);

      if (cachedData) {
        return of(cachedData);
      }

      // Si no hay datos en caché, realizar la petición y guardar en caché
      return this.http.get<T>(url, {
        headers: this.headers,
        params: httpParams,
        withCredentials: true,
        context
      }).pipe(
        tap(response => {
          this.cacheService.set(cacheKey, response, options.cacheOptions);
        })
      );
    }

    // Si no se solicita usar caché, realizar la petición normalmente
    return this.http.get<T>(url, {
      headers: this.headers,
      params: httpParams,
      withCredentials: true,
      context
    });
  }

  /**
   * Realiza una petición HTTP POST al endpoint especificado.
   * 
   * @param endpoint El endpoint de la API a solicitar.
   * @param body Los datos a enviar en el cuerpo de la petición.
   * @returns Un observable con los datos de la respuesta.
   */
  protected post<T>(endpoint: string, body: unknown): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http.post<T>(url, body, {
      headers: this.headers,
      withCredentials: true,
    });
  }

  /**
   * Realiza una petición HTTP PUT al endpoint especificado.
   * 
   * @param endpoint El endpoint de la API a solicitar.
   * @param body Los datos a enviar en el cuerpo de la petición.
   * @returns Un observable con los datos de la respuesta.
   */
  protected put<T>(endpoint: string, body: unknown): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http.put<T>(url, body, {
      headers: this.headers,
      withCredentials: true,
    });
  }

  /**
   * Realiza una petición HTTP DELETE al endpoint especificado.
   * 
   * @param endpoint El endpoint de la API a solicitar.
   * @returns Un observable con los datos de la respuesta.
   */
  protected delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http.delete<T>(url, {
      headers: this.headers,
      withCredentials: true,
    });
  }

  /**
   * Realiza una petición HTTP GET que espera una respuesta de tipo Blob (ej. descarga de archivo).
   * 
   * @param endpoint El endpoint de la API a solicitar.
   * @param params Parámetros de consulta opcionales.
   * @returns Un observable que contiene el archivo como un Blob.
   */
  protected getBlob(endpoint: string, params?: HttpParams): Observable<Blob> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http.get(url, {
      headers: this.headers,
      params,
      responseType: 'blob',
      withCredentials: true,
    });
  }

  /**
   * Establece el token de autorización en los encabezados de petición por defecto.
   * 
   * @param token La cadena del token JWT o Bearer.
   */
  public setAuthorizationToken(token: string): void {
    this.headers = this.headers.set('Authorization', `Bearer ${token}`);
  }

  /**
   * Elimina el token de autorización de los encabezados de petición por defecto.
   */
  public removeAuthorizationToken(): void {
    this.headers = this.headers.delete('Authorization');
  }

  /**
   * Genera una clave única para la caché basada en la URL y los parámetros
   * @param url URL de la petición
   * @param params Parámetros de la petición
   * @returns Clave única para la caché
   */
  private generateCacheKey(url: string, params?: HttpParams): string {
    if (!params) {
      return url;
    }

    // Convertir los parámetros a un string ordenado para asegurar consistencia
    const paramString = params.keys()
      .sort()
      .map(key => {
        const values = params.getAll(key);
        if (values) {
          return `${key}=${values.sort().join(',')}`;
        }
        return `${key}=`;
      })
      .join('&');

    return `${url}?${paramString}`;
  }

  /**
   * Limpia la caché para un endpoint específico
   * @param endpoint Endpoint para el cual limpiar la caché
   * @param params Parámetros opcionales para identificar la caché específica
   */
  protected clearCache(endpoint: string, params?: ApiParams): void {
    const url = `${this.baseUrl}/${endpoint}`;
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
    const cacheKey = this.generateCacheKey(url, httpParams);
    this.cacheService.remove(cacheKey);
  }

}
