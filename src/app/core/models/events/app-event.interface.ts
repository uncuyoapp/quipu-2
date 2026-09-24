import { AppEventType } from './app-event.types';

/**
 * @type AppEvent
 * @description
 * Definición de eventos individuales mediante una Unión Discriminada.
 * Esto permite que el Bus de Eventos asocie automáticamente el tipo de evento
 * con la estructura correcta de su payload.
 */
export type AppEvent =
  /** Emitido al cargar exitosamente el árbol de temáticas */
  | { type: AppEventType.THEMATICS_LOADED; payload?: undefined }

  /** Emitido al abrir la vista de una temática específica */
  | { type: AppEventType.THEMATIC_VIEWED; payload: { id: number; name: string } }

  /** Emitido al seleccionar una categoría dentro de una temática */
  | { type: AppEventType.THEMATIC_CATEGORY_SELECTED; payload: { id: number; name: string } }

  /** Emitido al seleccionar una subcategoría dentro de una temática */
  | { type: AppEventType.THEMATIC_SUBCATEGORY_SELECTED; payload: { id: number; name: string } }

  /** Emitido al crear una nueva temática raíz */
  | { type: AppEventType.THEMATIC_ROOT_CREATED; payload: { id: number; name: string } }
  /** Emitido al crear una nueva categoría */
  | { type: AppEventType.THEMATIC_CATEGORY_CREATED; payload: { id: number; name: string } }
  /** Emitido al crear una nueva subcategoría */
  | { type: AppEventType.THEMATIC_SUBCATEGORY_CREATED; payload: { id: number; name: string } }

  /** Emitido al editar una temática raíz */
  | { type: AppEventType.THEMATIC_ROOT_EDITED; payload: { id: number } }
  /** Emitido al editar una categoría */
  | { type: AppEventType.THEMATIC_CATEGORY_EDITED; payload: { id: number } }
  /** Emitido al editar una subcategoría */
  | { type: AppEventType.THEMATIC_SUBCATEGORY_EDITED; payload: { id: number } }

  /** Emitido al eliminar una temática raíz */
  | { type: AppEventType.THEMATIC_ROOT_DELETED; payload: { id: number } }
  /** Emitido al eliminar una categoría */
  | { type: AppEventType.THEMATIC_CATEGORY_DELETED; payload: { id: number } }
  /** Emitido al eliminar una subcategoría */
  | { type: AppEventType.THEMATIC_SUBCATEGORY_DELETED; payload: { id: number } }

  /** Emitido al reordenar temáticas raíz */
  | { type: AppEventType.THEMATIC_ROOT_REORDERED; payload: { thematicIds: number[]; parentId?: number } }
  /** Emitido al reordenar categorías */
  | { type: AppEventType.THEMATIC_CATEGORY_REORDERED; payload: { thematicIds: number[]; parentId?: number } }
  /** Emitido al reordenar subcategorías */
  | { type: AppEventType.THEMATIC_SUBCATEGORY_REORDERED; payload: { thematicIds: number[]; parentId?: number } }

  /** Emitido al abrir el modal de asociación de visualizaciones */
  | { type: AppEventType.THEMATIC_ASSOCIATION_OPENED; payload: { thematicId: number; thematicName: string } }

  /** Emitido al guardar cambios en la asociación de visualizaciones */
  | { type: AppEventType.THEMATIC_ASSOCIATION_SAVED; payload: { thematicId: number; visualizationsCount: number } }

  /** Emitido al abrir el wizard de creación de visualizaciones */
  | { type: AppEventType.VISUALIZATION_WIZARD_OPENED; payload?: undefined }
  /** Emitido al filtrar datasets en el paso 1 del wizard */
  | { type: AppEventType.VISUALIZATION_WIZARD_STEP1_FILTERED; payload: { filter: string; resultsCount: number } }
  /** Emitido al seleccionar un dataset en el paso 1 */
  | { type: AppEventType.VISUALIZATION_WIZARD_DATASET_SELECTED; payload: { datasetId: string | number; datasetName: string } }
  /** Emitido al realizar una acción de filtro/rollup en el paso 2 */
  | { type: AppEventType.VISUALIZATION_WIZARD_STEP2_ACTION; payload: { action: 'filter' | 'rollup'; dimension: string | number } }
  /** Emitido al avanzar del paso 2 al 3 */
  | { type: AppEventType.VISUALIZATION_WIZARD_STEP2_NEXT; payload: { datasetId: string | number } }
  /** Emitido al editar información en el paso 3 */
  | { type: AppEventType.VISUALIZATION_WIZARD_INFO_EDITED; payload: { field: string } }
  /** Emitido al añadir un gráfico en el wizard */
  | { type: AppEventType.VISUALIZATION_WIZARD_CHART_ADDED; payload?: undefined }
  /** Emitido al eliminar un gráfico en el wizard */
  | { type: AppEventType.VISUALIZATION_WIZARD_CHART_REMOVED; payload?: undefined }
  /** Emitido al añadir una tabla en el wizard */
  | { type: AppEventType.VISUALIZATION_WIZARD_TABLE_ADDED; payload?: undefined }
  /** Emitido al eliminar una tabla en el wizard */
  | { type: AppEventType.VISUALIZATION_WIZARD_TABLE_REMOVED; payload?: undefined }
  /** Emitido al guardar la visualización desde el wizard */
  | { type: AppEventType.VISUALIZATION_WIZARD_SAVED; payload: { id: string | number } }

  /** Emitido al abrir la lista completa de visualizaciones */
  | { type: AppEventType.VISUALIZATIONS_LIST_VIEWED; payload?: undefined }

  /** Emitido al abrir el detalle de una visualización específica */
  | { type: AppEventType.VISUALIZATION_OPENED; payload: { id: string | number } }

  /** Emitido al cambiar filtros en la grilla */
  | { type: AppEventType.GRID_FILTER_CHANGED; payload: { filter: any } }

  /** Emitido al cambiar el orden en la grilla */
  | { type: AppEventType.GRID_ORDER_CHANGED; payload: { order: string } }

  /** Emitido al activar/desactivar el modo edición global */
  | { type: AppEventType.EDIT_MODE_TOGGLED; payload: { enabled: boolean } }

  /** Emitido al mostrar/ocultar la barra de herramientas de edición */
  | { type: AppEventType.EDIT_BAR_TOGGLED; payload: { visible: boolean } }

  /** Emitido al abrir el panel de acciones lateral */
  | { type: AppEventType.VISUALIZATION_ACTIONS_OPENED; payload: { id: string | number } }

  /** Emitido al activar/desactivar el agrupamiento (RollUp) de una dimensión */
  | { type: AppEventType.VISUALIZATION_ROLLUP_CHANGED; payload: { id: string | number; dimension: string; active: boolean } }

  /** Emitido al filtrar ítems específicos de una dimensión */
  | { type: AppEventType.VISUALIZATION_ITEMS_FILTERED; payload: { id: string | number; dimension: string; itemsCount: number } }

  /** Emitido al activar/desactivar múltiples gráficos por dimensión */
  | { type: AppEventType.VISUALIZATION_MULTI_CHARTS_CHANGED; payload: { id: string | number; dimension: string; enabled: boolean } }

  /** Emitido al alternar el modo porcentual */
  | { type: AppEventType.VISUALIZATION_PERCENTAGE_TOGGLED; payload: { id: string | number; enabled: boolean } }

  /** Emitido al descargar el gráfico */
  | { type: AppEventType.VISUALIZATION_CHART_DOWNLOADED; payload: { id: string | number } }

  /** Emitido al alternar pantalla completa en el gráfico */
  | { type: AppEventType.VISUALIZATION_CHART_FULLSCREEN_TOGGLED; payload: { id: string | number; enabled: boolean } }

  /** Emitido al descargar la tabla */
  | { type: AppEventType.VISUALIZATION_TABLE_DOWNLOADED; payload: { id: string | number } }

  /** Emitido al alternar pantalla completa en la tabla */
  | { type: AppEventType.VISUALIZATION_TABLE_FULLSCREEN_TOGGLED; payload: { id: string | number; enabled: boolean } }

  /** Emitido al alternar la visibilidad de la ficha técnica */
  | { type: AppEventType.VISUALIZATION_TECHNICAL_SHEET_TOGGLED; payload: { id: string | number; expanded: boolean } }

  /** Emitido al crear exitosamente una nueva visualización */
  | { type: AppEventType.VISUALIZATION_CREATED; payload: { id: string | number } }

  /** Emitido al editar exitosamente una visualización existente */
  | { type: AppEventType.VISUALIZATION_EDITED; payload: { id: string | number } }

  /** Emitido al eliminar visualizaciones */
  | { type: AppEventType.VISUALIZATION_DELETED; payload: { ids: (string | number)[] } }

  /** Emitido al publicar visualizaciones */
  | { type: AppEventType.VISUALIZATION_PUBLISHED; payload: { ids: (string | number)[] } }

  /** Emitido al despublicar visualizaciones */
  | { type: AppEventType.VISUALIZATION_UNPUBLISHED; payload: { ids: (string | number)[] } }

  /** Emitido al realizar una búsqueda de visualizaciones */
  | { type: AppEventType.SEARCH_USED; payload: { query: string; resultsCount: number } }

  /** Emitido al descargar una visualización en cualquier formato */
  | { type: AppEventType.DOWNLOAD_USED; payload: { id: string | number; options: any } }

  /** Emitido tras un inicio de sesión exitoso */
  | { type: AppEventType.LOGIN_SUCCESS; payload: { userId: number; username: string; role: 'admin' | 'editor' | 'viewer' } }

  /** Emitido al cerrar sesión */
  | { type: AppEventType.LOGOUT; payload?: undefined }

  /** Emitido al cambiar la Unidad de Información activa */
  | { type: AppEventType.IU_SELECTED; payload: { id: number; name: string } }

  /** Emitido al visitar la página Acerca de */
  | { type: AppEventType.ABOUT_PAGE_VIEWED; payload?: undefined }

  /** Emitido al visitar el perfil de usuario */
  | { type: AppEventType.USER_PROFILE_VIEWED; payload?: undefined }

  /** Emitido al actualizar el nombre del usuario */
  | { type: AppEventType.USER_NAME_UPDATED; payload: { userId: number; name: string } }

  /** Emitido al actualizar el email del usuario */
  | { type: AppEventType.USER_EMAIL_UPDATED; payload: { userId: number; email: string } }

  /** Emitido al actualizar el área de trabajo del usuario */
  | { type: AppEventType.USER_AREA_UPDATED; payload: { userId: number; area: string } }

  /** Emitido al cambiar la contraseña */
  | { type: AppEventType.PASSWORD_CHANGED; payload?: undefined };
