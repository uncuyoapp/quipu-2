import { AppEventType } from '@core/models/events/app-event.types';
import { GameRole, GameObjectiveCategory } from './easter-egg.interface';

/**
 * Configuración estática de una misión del Quipu.
 */
export interface QuipuMissionConfig {
  /** Identificador corto de la misión (ej: 't1') */
  id: string;
  /** Título/Descripción de la misión */
  description: string;
  /** Pista narrativa */
  hint: string;
  /** Rol requerido para completar/ver la misión */
  role: GameRole;
  /** Categoría temática */
  category: GameObjectiveCategory;
}

/**
 * Diccionario maestro de misiones indexado por tipo de evento para búsqueda O(1).
 * Contiene los 64 hilos del Quipu originales.
 */
export const EASTER_EGG_MISSIONS: Partial<Record<AppEventType, QuipuMissionConfig>> = {
  // --- TEMÁTICAS (Guardianes y Exploradores) ---
  [AppEventType.THEMATICS_LOADED]: { id: 't1', description: 'Carga el catálogo de temáticas', hint: 'Simplemente abre el sistema para que las temáticas se revelen.', role: 'viewer', category: 'Temáticas' },
  [AppEventType.THEMATIC_VIEWED]: { id: 't2', description: 'Contempla una temática', hint: 'Selecciona una categoría en el menú para ver su contenido.', role: 'viewer', category: 'Temáticas' },
  [AppEventType.THEMATIC_CATEGORY_SELECTED]: { id: 't3', description: 'Elige una categoría específica', hint: 'Profundiza en el árbol de temáticas seleccionando una categoría.', role: 'viewer', category: 'Temáticas' },
  [AppEventType.THEMATIC_SUBCATEGORY_SELECTED]: { id: 't4', description: 'Explora una subcategoría', hint: 'Llega al nivel más profundo de las temáticas.', role: 'viewer', category: 'Temáticas' },
  [AppEventType.THEMATIC_ROOT_CREATED]: { id: 't5', description: 'Crea una raíz de conocimiento', hint: 'Como Guardián, crea una nueva temática raíz.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_CATEGORY_CREATED]: { id: 't6', description: 'Siembra una nueva categoría', hint: 'Añade una categoría dentro de una raíz existente.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_SUBCATEGORY_CREATED]: { id: 't7', description: 'Añade una rama de subcategoría', hint: 'Crea una subcategoría para organizar mejor los datos.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_ROOT_EDITED]: { id: 't8', description: 'Renombra una raíz temática', hint: 'Edita el nombre de una temática raíz.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_CATEGORY_EDITED]: { id: 't9', description: 'Refina una categoría', hint: 'Edita los detalles de una categoría existente.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_SUBCATEGORY_EDITED]: { id: 't10', description: 'Ajusta una subcategoría', hint: 'Modifica la información de una subcategoría.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_ROOT_DELETED]: { id: 't11', description: 'Elimina una raíz obsoleta', hint: 'Borra una temática raíz que ya no sea necesaria.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_CATEGORY_DELETED]: { id: 't12', description: 'Poda una categoría', hint: 'Borra una categoría del árbol temático.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_SUBCATEGORY_DELETED]: { id: 't13', description: 'Limpia una subcategoría', hint: 'Borra una subcategoría que haya cumplido su ciclo.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_ROOT_REORDERED]: { id: 't14', description: 'Ordena las raíces ancestrales', hint: 'Cambia el orden de las temáticas raíz.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_CATEGORY_REORDERED]: { id: 't15', description: 'Organiza las categorías', hint: 'Reordena las categorías dentro de una raíz.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_SUBCATEGORY_REORDERED]: { id: 't16', description: 'Sincroniza las subcategorías', hint: 'Cambia el orden de las subcategorías.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_ASSOCIATION_OPENED]: { id: 't17', description: 'Inicia una asociación de hilos', hint: 'Abre el panel para asociar visualizaciones a una temática.', role: 'admin', category: 'Temáticas' },
  [AppEventType.THEMATIC_ASSOCIATION_SAVED]: { id: 't18', description: 'Teje un vínculo eterno', hint: 'Guarda una asociación entre visualización y temática.', role: 'admin', category: 'Temáticas' },

  // --- WIZARD DE VISUALIZACIÓN ---
  [AppEventType.VISUALIZATION_WIZARD_OPENED]: { id: 'w1', description: 'Inicia el ritual de creación', hint: 'Abre el asistente para crear una nueva visualización.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_STEP1_FILTERED]: { id: 'w2', description: 'Filtra las fuentes de datos', hint: 'Usa los filtros en el primer paso del asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_DATASET_SELECTED]: { id: 'w3', description: 'Elige un manantial de datos', hint: 'Selecciona un dataset en el asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_STEP2_ACTION]: { id: 'w4', description: 'Configura las dimensiones del saber', hint: 'Realiza una acción en el paso 2 del asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_STEP2_NEXT]: { id: 'w5', description: 'Avanza en el camino de creación', hint: 'Pasa del paso 2 al paso 3 en el asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_INFO_EDITED]: { id: 'w6', description: 'Define la esencia de la visualización', hint: 'Edita la información básica (título, descripción) en el wizard.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_CHART_ADDED]: { id: 'w7', description: 'Añade una representación visual', hint: 'Añade un gráfico en el paso 3 del asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_CHART_REMOVED]: { id: 'w8', description: 'Descarta un gráfico innecesario', hint: 'Elimina un gráfico en el asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_TABLE_ADDED]: { id: 'w9', description: 'Añade una tabla de sabiduría', hint: 'Añade una tabla en el asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_TABLE_REMOVED]: { id: 'w10', description: 'Remueve una tabla', hint: 'Elimina una tabla en el asistente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_WIZARD_SAVED]: { id: 'w11', description: 'Consagra la nueva visualización', hint: 'Guarda la visualización terminada desde el asistente.', role: 'admin', category: 'Creación' },

  // --- VISUALIZACIONES (Exploración y Gestión) ---
  [AppEventType.VISUALIZATIONS_LIST_VIEWED]: { id: 'v1', description: 'Recorre el salón de las visiones', hint: 'Entra a la lista general de visualizaciones.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_OPENED]: { id: 'v2', description: 'Observa una visión en detalle', hint: 'Abre cualquier visualización para ver sus secretos.', role: 'viewer', category: 'Visualización' },
  [AppEventType.GRID_FILTER_CHANGED]: { id: 'v3', description: 'Ajusta el filtro de la realidad', hint: 'Cambia un filtro en la grilla de visualizaciones.', role: 'viewer', category: 'Visualización' },
  [AppEventType.GRID_ORDER_CHANGED]: { id: 'v4', description: 'Altera el orden del tiempo', hint: 'Cambia el orden de los elementos en la grilla.', role: 'viewer', category: 'Visualización' },
  [AppEventType.EDIT_MODE_TOGGLED]: { id: 'v5', description: 'Activa el ojo del creador', hint: 'Cambia al modo edición para modificar el mundo.', role: 'admin', category: 'Gestión' },
  [AppEventType.EDIT_BAR_TOGGLED]: { id: 'v6', description: 'Revela la barra de herramientas', hint: 'Muestra u oculta la barra de edición.', role: 'admin', category: 'Gestión' },
  [AppEventType.VISUALIZATION_ACTIONS_OPENED]: { id: 'v7', description: 'Consulta las acciones posibles', hint: 'Abre el menú de acciones de una visualización.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_ROLLUP_CHANGED]: { id: 'v8', description: 'Agrupa la información ancestral', hint: 'Cambia el rollup (agrupamiento) en una visualización.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_ITEMS_FILTERED]: { id: 'v9', description: 'Filtra los elementos internos', hint: 'Usa los filtros dentro de una visualización detallada.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_MULTI_CHARTS_CHANGED]: { id: 'v10', description: 'Multiplica las visiones', hint: 'Activa o cambia la vista de múltiples gráficos.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_PERCENTAGE_TOGGLED]: { id: 'v11', description: 'Cambia a la visión relativa', hint: 'Activa el interruptor de porcentaje en una visualización.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_CHART_DOWNLOADED]: { id: 'v12', description: 'Descarga un pergamino gráfico', hint: 'Descarga una imagen de cualquier gráfico.', role: 'viewer', category: 'Acciones' },
  [AppEventType.VISUALIZATION_CHART_FULLSCREEN_TOGGLED]: { id: 'v13', description: 'Expande tu visión', hint: 'Pon un gráfico en pantalla completa.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_TABLE_DOWNLOADED]: { id: 'v14', description: 'Guarda los datos en tu morada', hint: 'Descarga los datos de una tabla.', role: 'viewer', category: 'Acciones' },
  [AppEventType.VISUALIZATION_TABLE_FULLSCREEN_TOGGLED]: { id: 'v15', description: 'Observa la tabla en su inmensidad', hint: 'Pon una tabla en pantalla completa.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_TECHNICAL_SHEET_TOGGLED]: { id: 'v16', description: 'Consulta la ficha técnica sagrada', hint: 'Abre o cierra la ficha técnica de una visualización.', role: 'viewer', category: 'Visualización' },
  [AppEventType.VISUALIZATION_CREATED]: { id: 'v17', description: 'Da a luz una nueva visión', hint: 'Crea una visualización exitosamente.', role: 'admin', category: 'Creación' },
  [AppEventType.VISUALIZATION_EDITED]: { id: 'v18', description: 'Modifica el destino de los datos', hint: 'Edita una visualización existente.', role: 'admin', category: 'Gestión' },
  [AppEventType.VISUALIZATION_DELETED]: { id: 'v19', description: 'Desvanece una visión', hint: 'Borra una visualización del sistema.', role: 'admin', category: 'Gestión' },
  [AppEventType.VISUALIZATION_PUBLISHED]: { id: 'v20', description: 'Publica el conocimiento', hint: 'Cambia el estado de una visualización a "Publicado".', role: 'admin', category: 'Gestión' },
  [AppEventType.VISUALIZATION_UNPUBLISHED]: { id: 'v21', description: 'Oculta la sabiduría del vulgo', hint: 'Cambia el estado de una visualización a "No Publicado".', role: 'admin', category: 'Gestión' },

  // --- BÚSQUEDA Y ACCIONES ---
  [AppEventType.SEARCH_USED]: { id: 's1', description: 'Usa el oráculo de búsqueda', hint: 'Utiliza la barra de búsqueda superior.', role: 'viewer', category: 'Buscador' },
  [AppEventType.DOWNLOAD_USED]: { id: 'a1', description: 'Realiza una descarga global', hint: 'Usa cualquier botón de descarga general del sistema.', role: 'viewer', category: 'Acciones' },

  // --- AUTENTICACIÓN Y SISTEMA ---
  [AppEventType.LOGIN_SUCCESS]: { id: 'au1', description: 'Accede al templo del saber', hint: 'Inicia sesión correctamente en el sistema.', role: 'viewer', category: 'Sistema' },
  [AppEventType.LOGOUT]: { id: 'au2', description: 'Despídete del Anciano', hint: 'Cierra tu sesión en el sistema.', role: 'viewer', category: 'Sistema' },
  [AppEventType.IU_SELECTED]: { id: 'au3', description: 'Elige tu unidad de conocimiento', hint: 'Cambia de Unidad de Información (IU) si tienes varias.', role: 'viewer', category: 'Sistema' },
  [AppEventType.ABOUT_PAGE_VIEWED]: { id: 'au4', description: 'Aprende sobre Quipu', hint: 'Visita la página "Acerca de".', role: 'viewer', category: 'Sistema' },
  [AppEventType.USER_PROFILE_VIEWED]: { id: 'au5', description: 'Observa tu propia esencia', hint: 'Visita tu perfil de usuario.', role: 'viewer', category: 'Usuario' },
  [AppEventType.USER_NAME_UPDATED]: { id: 'au6', description: 'Renueva tu nombre ancestral', hint: 'Actualiza tu nombre en el perfil.', role: 'viewer', category: 'Usuario' },
  [AppEventType.USER_EMAIL_UPDATED]: { id: 'au7', description: 'Cambia tu dirección de contacto', hint: 'Actualiza tu email en el perfil.', role: 'viewer', category: 'Usuario' },
  [AppEventType.USER_AREA_UPDATED]: { id: 'au8', description: 'Ajusta tu área de influencia', hint: 'Actualiza tu área de trabajo en el perfil.', role: 'viewer', category: 'Usuario' },
  [AppEventType.PASSWORD_CHANGED]: { id: 'au9', description: 'Protege tu sabiduría', hint: 'Cambia tu contraseña.', role: 'viewer', category: 'Usuario' }
};
