/**
 * Barrel público de servicios de administración y persistencia.
 * 
 * Regla Arquitectónica:
 * Solo los "Edit Services" (Capa 3, sufijo -edit.service.ts) deben importar desde este barrel.
 * Los componentes de visualización y servicios de estado deben usar exclusivamente los StateServices.
 */

export { ThematicPersistenceService } from '../persistence/thematic-persistence.service';
export { VisualizationPersistenceService } from '../persistence/visualization-persistence.service';
export { SessionPersistenceService } from '../persistence/session-persistence.service';
export { DataWriteService } from '../infrastructure/data-write.service';
