# Catálogo de Eventos Globales - Quipu

Este documento registra todos los eventos disponibles en el `AppEventBusService`, detallando su origen, propósito y estructura de datos.

## 🛠️ Arquitectura de Eventos
*   **Bus:** `AppEventBusService` (Singleton).
*   **Tipado:** Basado en `AppEventType` (enum) y `AppEvent` (discriminated union).
*   **Logger:** Activado automáticamente en modo desarrollo (`isDevMode`).

## 📖 Guía de Uso

### Emitir un Evento
Inyecta el `AppEventBusService` y usa el método `emit`. El tipado es estricto basado en el enum.

```typescript
private readonly eventBus = inject(AppEventBusService);

this.eventBus.emit({
  type: AppEventType.THEMATIC_VIEWED,
  payload: { id: 123, name: 'Educación' }
});
```

### Suscribirse a un Evento
Usa el método `on(type)` para obtener un observable filtrado y tipado.

```typescript
this.eventBus.on(AppEventType.THEMATIC_VIEWED).subscribe(ev => {
  console.log(ev.payload.name); // 'name' está correctamente inferido como string
});
```

## ⚠️ Prevención de Memory Leaks

Es obligatorio gestionar el ciclo de vida de las suscripciones para evitar fugas de memoria, especialmente en componentes que se destruyen con frecuencia.

### Recomendación: `takeUntilDestroyed` (Angular 16+)
Es la forma más limpia de vincular la suscripción al ciclo de vida del componente o servicio.

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MiComponente {
  private readonly eventBus = inject(AppEventBusService);

  constructor() {
    this.eventBus.on(AppEventType.EDIT_MODE_TOGGLED)
      .pipe(takeUntilDestroyed())
      .subscribe(ev => {
        // Lógica segura: se desuscribirá automáticamente al destruir el componente
      });
  }
}
```

---

## 📂 Listado de Eventos

### 🏛️ Módulo: Temáticas
| Evento | Descripción | Emisor (Archivo > Método) | Payload |
| :--- | :--- | :--- | :--- |
| `THEMATICS_LOADED` | El árbol de temáticas se cargó con éxito. | `ThematicStateService > loadAll` | `undefined` |
| `THEMATIC_VIEWED` | El usuario abrió una temática específica. | `ThematicViewStateService > setupThematic` | `{ id: number, name: string }` |
| `THEMATIC_CATEGORY_SELECTED` | Se seleccionó una categoría (hijo directo). | `ThematicViewStateService > selectThematic` | `{ id: number, name: string }` |
| `THEMATIC_SUBCATEGORY_SELECTED` | Se seleccionó una subcategoría (nieto). | `ThematicViewStateService > selectThematic` | `{ id: number, name: string }` |
| `THEMATIC_ROOT_CREATED` | Se creó una temática raíz. | `ThematicPersistenceService > create` | `{ id, name }` |
| `THEMATIC_CATEGORY_CREATED` | Se creó una categoría. | `ThematicPersistenceService > create` | `{ id, name }` |
| `THEMATIC_SUBCATEGORY_CREATED` | Se creó una subcategoría. | `ThematicPersistenceService > create` | `{ id, name }` |
| `THEMATIC_ROOT_EDITED` | Se actualizó una temática raíz. | `ThematicPersistenceService > update` | `{ id }` |
| `THEMATIC_CATEGORY_EDITED` | Se actualizó una categoría. | `ThematicPersistenceService > update` | `{ id }` |
| `THEMATIC_SUBCATEGORY_EDITED` | Se actualizó una subcategoría. | `ThematicPersistenceService > update` | `{ id }` |
| `THEMATIC_ROOT_DELETED` | Se eliminó una temática raíz. | `ThematicPersistenceService > delete` | `{ id }` |
| `THEMATIC_CATEGORY_DELETED` | Se eliminó una categoría. | `ThematicPersistenceService > delete` | `{ id }` |
| `THEMATIC_SUBCATEGORY_DELETED` | Se eliminó una subcategoría. | `ThematicPersistenceService > delete` | `{ id }` |
| `THEMATIC_ROOT_REORDERED`| Se reordenaron temáticas raíz. | `ThematicPersistenceService > reorder` | `{ thematicIds, parentId }` |
| `THEMATIC_CATEGORY_REORDERED`| Se reordenaron categorías. | `ThematicPersistenceService > reorder` | `{ thematicIds, parentId }` |
| `THEMATIC_SUBCATEGORY_REORDERED`| Se reordenaron subcategorías. | `ThematicPersistenceService > reorder` | `{ thematicIds, parentId }` |
| `THEMATIC_ASSOCIATION_OPENED`| Se abrió el modal de asociación de visualizaciones. | `EditVisualizationsModalComponent > ngOnInit` | `{ thematicId, thematicName }` |
| `THEMATIC_ASSOCIATION_SAVED` | Se guardó la nueva asociación de visualizaciones. | `EditVisualizationsModalComponent > onSave` | `{ thematicId, visualizationsCount }` |

### 🧙‍♂️ Módulo: Wizard de Creación de Visualizaciones
| Evento | Descripción | Emisor (Archivo > Método) | Payload |
| :--- | :--- | :--- | :--- |
| `VISUALIZATION_WIZARD_OPENED` | Se abrió el wizard de creación. | `VisualizationCreateModalComponent > ngOnInit` | - |
| `VISUALIZATION_WIZARD_STEP1_FILTERED` | Se filtró el listado de datasets en el paso 1. | `Step1DatasetSelectionComponent > onFilterChange` | `{ filter, resultsCount }` |
| `VISUALIZATION_WIZARD_DATASET_SELECTED` | Se seleccionó un dataset y se avanzó al paso 2. | `VisualizationCreateModalComponent > onDatasetSelected` | `{ datasetId, datasetName }` |
| `VISUALIZATION_WIZARD_STEP2_ACTION` | Se realizó un filtrado o rollup en el paso 2. | `DataFilterStepComponent > onDimensionChange` | `{ action, dimension }` |
| `VISUALIZATION_WIZARD_STEP2_NEXT` | Se confirmó el corte de datos y se avanzó al paso 3. | `VisualizationCreateModalComponent > onDataConfigured` | `{ datasetId }` |
| `VISUALIZATION_WIZARD_INFO_EDITED` | Se completó o editó un campo de información (título/ficha) en el wizard. | `VisualizationEditService > updateInformation` | `{ field }` |
| `VISUALIZATION_WIZARD_CHART_ADDED` | Se añadió un gráfico a la visualización desde el wizard. | `VisualizationEditService > toggleChart` | - |
| `VISUALIZATION_WIZARD_CHART_REMOVED` | Se eliminó el gráfico de la visualización desde el wizard. | `VisualizationEditService > toggleChart` | - |
| `VISUALIZATION_WIZARD_TABLE_ADDED` | Se añadió una tabla a la visualización desde el wizard. | `VisualizationEditService > toggleTable` | - |
| `VISUALIZATION_WIZARD_TABLE_REMOVED` | Se eliminó la tabla de la visualización desde el wizard. | `VisualizationEditService > toggleTable` | - |
| `VISUALIZATION_WIZARD_SAVED` | Se guardó y creó con éxito la nueva visualización. | `VisualizationCreateModalComponent > performCreate` | `{ id }` |

### 📊 Módulo: Visualizaciones
| Evento | Descripción | Emisor (Archivo > Método) | Payload |
| :--- | :--- | :--- | :--- |
| `VISUALIZATIONS_LIST_VIEWED` | Se abrió la lista completa de visualizaciones. | `VisualizationsListComponent > ngOnInit` | `undefined` |
| `VISUALIZATION_OPENED` | Se abrió el detalle de una visualización. | `VisualizationCardComponent > openVisualization` | `{ id: string \| number }` |
| `VISUALIZATION_ACTIONS_OPENED` | Se abrió el panel de acciones lateral. | `VisualizationComponent > toggleActionsSidenav` | `{ id: string \| number }` |
| `VISUALIZATION_ROLLUP_CHANGED` | Se activó/desactivó el agrupamiento (RollUp). | `VActionsComponent > onDimensionChange` | `{ id, dimension, active }` |
| `VISUALIZATION_ITEMS_FILTERED` | Se filtraron ítems de una dimensión. | `VActionsComponent > onDimensionChange` | `{ id, dimension, itemsCount }` |
| `VISUALIZATION_MULTI_CHARTS_CHANGED` | Se activaron/desactivaron múltiples gráficos. | `VActionsComponent > onMultipleGraphsChange` | `{ id, dimension, enabled }` |
| `VISUALIZATION_PERCENTAGE_TOGGLED` | Se alternó el modo porcentual. | `VActionsComponent > onPercentageViewChange` | `{ id, enabled }` |
| `VISUALIZATION_CHART_DOWNLOADED` | Se descargó el gráfico (JPG/PNG). | `VChartComponent > downloadPNG` | `{ id }` |
| `VISUALIZATION_CHART_FULLSCREEN_TOGGLED` | Se alternó pantalla completa del gráfico. | `VChartComponent > toggleFullscreen` | `{ id, enabled }` |
| `VISUALIZATION_TABLE_DOWNLOADED` | Se descargó la tabla (XLSX). | `VTableComponent > downloadExcel` | `{ id }` |
| `VISUALIZATION_TABLE_FULLSCREEN_TOGGLED` | Se alternó pantalla completa de la tabla. | `VTableComponent > toggleFullscreen` | `{ id, enabled }` |
| `VISUALIZATION_TECHNICAL_SHEET_TOGGLED` | Se alternó la visibilidad de la ficha técnica. | `VInformationComponent > onClickShowMore` | `{ id, expanded }` |
| `VISUALIZATION_CREATED`| Se persistió una nueva visualización. | `VisualizationPersistenceService > create` | `{ id: string \| number }` |
| `VISUALIZATION_EDITED` | Se guardaron cambios en una visualización. | `VisualizationPersistenceService > update` | `{ id: string \| number }` |
| `VISUALIZATION_DELETED`| Se eliminaron visualizaciones. | `VisualizationPersistenceService > delete` | `{ ids: (string \| number)[] }` |
| `VISUALIZATION_PUBLISHED` | Se publicaron visualizaciones. | `VisualizationPersistenceService > publish` | `{ ids: (string \| number)[] }` |
| `VISUALIZATION_UNPUBLISHED` | Se despublicaron visualizaciones. | `VisualizationPersistenceService > unpublish` | `{ ids: (string \| number)[] }` |

### 🔍 Módulo: Búsqueda y UX
| Evento | Descripción | Emisor (Archivo > Método) | Payload |
| :--- | :--- | :--- | :--- |
| `SEARCH_USED` | El usuario ejecutó una búsqueda. | `SearchViewStateService > buscar` | `{ query: string, resultsCount: number }` |
| `DOWNLOAD_USED` | El usuario inició una descarga. | `VisualizationStateService > download` | `{ id: string \| number, options: DownloadOptions }` |

### 👤 Módulo: Usuario y Autenticación
| Evento | Descripción | Emisor (Archivo > Método) | Payload |
| :--- | :--- | :--- | :--- |
| `LOGIN_SUCCESS` | Inicio de sesión exitoso. | `SessionPersistenceService > login` | `{ userId, username, role }` |
| `LOGOUT` | Cierre de sesión del usuario. | `SessionPersistenceService > logout` | `undefined` |
| `IU_SELECTED` | Cambio de Unidad de Información. | `SessionPersistenceService > selectIU` | `{ id, name }` |
| `EDIT_MODE_TOGGLED` | Se activó/desactivó el modo edición. | `EditModeService > toggleEditMode` | `{ enabled }` |
| `EDIT_BAR_TOGGLED` | Se mostró/ocultó la barra de edición. | `EditModeService > toggleBarVisibility` | `{ visible }` |
| `ABOUT_PAGE_VIEWED` | El usuario visitó la página institucional. | `AboutComponent > ngOnInit` | `undefined` |
| `USER_PROFILE_VIEWED` | El usuario visitó su perfil. | `UserInfoComponent > ngOnInit` | `undefined` |
| `USER_NAME_UPDATED` | Se actualizó el nombre. | `SessionPersistenceService > updateName` | `{ userId, name }` |
| `USER_EMAIL_UPDATED` | Se actualizó el email. | `SessionPersistenceService > updateEmail` | `{ userId, email }` |
| `USER_AREA_UPDATED` | Se actualizó el área de trabajo. | `SessionPersistenceService > updateWorkArea` | `{ userId, area }` |
| `PASSWORD_CHANGED` | Cambio de contraseña exitoso. | `SessionPersistenceService > updatePassword` | `undefined` |

---

> [!TIP]
> Para suscribirte a un evento con tipado estricto:
> `this.eventBus.on(AppEventType.VISUALIZATION_CREATED).subscribe(ev => console.log(ev.payload.id));`
