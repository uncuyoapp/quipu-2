import { DownloadOptions } from '@models/common/download.model';
import { Dataset, DatasetInfo } from '@models/domain/dataset.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { User } from '@models/domain/user.model';
import { Visualization, VisualizationPage } from '@models/domain/visualization.model';
import { Observable } from 'rxjs';

/**
 * Clase abstracta que define el contrato para los proveedores de datos.
 * Esta interfaz permite que el frontend sea agnóstico respecto a la fuente de datos,
 * facilitando el intercambio entre diferentes proveedores (API, mock, etc.)
 */
export abstract class IDataProvider {
  // Thematic-related methods

  /**
   * Recupera todas las temáticas disponibles.
   * 
   * @returns Un observable que contiene un arreglo de temáticas.
   */
  abstract getThematics(): Observable<Thematic[]>;

  /**
   * Crea una nueva temática.
   * 
   * @param thematic Objeto con los datos de la temática a crear.
   * @returns Un observable con la temática creada.
   */
  abstract createThematic(thematic: Partial<Thematic>): Observable<Thematic>;

  /**
   * Actualiza una temática existente.
   * 
   * @param id El identificador único de la temática a actualizar.
   * @param thematic Objeto con los datos a actualizar.
   * @returns Un observable con la temática actualizada.
   */
  abstract updateThematic(id: number, thematic: Partial<Thematic>): Observable<Thematic>;

  /**
   * Elimina una temática existente.
   * 
   * @param id El identificador de la temática a eliminar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract deleteThematic(id: number): Observable<boolean>;

  /**
   * Reordena un conjunto de temáticas.
   * 
   * @param thematicIds Un arreglo de identificadores en el nuevo orden deseado.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract reorderThematics(thematicIds: number[]): Observable<boolean>;

  // --- Métodos de Relación Temática - Visualizaciones (N:M) ---

  /**
   * Obtiene la lista de visualizaciones disponibles para vincular a una temática (no asignadas actualmente).
   * @param thematicId Identificador de la temática.
   * @returns Un observable con el arreglo de visualizaciones disponibles.
   */
  abstract getAvailableVisualizationsForThematic(thematicId: number): Observable<Visualization[]>;

  /**
   * Asocia una o más visualizaciones a una temática específica.
   * @param thematicId Identificador de la temática.
   * @param visualizationIds Arreglo de IDs de visualizaciones a vincular.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract assignVisualizationsToThematic(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean>;

  /**
   * Desvincula una visualización de una temática.
   * @param thematicId Identificador de la temática.
   * @param visualizationId Identificador de la visualización a quitar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract unassignVisualizationFromThematic(thematicId: number, visualizationId: number | string): Observable<boolean>;

  /**
   * Reordena la lista de visualizaciones asignadas dentro de una temática.
   * @param thematicId Identificador de la temática.
   * @param visualizationIds Arreglo de IDs en el orden deseado.
   * @returns Un observable indicando si el reordenamiento fue exitoso.
   */
  abstract reorderThematicVisualizations(thematicId: number, visualizationIds: (number | string)[]): Observable<boolean>;

  // Visualization-related methods

  /**
   * Recupera una visualización específica por su ID.
   * 
   * @param id El identificador único de la visualización.
   * @returns Un observable que contiene los datos de la visualización.
   */
  abstract getVisualization(id: number | string): Observable<Visualization>;

  /**
   * Recupera todas las visualizaciones asociadas con una temática específica.
   * 
   * @param thematicId El identificador único de la temática.
   * @param recursive Opcional: Si es verdadero, recupera visualizaciones de la temática y sus descendientes. Por defecto es true.
   * @returns Un observable que contiene un arreglo de visualizaciones.
   */
  abstract getVisualizationsByThematic(thematicId: number, recursive?: boolean): Observable<Visualization[]>;

  /**
   * Busca visualizaciones a partir de una cadena de texto.
   * 
   * @param searchText El texto a buscar.
   * @returns Un observable que contiene un arreglo de visualizaciones que coinciden con la búsqueda.
   */
  abstract getVisualizationsByText(searchText: string): Observable<Visualization[]>;

  /**
   * Recupera una lista paginada de visualizaciones.
   * 
   * @param page El número de página a recuperar.
   * @param pageSize La cantidad de elementos por página.
   * @returns Un observable que contiene la respuesta de visualizaciones paginada.
   */
  abstract getVisualizationsPage(page: number, pageSize: number): Observable<VisualizationPage>;

  /**
   * Crea una nueva visualización.
   * 
   * @param visualization El objeto de la visualización a crear.
   * @returns Un observable con la visualización creada.
   */
  abstract createVisualization(visualization: Visualization): Observable<Visualization>;

  /**
   * Actualiza una visualización.
   * En MockDataProvider, esto descargará el JSON interactuando con el navegador.
   * En QuipuApiProvider, esto hará una petición a la API.
   * 
   * @param id El identificador único de la visualización.
   * @param visualization Opcional: El objeto de la visualización a actualizar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract updateVisualization(id: number | string, visualization: Visualization): Observable<boolean>;

  /**
   * Publica un conjunto de visualizaciones.
   * 
   * @param ids Un arreglo de identificadores únicos de las visualizaciones a publicar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract publishVisualizations(ids: (number | string)[]): Observable<boolean>;

  /**
   * Despublica un conjunto de visualizaciones.
   * 
   * @param ids Un arreglo de identificadores únicos de las visualizaciones a despublicar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract unpublishVisualizations(ids: (number | string)[]): Observable<boolean>;

  /**
   * Elimina un conjunto de visualizaciones.
   * 
   * @param ids Un arreglo de identificadores únicos de las visualizaciones a eliminar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract deleteVisualizations(ids: (number | string)[]): Observable<boolean>;

  /**
   * Recupera las visualizaciones guardadas como favoritas por un usuario específico.
   * 
   * @param userId El identificador único del usuario.
   * @returns Un observable que contiene un arreglo de visualizaciones favoritas.
   */
  abstract getVisualizationsBookmarked(userId: number): Observable<Visualization[]>;

  /**
   * Obtiene sugerencias de búsqueda en base a un texto parcial.
   * 
   * @param searchText El texto de entrada parcial.
   * @returns Un observable que contiene un arreglo de sugerencias como cadenas de texto.
   */
  abstract getSearchSuggestions(searchText: string): Observable<string[]>;

  /**
   * Ejecuta una solicitud de descarga basada en el tipo de proveedor.
   * En el caso de MockDataProvider, descargará el JSON de la visualización.
   * 
   * @param visualization Objeto de la visualización a descargar.
   * @param options Opciones de descarga seleccionadas por el usuario.
   */
  abstract download(visualization: Visualization, options: DownloadOptions): void;

  // Dataset-related methods

  /**
   * Recupera un conjunto de datos (dataset) por su ID.
   * 
   * @param datasetId El identificador único del dataset (número o cadena).
   * @returns Un observable que contiene los datos del dataset.
   */
  abstract getDataset(datasetId: number | string): Observable<Dataset>;

  /**
   * Recupera la lista de todos los datasets disponibles.
   * 
   * @returns Un observable que contiene un arreglo de información de datasets.
   */
  abstract getDatasets(): Observable<DatasetInfo[]>;

  // User-related methods

  /**
   * Recupera el usuario autenticado actualmente.
   * 
   * @returns Un observable que contiene los datos del usuario actual.
   */
  abstract getCurrentUser(): Observable<User>;

  /**
   * Autentica a un usuario con nombre de usuario y contraseña.
   * 
   * @param username El nombre de usuario.
   * @param password La contraseña del usuario.
   * @returns Un observable que contiene los datos del usuario autenticado.
   */
  abstract login(username: string, password: string): Observable<User>;

  /**
   * Cierra la sesión del usuario actual.
   * 
   * @returns Un observable que se completa cuando se cierra la sesión.
   */
  abstract logout(): Observable<void>;

  /**
   * Cierra la sesión activa en todos los dispositivos conectados (Global Logout).
   */
  abstract logoutAll(): Observable<void>;

  /**
   * Solicita la renovación del Access Token utilizando la cookie HttpOnly de Refresh Token.
   * @returns Un observable que contiene el nuevo token JWT emitido.
   */
  abstract refreshToken(): Observable<string>;

  /**
   * Inicia el proceso de recuperación de contraseña para un correo electrónico.
   * 
   * @param email La dirección de correo electrónico del usuario.
   * @returns Un observable que contiene el token de recuperación o un mensaje de éxito.
   */
  abstract recoveryPass(email: string): Observable<string>;

  /**
   * Verifica la validez de un token de recuperación de contraseña.
   * 
   * @param token El token de recuperación a verificar.
   * @returns Un observable que indica si el token es válido.
   */
  abstract verifyRecoveryToken(token: string): Observable<boolean>;

  /**
   * Cambia la contraseña del usuario utilizando un token de recuperación.
   * 
   * @param token El token de recuperación válido.
   * @param newPassword La nueva contraseña a establecer.
   * @returns Un observable que indica si el cambio de contraseña fue exitoso.
   */
  abstract changePassword(token: string, newPassword: string): Observable<boolean>;

  /**
   * Actualiza la contraseña del usuario logueado actualmente.
   * 
   * @param oldPassword La contraseña actual del usuario.
   * @param newPassword La nueva contraseña a establecer.
   * @returns Un observable que indica si la actualización fue exitosa.
   */
  abstract updatePassword(oldPassword: string, newPassword: string): Observable<boolean>;

  /**
   * Actualiza el correo electrónico del usuario logueado actualmente.
   * 
   * @param newEmail El nuevo correo electrónico a establecer.
   * @returns Un observable que indica si la actualización fue exitosa.
   */
  abstract updateEmail(newEmail: string): Observable<boolean>;

  /**
   * Actualiza el nombre completo del usuario logueado actualmente.
   */
  abstract updateName(newName: string): Observable<boolean>;

  /**
   * Actualiza el área de trabajo (nombre de la unidad) del usuario logueado actualmente.
   */
  abstract updateWorkArea(newArea: string): Observable<boolean>;

  // Information Unit-related methods

  /**
   * Recupera todas las unidades de información disponibles.
   * 
   * @returns Un observable que contiene un arreglo de unidades de información.
   */
  abstract getInformationUnits(): Observable<InformationUnit[]>;

  /**
   * Selecciona una unidad de información para la sesión de usuario actual.
   * 
   * @param unitId El ID de la unidad de información a seleccionar.
   * @returns Un observable que indica si la selección fue exitosa.
   */
  abstract selectInformationUnit(unitId: number): Observable<boolean>;

  // Authentication methods

  /**
   * Comprueba si el usuario actual está autenticado.
   * 
   * @returns Verdadero (true) si el usuario está autenticado, falso (false) en caso contrario.
   */
  abstract isAuthenticated(): boolean;

  /**
   * Recupera el token de autenticación actual.
   * 
   * @returns El token de autenticación como una cadena de texto, o nulo si no se encuentra.
   */
  abstract getAuthToken(): string | null;

  /**
   * Establece el token de autenticación para la sesión.
   * 
   * @param token El token a almacenar.
   */
  abstract setAuthToken(token: string): void;

  /**
   * Elimina el token de autenticación de la sesión.
   */
  abstract removeAuthToken(): void;

  // Cache management methods (optional, implementations can choose to ignore)

  /**
   * Limpia la caché, opcionalmente coincidiendo con un patrón específico.
   * 
   * @param pattern El patrón de texto opcional para buscar y eliminar claves en la caché.
   */
  abstract clearCache?(pattern?: string): void;

  /**
   * Limpia los datos almacenados en caché para un dataset específico.
   * 
   * @param datasetId El ID del dataset cuya caché se debe limpiar.
   */
  abstract clearDataCache?(datasetId: number | string): void;

  // Session initialization methods (optional, for handling page refresh)

  /**
   * Inicializa el estado del proveedor a partir de datos almacenados (e.g., local storage).
   * Útil para restaurar el estado de la sesión después de actualizar la página.
   * 
   * @param userData Un objeto que contiene el token del usuario almacenado y el ID de la unidad seleccionada.
   */
  abstract initializeFromStoredData?(userData: { token?: string; selectedIU?: number }): void;

}
