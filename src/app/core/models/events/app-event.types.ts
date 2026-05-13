/**
 * @enum AppEventType
 * @description
 * Enumeración semántica de todos los tipos de eventos globales en la aplicación.
 * Sigue el patrón [Módulo/Contexto] Acción para mayor claridad en el debugging y analytics.
 */
export enum AppEventType {
  // --- Módulo: Temáticas ---
  THEMATICS_LOADED = '[Thematics] Loaded',
  THEMATIC_VIEWED = '[Thematics] Viewed',
  THEMATIC_CATEGORY_SELECTED = '[Thematics] Category Selected',
  THEMATIC_SUBCATEGORY_SELECTED = '[Thematics] Subcategory Selected',
  THEMATIC_ROOT_CREATED = '[Thematics] Root Created',
  THEMATIC_CATEGORY_CREATED = '[Thematics] Category Created',
  THEMATIC_SUBCATEGORY_CREATED = '[Thematics] Subcategory Created',
  THEMATIC_ROOT_EDITED = '[Thematics] Root Edited',
  THEMATIC_CATEGORY_EDITED = '[Thematics] Category Edited',
  THEMATIC_SUBCATEGORY_EDITED = '[Thematics] Subcategory Edited',
  THEMATIC_ROOT_DELETED = '[Thematics] Root Deleted',
  THEMATIC_CATEGORY_DELETED = '[Thematics] Category Deleted',
  THEMATIC_SUBCATEGORY_DELETED = '[Thematics] Subcategory Deleted',
  THEMATIC_ROOT_REORDERED = '[Thematics] Root Reordered',
  THEMATIC_CATEGORY_REORDERED = '[Thematics] Category Reordered',
  THEMATIC_SUBCATEGORY_REORDERED = '[Thematics] Subcategory Reordered',
  THEMATIC_ASSOCIATION_OPENED = '[Thematics] Association Opened',
  THEMATIC_ASSOCIATION_SAVED = '[Thematics] Association Saved',

  // --- Módulo: Visualizaciones (Wizard y Editor) ---
  VISUALIZATION_WIZARD_OPENED = '[Visualization Wizard] Opened',
  VISUALIZATION_WIZARD_STEP1_FILTERED = '[Visualization Wizard] Step 1 Filtered',
  VISUALIZATION_WIZARD_DATASET_SELECTED = '[Visualization Wizard] Dataset Selected',
  VISUALIZATION_WIZARD_STEP2_ACTION = '[Visualization Wizard] Step 2 Action',
  VISUALIZATION_WIZARD_STEP2_NEXT = '[Visualization Wizard] Step 2 Next',
  VISUALIZATION_WIZARD_INFO_EDITED = '[Visualization Wizard] Info Edited',
  VISUALIZATION_WIZARD_CHART_ADDED = '[Visualization Wizard] Chart Added',
  VISUALIZATION_WIZARD_CHART_REMOVED = '[Visualization Wizard] Chart Removed',
  VISUALIZATION_WIZARD_TABLE_ADDED = '[Visualization Wizard] Table Added',
  VISUALIZATION_WIZARD_TABLE_REMOVED = '[Visualization Wizard] Table Removed',
  VISUALIZATION_WIZARD_SAVED = '[Visualization Wizard] Saved',

  // --- Módulo: Visualizaciones ---
  VISUALIZATIONS_LIST_VIEWED = '[Visualization] List Viewed',
  VISUALIZATION_OPENED = '[Visualization] Opened',
  GRID_FILTER_CHANGED = '[Visualization Grid] Filter Changed',
  GRID_ORDER_CHANGED = '[Visualization Grid] Order Changed',
  EDIT_MODE_TOGGLED = '[UX] Edit Mode Toggled',
  EDIT_BAR_TOGGLED = '[UX] Edit Bar Toggled',
  VISUALIZATION_ACTIONS_OPENED = '[Visualization] Actions Opened',
  VISUALIZATION_ROLLUP_CHANGED = '[Visualization] Rollup Changed',
  VISUALIZATION_ITEMS_FILTERED = '[Visualization] Items Filtered',
  VISUALIZATION_MULTI_CHARTS_CHANGED = '[Visualization] Multi-charts Changed',
  VISUALIZATION_PERCENTAGE_TOGGLED = '[Visualization] Percentage Toggled',
  VISUALIZATION_CHART_DOWNLOADED = '[Visualization] Chart Downloaded',
  VISUALIZATION_CHART_FULLSCREEN_TOGGLED = '[Visualization] Chart Fullscreen Toggled',
  VISUALIZATION_TABLE_DOWNLOADED = '[Visualization] Table Downloaded',
  VISUALIZATION_TABLE_FULLSCREEN_TOGGLED = '[Visualization] Table Fullscreen Toggled',
  VISUALIZATION_TECHNICAL_SHEET_TOGGLED = '[Visualization] Technical Sheet Toggled',
  VISUALIZATION_CREATED = '[Visualization] Created',
  VISUALIZATION_EDITED = '[Visualization] Edited',
  VISUALIZATION_DELETED = '[Visualization] Deleted',
  VISUALIZATION_PUBLISHED = '[Visualization] Published',
  VISUALIZATION_UNPUBLISHED = '[Visualization] Unpublished',

  // --- Módulo: Búsqueda ---
  SEARCH_USED = '[Search] Used',

  // --- Módulo: Acciones de Usuario ---
  DOWNLOAD_USED = '[Action] Download Used',

  // --- Módulo: Autenticación/Sesión ---
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGOUT = '[Auth] Logout',
  IU_SELECTED = '[Auth] IU Selected',
  ABOUT_PAGE_VIEWED = '[System] About Page Viewed',
  USER_PROFILE_VIEWED = '[User] Profile Viewed',
  USER_NAME_UPDATED = '[User] Name Updated',
  USER_EMAIL_UPDATED = '[User] Email Updated',
  USER_AREA_UPDATED = '[User] Area Updated',
  PASSWORD_CHANGED = '[Auth] Password Changed'
}
