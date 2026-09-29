import { DownloadOptions } from '@models/common/download.model';
import { Dataset, DatasetInfo } from '@models/domain/dataset.model';
import { InformationUnit } from '@models/domain/information-unit.model';
import { Thematic } from '@models/domain/thematic.model';
import { Visualization, VisualizationPage } from '@models/domain/visualization.model';
import { SaveVisualizationDto, SaveThematicDto } from '@models/dto';
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
   * Crea una nueva temática a partir de su DTO de mutación.
   * 
   * @param thematic DTO con los datos de la temática a crear.
   * @returns Un observable con la temática creada.
   */
  abstract createThematic(thematic: SaveThematicDto): Observable<Thematic>;

  /**
   * Actualiza una temática existente a partir de su DTO de mutación.
   * 
   * @param id El identificador único de la temática a actualizar.
   * @param thematic DTO con los datos a actualizar.
   * @returns Un observable con la temática actualizada.
   */
  abstract updateThematic(id: number, thematic: SaveThematicDto): Observable<Thematic>;

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
   * Crea una nueva visualización a partir de su DTO de mutación.
   * 
   * @param visualization DTO estricto con los datos de la visualización a crear.
   * @returns Un observable con la visualización creada.
   */
  abstract createVisualization(visualization: SaveVisualizationDto): Observable<Visualization>;

  /**
   * Actualiza una visualización existente a partir de su DTO de mutación.
   * 
   * @param id El identificador único de la visualización.
   * @param visualization DTO estricto con los datos a actualizar.
   * @returns Un observable indicando si la operación fue exitosa.
   */
  abstract updateVisualization(id: number | string, visualization: SaveVisualizationDto): Observable<boolean>;

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

  // --- Métodos de Catálogo Institucional ---

  /**
   * Recupera el catálogo maestro completo de Unidades de Información de la institución.
   * 
   * @returns Un observable que contiene el arreglo de todas las unidades de información.
   */
  abstract getInformationUnits(): Observable<InformationUnit[]>;
}
