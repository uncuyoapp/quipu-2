import { Dimension } from '@models/domain/dataset.model';

/**
 * Retorna una copia profunda e inmutable de las dimensiones garantizando
 * que tanto cada dimensión como cada ítem tengan 'selected: true' por defecto.
 *
 * @param dims Arreglo de dimensiones crudas o parciales.
 * @returns Nuevo arreglo de dimensiones con objetos e ítems normalizados.
 */
export function normalizeDimensions(dims: Dimension[]): Dimension[] {
  return (dims || []).map((dim) => ({
    ...dim,
    selected: dim.selected ?? true,
    items: (dim.items || []).map((item) => ({
      ...item,
      selected: item.selected ?? true,
    })),
  }));
}
