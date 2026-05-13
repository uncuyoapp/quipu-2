import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe que devuelve la longitud (length) de un arreglo u objeto iterable.
 * Útil para obtener el conteo de elementos directamente en las plantillas.
 * 
 * Uso: `{{ items | length }}`
 */
@Pipe({
  name: 'length',
  standalone: true
})
export class LengthPipe implements PipeTransform {
  /**
   * Transforma una entrada en su longitud numérica.
   * @param value Arreglo u objeto del cual obtener la longitud.
   * @returns El número de elementos.
   */
  transform(value: unknown[] | null | undefined): number {
    return value?.length ?? 0;
  }
}
