import { Thematic } from '@models/domain/thematic.model';

/**
 * @class ThematicFactory
 * @description
 * Fábrica estática encargada de la manipulación lógica del árbol de temáticas.
 * Contiene métodos puros para la búsqueda, filtrado y transformación inmutable del árbol.
 */
export class ThematicFactory {
  /**
   * Busca una temática por su ID de manera recursiva.
   * @param items Arreglo (nivel del árbol) donde buscar.
   * @param id ID objetivo.
   * @returns La temática encontrada o undefined.
   */
  public static findRecursively(items: Thematic[], id: number): Thematic | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.childrens?.length) {
        const found = this.findRecursively(item.childrens, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  /**
   * Obtiene todos los IDs descendientes de una temática raíz (incluyéndola).
   * @param items Árbol completo o rama.
   * @param id ID de la temática raíz de la búsqueda.
   * @returns Listado plano de IDs.
   */
  public static getDescendantIds(items: Thematic[], id: number): number[] {
    const thematic = this.findRecursively(items, id);
    if (!thematic) return [];

    const ids: number[] = [];
    const collectIds = (node: Thematic) => {
      ids.push(node.id);
      node.childrens?.forEach(collectIds);
    };

    collectIds(thematic);
    return ids;
  }

  /**
   * Actualiza un nodo en el árbol de manera inmutable.
   * @param items Árbol actual.
   * @param id ID del nodo a actualizar.
   * @param updated Datos a fusionar en el nodo.
   * @returns Nuevo árbol con el nodo actualizado.
   */
  public static updateNode(items: Thematic[], id: number, updated: Thematic): Thematic[] {
    return items.map((item) => {
      if (item.id === id) return { ...item, ...updated };
      if (item.childrens?.length) {
        return { ...item, childrens: this.updateNode(item.childrens, id, updated) };
      }
      return item;
    });
  }

  /**
   * Añade un nuevo nodo como hijo de un padre específico.
   * @param items Árbol actual.
   * @param parentId ID del nodo padre.
   * @param newNode Nodo a añadir.
   * @returns Nuevo árbol con el nodo insertado.
   */
  public static addNode(items: Thematic[], parentId: number, newNode: Thematic): Thematic[] {
    return items.map((item) => {
      if (item.id === parentId) {
        return { ...item, childrens: [...(item.childrens || []), newNode] };
      }
      if (item.childrens?.length) {
        return { ...item, childrens: this.addNode(item.childrens, parentId, newNode) };
      }
      return item;
    });
  }

  /**
   * Elimina un nodo del árbol por su ID.
   * @param items Árbol actual.
   * @param id ID del nodo a eliminar.
   * @returns Nuevo árbol sin el nodo especificado.
   */
  public static removeNode(items: Thematic[], id: number): Thematic[] {
    return items
      .filter((item) => item.id !== id)
      .map((item) => {
        if (item.childrens?.length) {
          return { ...item, childrens: this.removeNode(item.childrens, id) };
        }
        return item;
      });
  }

  /**
   * Reordena los nodos de un nivel específico según una lista de IDs.
   * @param items Árbol actual.
   * @param orderedIds Lista de IDs en el nuevo orden.
   * @param parentId ID del padre donde reordenar (undefined para nivel raíz).
   * @returns Nuevo árbol reordenado.
   */
  public static reorderNodes(items: Thematic[], orderedIds: number[], parentId?: number): Thematic[] {
    if (!parentId) {
      const itemMap = new Map(items.map((i) => [i.id, i]));
      return orderedIds.map((id) => itemMap.get(id)!).filter(Boolean);
    }

    return items.map((item) => {
      if (item.id === parentId && item.childrens) {
        const childMap = new Map(item.childrens.map((c) => [c.id, c]));
        return {
          ...item,
          childrens: orderedIds.map((id) => childMap.get(id)!).filter(Boolean),
        };
      }
      if (item.childrens?.length) {
        return { ...item, childrens: this.reorderNodes(item.childrens, orderedIds, parentId) };
      }
      return item;
    });
  }

  /**
   * Asigna colores a las temáticas de nivel raíz basándose en una paleta.
   * @param items Árbol de temáticas.
   * @param palette Arreglo de strings con códigos hexadecimales.
   * @returns Nuevo árbol con colores asignados.
   */
  public static assignColors(items: Thematic[], palette: string[]): Thematic[] {
    if (!palette.length) return items;

    return items.map((thematic, index) => ({
      ...thematic,
      color: palette[index % palette.length]
    }));
  }
}
