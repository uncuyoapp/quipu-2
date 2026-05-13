# Arquitectura Técnica — Quipu

> **Versión**: Abril 2026 · Angular 18+ · Standalone Components · CQRS-lite

Este documento describe el estado arquitectónico **actual** de la aplicación luego de las refactorizaciones completadas entre las Fases 1 y 9 del plan de refactorización. Consolida el conocimiento disperso en los guías de refactorización y sirve como referencia canónica para nuevos desarrollos.

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura de Directorios](#3-estructura-de-directorios)
4. [Capas de Servicios (CQRS-lite)](#4-capas-de-servicios-cqrs-lite)
5. [Patrón de Proveedor de Datos](#5-patrón-de-proveedor-de-datos)
6. [Páginas y su Arquitectura Interna](#6-páginas-y-su-arquitectura-interna)
7. [Layout y Componentes Globales](#7-layout-y-componentes-globales)
8. [Sistema de Guardas y Seguridad RBAC](#8-sistema-de-guardas-y-seguridad-rbac)
9. [Enrutamiento](#9-enrutamiento)
10. [Reactividad: Signals vs RxJS](#10-reactividad-signals-vs-rxjs)
11. [Convenciones y Reglas de Importación](#11-convenciones-y-reglas-de-importación)
12. [Configuración y Bootstrap](#12-configuración-y-bootstrap)
13. [Gestión de Recursos Gráficos e Ilustraciones](#13-gestión-de-recursos-gráficos-e-ilustraciones)
14. [Gestión de Iconos Semánticos](#14-gestión-de-iconos-semánticos)

---

## 1. Visión General

Quipu es una **PWA Angular** que permite explorar, gestionar y visualizar datos públicos de la Universidad Nacional de Cuyo. La aplicación cuenta con dos modos de operación:

- **Modo Viewer** (`role: 'viewer'`): Acceso de solo lectura al catálogo de visualizaciones.
- **Modo Admin** (`role: 'admin'`): Acceso completo con la capacidad de activar el **Modo Edición**, que habilita operaciones CRUD sobre temáticas y visualizaciones.

El principio arquitectónico central es **CQRS-lite**: la lectura de estado y la escritura de datos están estrictamente separadas en capas de servicios distintas, garantizando que ningún componente de visualización pueda accidentalmente invocar operaciones destructivas.

---

## 2. Stack Tecnológico

| Categoría             | Tecnología / Librería                             |
| --------------------- | ------------------------------------------------- |
| Framework             | Angular 18+ (Standalone Components)               |
| Estilos               | SASS/SCSS                                         |
| UI Components         | Angular Material                                  |
| Íconos                | `@ng-icons/ionicons`                              |
| Visualizaciones       | `@uncuyoapp/ngx-data-visualizer` (lib interna)    |
| Reactividad           | Angular Signals (`signal`, `computed`, `effect`)  |
| HTTP                  | `HttpClient` con interceptores                    |
| Drag & Drop           | `@angular/cdk/drag-drop`                          |
| Service Worker / PWA  | `@angular/service-worker`                         |
| Lenguaje              | TypeScript (strict, sin `any`)                    |

---

## 3. Estructura de Directorios

```
src/app/
├── app.component.ts          # Componente raíz (orquestador de bootstrap)
├── app.config.ts             # Configuración de la aplicación (providers globales)
├── app.routes.ts             # Definición de rutas
│
├── core/                     # Núcleo: servicios, modelos, infraestructura
│   ├── data/                 # Capa de acceso a datos
│   │   ├── data.provider.ts  # Contrato abstracto IDataProvider
│   │   ├── providers/
│   │   │   ├── quipu-api.provider.ts   # Implementación real (HTTP)
│   │   │   └── mock-data.provider.ts   # Implementación mock (desarrollo)
│   │   └── mock/             # Datos estáticos para desarrollo (en src/assets/mock)
│   │
│   ├── services/             # Servicios organizados por capa
│   │   ├── infrastructure/   # Capa 0: Fachadas de acceso a datos
│   │   │   ├── data-read.service.ts
│   │   │   ├── data-write.service.ts
│   │   │   ├── base-api.service.ts
│   │   │   ├── cache.service.ts
│   │   │   └── loading.service.ts
│   │   │
│   │   ├── state/            # Capa 1: Signal stores (solo lectura)
│   │   │   ├── session-state.service.ts
│   │   │   ├── thematic-state.service.ts
│   │   │   └── visualization-state.service.ts
│   │   │
│   │   ├── persistence/      # Capa 2: Mutaciones contra la API
│   │   │   ├── session-persistence.service.ts
│   │   │   ├── thematic-persistence.service.ts
│   │   │   └── visualization-persistence.service.ts
│   │   │
│   │   ├── ux/               # Capa UX/transversal
│   │   │   ├── edit-mode.service.ts
│   │   │   ├── app-dialog.service.ts
│   │   │   ├── information-unit.service.ts
│   │   │   ├── pwa-install.service.ts
│   │   │   ├── pwa-update.service.ts
│   │   │   └── screen-orientation.service.ts
│   │   │
│   │   └── admin/
│   │       └── index.ts      # Barrel de seguridad (solo para Edit Services)
│   │
│   ├── factories/            # Lógica de transformación de datos pura
│   │   └── thematic.factory.ts
│   │
│   ├── guards/               # Guardias de rutas y acciones
│   │   ├── auth.guard.ts
│   │   ├── login.guard.ts
│   │   └── admin-action.guard.ts
│   │
│   ├── interceptors/         # Interceptores HTTP
│   │   ├── auth.interceptor.ts
│   │   └── http-loading.interceptor.ts
│   │
│   ├── models/               # Interfaces y tipos del dominio
│   │   ├── domain/           # Entidades de negocio (Visualization, User, etc.)
│   │   ├── infrastructure/   # Contratos técnicos (API, Cache)
│   │   ├── common/           # Modelos compartidos genéricos (SaveResult)
│   │   └── events/           # Definiciones de eventos del sistema
│   │
│   ├── pipes/                # Pipes reutilizables
│   └── directives/           # Directivas compartidas
│
├── pages/                    # Páginas (rutas principales)
│   ├── home/
│   ├── thematic/
│   ├── visualization/
│   ├── visualizations-list/
│   ├── search/
│   ├── login/
│   ├── user-info/
│   └── about/
│
├── components/               # Componentes reutilizables por feature
│   ├── thematics/
│   ├── visualizations/
│   ├── visualization/        # Subcomponentes del visor (v-chart, v-table, etc.)
│   ├── search-bar/
│   └── auth/
│
├── layout/                   # Componentes estructurales de la app
│   ├── main/
│   ├── nav-bar/
│   ├── breadcrumb/
│   ├── edit-mode-bar/
│   └── footer/
│
└── shared/                   # Componentes UI genéricos reutilizables
    └── components/
        ├── button/
        ├── tag/
        ├── alert-badge/
        └── ...
```

---

## 4. Capas de Servicios (CQRS-lite)

La arquitectura central de la aplicación está basada en un patrón **CQRS-lite** (Command-Query Responsibility Segregation simplificado), organizado en 4 capas:

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 0: INFRAESTRUCTURA                                │
│  DataReadService  /  DataWriteService                   │
│  Fachadas sobre IDataProvider (API o Mock)              │
├─────────────────────────────────────────────────────────┤
│  CAPA 1: ESTADO (Solo Lectura)                          │
│  SessionStateService / ThematicStateService             │
│  VisualizationStateService                              │
│  Signal stores globales, solo getters y computed()      │
├─────────────────────────────────────────────────────────┤
│  CAPA 2: PERSISTENCIA (Solo Escritura)                  │
│  SessionPersistenceService / ThematicPersistenceService │
│  VisualizationPersistenceService                        │
│  Mutaciones POST/PUT/DELETE + sincronización de estado  │
├─────────────────────────────────────────────────────────┤
│  CAPA 3: EDICIÓN / UX                                   │
│  HomeEditService / ThematicEditService                  │
│  VisualizationEditService / VisualizationGridEditService│
│  Orquestación de diálogos, borradores, validaciones     │
└─────────────────────────────────────────────────────────┘
```

### 4.1 Capa 0 — Infraestructura

| Servicio | Descripción |
|----------|-------------|
| `DataReadService` | Fachada de solo lectura sobre `IDataProvider`. Expone métodos de consulta para temáticas, visualizaciones, datasets, usuarios. |
| `DataWriteService` | Fachada de escritura sobre `IDataProvider`. Expone métodos de mutación (CRUD, auth). Importado **exclusivamente** por la Capa 2. |
| `BaseApiService` | Servicio HTTP base con gestión de caché. Heredado por `QuipuApiProvider`. |
| `CacheService` | Caché en memoria genérico con TTL configurable. |
| `LoadingService` | Estado global de carga (spinner) con mensajes rotativos opcionales. |

### 4.2 Capa 1 — Estado (Signal Stores)

Estos servicios son `providedIn: 'root'` y actúan como la fuente de verdad global. **Solo exponen signals de solo lectura (`asReadonly()`) y métodos computados.**

| Servicio | Signals principales | Responsabilidad |
|----------|---------------------|-----------------|
| `SessionStateService` | `user`, `isAuthenticated`, `currentInformationUnit` | Estado del usuario autenticado. Inicializa desde `localStorage` y valida contra la API. |
| `ThematicStateService` | `thematics`, `loading`, `palette` | Árbol completo de temáticas. Se recarga automáticamente al cambiar de unidad de información (via `effect`). |
| `VisualizationStateService` | (sin signals propios; provee métodos de consulta) | Lógica de dominio de visualizaciones: obtención de datos, transformación de datasets, filtros. |

**Contrato interno de sincronización**: Los servicios de Capa 1 exponen métodos con prefijo `_` (ej. `_patchTree`, `_patchUser`, `_clearUser`) que son el único contrato autorizado para que la Capa 2 sincronice el estado tras una mutación exitosa.

### 4.3 Capa 2 — Persistencia

Servicios `providedIn: 'root'`, accesibles **únicamente desde Edit Services** (Capa 3). Todos sus métodos de mutación están protegidos por el `adminGuard`.

| Servicio | Responsabilidad |
|----------|-----------------|
| `ThematicPersistenceService` | CRUD de temáticas. Tras cada mutación exitosa sincroniza `ThematicStateService._patchTree()`. Implementa actualización optimista en `reorder()`. |
| `VisualizationPersistenceService` | Crear, actualizar, publicar, despublicar y eliminar visualizaciones. |
| `SessionPersistenceService` | Login, logout, recuperación de contraseña. Edición de perfil de usuario. Sin restricción de rol. |

### 4.4 Capa 3 — Edición / UX

Servicios **locales al componente** (`@Injectable()` sin `providedIn`), registrados en el array `providers` del componente host. Se destruyen junto con el componente.

| Servicio | Registrado en | Responsabilidad |
|----------|---------------|-----------------|
| `HomeEditService` | `HomeComponent` | CRUD de temáticas raíz (diálogos, confirmaciones). |
| `ThematicEditService` | `ThematicComponent` | Renombrar, eliminar, reordenar categorías/subcategorías, asociar visualizaciones. |
| `VisualizationEditService` | `VisualizationComponent` | Toggles de gráfico/tabla, guardado, publicación, snapshots, manejo de diálogo de cierre. |
| `VisualizationGridEditService` | `ThematicComponent` | Selección múltiple, acciones por lote (publicar, despublicar, eliminar). |

### 4.5 Sevicios UX Transversales

| Servicio | Responsabilidad |
|----------|-----------------|
| `EditModeService` | Estado global del Modo Edición. Persiste en `localStorage`. Computed `canEdit()` basado en rol. |
| `AppDialogService` | Apertura centralizada de diálogos Material (`VisualizationComponent`, `VisualizationCreateModalComponent`). |
| `InformationUnitService` | Apertura de selector de Unidad de Información (Dialog/BottomSheet). |
| `ScreenOrientationService` | Gestión de orientación de pantalla y detección de dispositivo móvil. |
| `PwaInstallService` | Captura y exposición del evento `beforeinstallprompt`. |
| `PwaUpdateService` | Detecta nuevas versiones del Service Worker y ofrece actualizar. |

---

## 5. Patrón de Proveedor de Datos

La aplicación es **agnóstica de la fuente de datos** gracias al patrón de **Strategy** implementado a través de `IDataProvider`.

```
app.config.ts
    └── { provide: IDataProvider, useClass: environment.useMockData 
                                              ? MockDataProvider 
                                              : QuipuApiProvider }
```

### Implementaciones

| Clase | Entorno | Descripción |
|-------|---------|-------------|
| `QuipuApiProvider` | Producción | Realiza llamadas HTTP reales al backend de Quipu. Hereda de `BaseApiService` para gestión de caché y autenticación. |
| `MockDataProvider` | Desarrollo | Lee datos estáticos desde archivos JSON en `src/assets/mock/`. Simula latencia y errores. En `updateVisualization()` descarga el JSON modificado en vez de llamar a la API. |

### Flujo de lectura

```
Componente/ViewState
    └─→ StateService (Capa 1)
            └─→ DataReadService (Capa 0)
                    └─→ IDataProvider (QuipuApiProvider / MockDataProvider)
                            └─→ API REST / Datos estáticos
```

### Flujo de escritura

```
Acción del usuario en Componente
    └─→ EditService (Capa 3)
            └─→ PersistenceService (Capa 2)     ← requireAdmin() verifica rol
                    ├─→ DataWriteService (Capa 0)
                    │       └─→ IDataProvider → API REST
                    └─→ StateService._patch*()  ← sincronización reactiva
```

---

## 6. Páginas y su Arquitectura Interna

Cada página implementa un patrón consistente de tres capas de servicios locales:

```
PageComponent
├── providers: [EditService, ViewStateService]  ← locales al componente
├── inject(StateService)   ← lectura global (Capa 1)
├── inject(EditModeService) ← estado de edición global
└── inject(ViewStateService) ← estado local de la vista
```

### 6.1 Home Page (`HomeComponent`)

**Rol**: Grid principal de temáticas raíz + barra de búsqueda global.

**Servicios locales**:
- `HomeViewStateService`: Agrupa la lógica de navegación (a `/search`, `/visualizations`).
- `HomeEditService`: Orquesta el CRUD de temáticas raíz delegando a `ThematicPersistenceService`.

**Servicios globales inyectados**: `ThematicStateService` (a través de `ThematicGridComponent`), `EditModeService`.

**Flujo de datos**: `ThematicStateService.thematics()` → `ThematicGridComponent` → renderiza la grilla reactivamente.

### 6.2 Thematic Page (`ThematicComponent`)

**Rol**: Navegador de árbol de categorías/subcategorías + grilla de visualizaciones.

**Servicios locales**:
- `ThematicEditService`: CRUD de nodos del árbol, reordenamiento via CDK Drag & Drop, asociación de visualizaciones.
- `VisualizationGridEditService`: Selección múltiple y acciones por lote sobre la grilla de visualizaciones.
- `ThematicViewStateService`: Estado de la vista (temática seleccionada, filtros de visualizaciones, orden).

**Flujo de parámetros de URL**: `ActivatedRoute.params` → `toSignal()` → `computed(id)` → `ThematicStateService.getThematic(id)`.

**Recarga automática**: `VisualizationGridEditService.onActionSuccess` (Observable) → `takeUntilDestroyed()` → `ThematicViewStateService.refresh()`.

### 6.3 Visualization Page (`VisualizationComponent`)

**Rol**: Visor completo de una visualización individual. Puede abrirse como Modal Material o como ruta directa (`/visualization`).

**Servicios locales**:
- `VisualizationViewStateService`: Gestiona el estado reactivo de los datos renderizados (dataset, dimensiones, opciones de gráfico/tabla, modo Trellis/Small multiples).
- `VisualizationEditService`: Toggles gráfico/tabla, guardado de cambios, publicación, gestión del borrador durante la sesión de edición.

**Inputs signal**: `visualizationInput`, `datasetInput`, `showControls`, `showCloseButton`, `showSaveButton`, `expandMetadata`.

**Doble modo de apertura**:
- Desde grilla → `MAT_DIALOG_DATA` inyecta `{ visualization: Signal<Visualization> }`.
- Desde ruta directa → `visualizationInput` inyectado desde fuera.

**Ciclo de vida**:
1. `ngOnInit` → `viewState.initialize(viz, datasetInput())`.
2. `VisualizationViewStateService.initialize()` → carga dataset desde `VisualizationStateService.getPreparedDataset()` → transforma via `VisualizationFactory`.
3. `effects` en constructor → sincroniza filtros (reaplica al cambiar dimensiones) e inicializa el editor cuando el modo edición está activo.

### 6.4 Visualizations List Page (`VisualizationsListComponent`)

**Rol**: Explorador paginado de todas las visualizaciones (Infinite Scroll via Intersection Observer).

**Sin modo edición**: Solo usa `VisualizationStateService.getVisualizationsPage()`.

### 6.5 Search Page (`SearchComponent`)

**Rol**: Búsqueda de texto libre sobre el catálogo de visualizaciones.

**Manejo de route params**: Lee `queryParams.q` via `toSignal()` para disparar la búsqueda reactivamente.

### 6.6 Login Page (`LoginComponent`)

**Rol**: Formulario de autenticación con flujo de recuperación de contraseña en 3 estados (login / recovery-request / password-change).

**Delegación**: Usa `SessionPersistenceService` para `login()`, `recoveryPass()`, `verifyRecoveryToken()`, `changePassword()`.

### 6.7 User Info Page (`UserInfoComponent`)

**Rol**: Vista de perfil de usuario con sub-rutas para edición de cada campo.

**Sub-páginas**: `UserProfileInfoComponent`, `UserNameEditComponent`, `UserEmailEditComponent`, `UserPasswordEditComponent`, `UserWorkAreaEditComponent`.

**Delegación**: Cada componente de edición usa `SessionPersistenceService` para mutar y sincroniza el signal de `SessionStateService`.

### 6.8 About Page (`AboutComponent`)

**Rol**: Página institucional estática con información sobre QUIPU, versión de la app y logo de la unidad de información activa.

---

## 7. Layout y Componentes Globales

### 7.1 MainComponent

Shell que contiene el `RouterOutlet` junto con `NavBarComponent`, `BreadcrumbComponent`, `EditModeBarComponent` y `FooterComponent`. Todas las rutas autenticadas renderizan dentro de este shell.

### 7.2 NavBarComponent

Barra de navegación principal. En modo admin muestra el toggle de Modo Edición. Consume `SessionStateService.user()` y `EditModeService.canEdit()`.

### 7.3 EditModeBarComponent

Barra inferior flotante visible solo cuando el Modo Edición está activo. Contiene controles para desactivar o ocultar la barra. Se oculta automáticamente cuando hay modales abiertos (via `EditModeService.registerHidingModal() / unregisterHidingModal()`).

### 7.4 BreadcrumbComponent

Genera el rastro de navegación basándose en los datos `breadcrumb` de las rutas (`ActivatedRoute.data`).

---

## 8. Sistema de Guardas y Seguridad RBAC

La seguridad de rol está implementada en dos niveles:

### 8.1 Nivel de Ruta

| Guard | Uso | Lógica |
|-------|-----|--------|
| `authGuard` | Rutas privadas (shell principal) | `SessionStateService.hasValidSession()` → redirige a `/login` si no hay sesión. |
| `loginGuard` | Ruta `/login` | Redirige a `/` si el usuario ya está autenticado. |

### 8.2 Nivel de Acción (Runtime)

`useAdminGuard()` es una **función factory** (no un decorador de clase) que se invoca durante la inicialización de los Persistence Services para capturar el contexto de inyección de Angular:

```typescript
// ThematicPersistenceService
private readonly adminGuard = useAdminGuard();

create(thematic: Partial<Thematic>): Observable<Thematic> {
  return this.adminGuard(this.dataWrite.createThematic(thematic).pipe(...));
}
```

Si el usuario no tiene `role === 'admin'`, la función retorna `throwError()` sin llegar a ejecutar la llamada HTTP.

### 8.3 Nivel de UI

`EditModeService.canEdit()` es un `computed()` que evalúa `user().role === 'admin'`. Los templates condicionan la visibilidad de todos los botones de acción con `@if (editModeService.canEdit())`.

### 8.4 Barrel de Seguridad

```typescript
// src/app/core/services/admin/index.ts
// Solo los Edit Services (*-edit.service.ts) deben importar desde aquí
export { ThematicPersistenceService }    from '../persistence/...';
export { VisualizationPersistenceService } from '../persistence/...';
export { SessionPersistenceService }     from '../persistence/...';
export { DataWriteService }              from '../infrastructure/...';
```

---

## 9. Enrutamiento

```typescript
// Estructura de rutas
/login                → LoginComponent         (loginGuard)
/login/:token         → LoginComponent         (loginGuard)
/ (shell)             → MainComponent           (authGuard)
  /                   → HomeComponent           (lazy)
  /about              → AboutComponent          (lazy)
  /search             → SearchComponent         (lazy)
  /thematic/:id       → ThematicComponent       (lazy)
  /visualization      → VisualizationComponent  (lazy)
  /visualizations     → VisualizationsListComponent (lazy)
  /user               → UserInfoComponent       (eager, con sub-rutas)
    /                 → UserProfileInfoComponent (lazy)
    /edit-name        → UserNameEditComponent    (lazy)
    /edit-email       → UserEmailEditComponent   (lazy)
    /edit-work-area   → UserWorkAreaEditComponent (lazy)
    /change-password  → UserPasswordEditComponent (lazy)
```

Todas las rutas principales dentro del shell (excepto `UserInfoComponent`) utilizan **lazy loading** con `loadComponent: () => import(...)`.

---

## 10. Reactividad: Signals vs RxJS

La aplicación privilegia **Angular Signals** como mecanismo principal de reactividad, reservando RxJS para operaciones asíncronas (HTTP) y flujos orientados a eventos.

### Cuándo usar Signals

- Estado derivado sin efectos secundarios: `computed()`
- Estado mutable reactivo: `signal()` / `.update()` / `.set()`
- Inputs de componentes: `input()` / `input.required()`
- Outputs de componentes: `output()`
- Binding bidireccional: `model()`
- Efectos reactivos: `effect()` en el constructor

### Cuándo usar RxJS

- Llamadas HTTP (`Observable` retornado por `HttpClient`)
- Flujos continuos (ej. `ActivatedRoute.queryParams`)
- Manejo de tiempo / debounce en autocompletado
- Composición compleja de flujos (`switchMap`, `filter`, `tap`)

### Patrón `toSignal`

Para convertir observables de Angular Router a señales en componentes:

```typescript
private readonly params = toSignal(this.route.params);
public readonly id = computed(() => Number.parseInt(this.params()?.['id'] ?? '0'));
```

### Patrón `takeUntilDestroyed`

Para suscripciones reactivas en el constructor del componente:

```typescript
this.gridEditService.onActionSuccess
  .pipe(takeUntilDestroyed())
  .subscribe(() => this.viewState.refresh());
```

---

## 11. Convenciones y Reglas de Importación

### 11.1 Path Aliases (tsconfig.json)

```
@core/*         → src/app/core/*
@services       → src/app/core/services/index.ts
@services/*     → src/app/core/services/*
@models/*       → src/app/core/models/*
@components/*   → src/app/components/*
@pages/*        → src/app/pages/*
@shared/*       → src/app/shared/*
@environments/*  → src/environments/*
@assets/*       → src/assets/*
```

### 11.2 Barrel raíz de servicios (`@services`)

El archivo `src/app/core/services/index.ts` re-exporta los servicios más utilizados para simplificar imports:

```typescript
import { ThematicStateService, SessionStateService, EditModeService } from '@services';
```

### 11.3 Reglas de Inyección

| Regla | Descripción |
|-------|-------------|
| ✅ Usar `inject()` | Única forma permitida de inyectar dependencias |
| ❌ Prohibido `constructor(private x: X)` | No se usa inyección via constructor |
| ✅ `standalone: true` | Todos los componentes son standalone |
| ❌ Prohibido `NgModule` | No existe ningún módulo de Angular |

### 11.4 Reglas de Importación entre Capas

| Desde | Puede importar |
|-------|----------------|
| Componentes (lectura) | Capa 1 (`*StateService`), Capa UX |
| Edit Services (Capa 3) | Capa 2 (`@services/admin` barrel), Capa 1 (lectura), Capa UX |
| Capa 1 (State) | Capa 0 (`DataReadService`) |
| Capa 2 (Persistence) | Capa 0 (`DataWriteService`), Capa 1 (para `_patch*`) |
| Capa 0 (Infrastructure) | Solo `IDataProvider` (inyectado por DI) |

### 11.5 Nomenclatura de Archivos

```
thematic-state.service.ts        → ServicioEstado
thematic-persistence.service.ts  → ServicioPersistencia
thematic-edit.service.ts         → ServicioEdición (local al componente)
thematic-view-state.service.ts   → EstadoVista (local al componente)
thematic.model.ts                → Modelo de dominio (Interfaces/Tipos)
thematic.factory.ts              → Lógica pura de transformación
```

---

## 12. Configuración y Bootstrap

### 12.1 `app.config.ts`

Configura los providers globales de la aplicación:

- **Router**: `provideRouter(routes)`
- **HTTP**: `provideHttpClient(withInterceptors([authInterceptor, httpLoadingInterceptor]))`
- **Animaciones**: `provideAnimationsAsync()`
- **Service Worker**: `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })`
- **Proveedor de Datos**: `{ provide: IDataProvider, useClass: environment.useMockData ? MockDataProvider : QuipuApiProvider }`
- **Íconos**: `provideIcons({...})` + `provideNgIconsConfig({ size: '1.2em' })`
- **Visualizador**: `provideDataVisualizerCharts()` + `provideDataVisualizerTables()`

### 12.2 `AppComponent`

El componente raíz actúa como orquestador de inicialización. Su único `effect` detecta cambios de Unidad de Información activa para limpiar el caché y evitar datos cruzados entre unidades.

```typescript
effect(() => {
  const currentUnit = this.sessionState.currentInformationUnit();
  if (currentUnit && this.lastInformationUnitId !== null && 
      this.lastInformationUnitId !== currentUnit.id) {
    this.dataWrite.clearCache();  // Limpia caché al cambiar de IU
  }
  this.lastInformationUnitId = currentUnit?.id ?? null;
}, { allowSignalWrites: true });
```

### 12.3 Interceptores HTTP

| Interceptor | Función |
|-------------|---------|
| `authInterceptor` | Agrega el Bearer token a todas las requests salientes. |
| `httpLoadingInterceptor` | Activa/desactiva `LoadingService` durante requests HTTP (solo en producción). |

---

## Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                          USUARIO                                │
└───────────────────────┬─────────────────────────────────────────┘
                        │ Interacción
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTE (Vista)                           │
│  • Signals de estado: StateService.signal()                     │
│  • Delegación de edición: EditService.action()                  │
│  • Modo edición: EditModeService.isEditModeEnabled()            │
└──────────┬───────────────────────────┬──────────────────────────┘
           │ Lectura                   │ Acción de edición
           ▼                           ▼
┌──────────────────┐         ┌─────────────────────┐
│  STATE SERVICE   │         │    EDIT SERVICE      │
│  (Capa 1)        │         │    (Capa 3)          │
│  signal()        │         │  Dialogs, borradores │
│  computed()      │         │  Validaciones        │
└────────┬─────────┘         └───────────┬─────────┘
         │                               │
         │                               ▼
         │                    ┌──────────────────────────────┐
         │                    │   PERSISTENCE SERVICE         │
         │                    │   (Capa 2)                   │
         │                    │   + useAdminGuard()           │
         │                    │   + _patch*(sync)  ←──────── │─┐
         │                    └──────────────┬───────────────┘  │
         │                                   │ sync             │
         │                                   └──────────────────┘
         │                                   ▼
         ▼                    ┌──────────────────────────────┐
┌──────────────────┐          │   DATA READ/WRITE SERVICE    │
│  DataReadService │          │   (Capa 0)                   │
│  (Capa 0)        │          └──────────────┬───────────────┘
└────────┬─────────┘                         │
         │                                   │
         └──────────────┬────────────────────┘
                        ▼
            ┌───────────────────────┐
            │     IDataProvider     │
            │   QuipuApiProvider    │
            │  (o MockDataProvider) │
            └───────────────────────┘
            └───────────────────────┘
```

---

## 13. Gestión de Recursos Gráficos e Ilustraciones

El manejo de activos gráficos estáticos (logos, fondos, iconos de visualizaciones e ilustraciones) está centralizado para evitar rutas quemadas (hardcodeadas) en los componentes. Esto se gestiona a través del archivo `src/app/core/config/illustrations.config.ts`.

### Patrón de Consumo

1. **Definición Centralizada**: `APP_LOGOS`, `APP_BACKGROUNDS`, `APP_ILLUSTRATIONS` y `VISUALIZATION_TYPES_ICONS` almacenan las rutas directas a los activos.
2. **THEMATIC_ILLUSTRATIONS**: Contiene exclusivamente los nombres base de archivo (ej. `cat-01.svg`) para las temáticas, desacoplando la base de datos de la ruta física en el frontend. La función `getThematicIllustrationPath()` reconstruye la ruta dinámicamente.
3. **SECTION_GRAPHICS**: Agrupa las rutas requeridas para cada componente (por ejemplo, `login`, `home`, `thematic`). Los componentes exponen su sección correspondiente (ej. `public readonly graphics = SECTION_GRAPHICS.login`) y el template consume las propiedades (`graphics.hero`, `graphics.logoMain`, etc.).
4. **Cero `url()` en SCSS**: Los fondos dinámicos y logos se inyectan mediante variables CSS y bindings de estilo en el template (`[style.--mi-fondo]="'url(' + graphics.background + ')'"` o `[style.background-image]`), en lugar de usar referencias `url(...)` estáticas en el SCSS. Esto asegura un soporte futuro sencillo para múltiples temas visuales (ej. Dark Mode) y portabilidad estructural.

---

## 14. Gestión de Iconos Semánticos

El manejo de íconos en la aplicación está centralizado mediante un sistema de tokens semánticos en `src/app/core/config/icons.config.ts`. Este enfoque asegura la consistencia en toda la UI y facilita el reemplazo de la librería subyacente si fuese necesario.

1. **Fuente Única de Verdad (`APP_ICONS`)**: Todos los íconos utilizados en la aplicación están registrados en la constante `APP_ICONS`, organizados jerárquicamente por categorías (ui, nav, viz, actions, status, module).
2. **Registro Global**: Todos los íconos requeridos (provistos por `@ng-icons/ionicons` u otros) se importan y registran globalmente una sola vez en `app.config.ts` mediante `provideIcons`. **No se permite** el uso de `provideIcons` a nivel de componente.
3. **Uso en Componentes**: Los componentes no conocen el identificador real del ícono (ej. `ionSearchOutline`). En su lugar, inyectan la constante `APP_ICONS` y referencian el token semántico en el template (ej. `[name]="icons.actions.search"`).

---
