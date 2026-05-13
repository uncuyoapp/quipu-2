import { Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { APP_ICONS } from '@core/config/icons.config';
import { DatasetInfo } from '@core/data/data.provider';
import { AppEventType } from '@core/models/events/app-event.types';
import { Visualization } from '@models/domain/visualization.model';
import { VisualizationFactory } from '@pages/visualization/visualization.factory';
import { AppDialogService, AppEventBusService, EditModeService, VisualizationPersistenceService, VisualizationStateService } from '@services';
import { OrientationWarningComponent } from '@shared/components/orientation-warning/orientation-warning.component';
import { Dataset } from '@uncuyoapp/ngx-data-visualizer';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TagComponent } from '../../shared/components/tag/tag.component';
import { Step1DatasetSelectionComponent } from './steps/step1-dataset-selection/step1-dataset-selection.component';
import { DataConfigResult, DataFilterStepComponent } from './steps/step2-data-filter/step2-data-filter.component';
import { VisualizationConfigStepComponent } from './steps/step3-visualization-config/step3-visualization-config.component';


/**
 * @class VisualizationCreateModalComponent
 * @description
 * Componente de diálogo que orquestará el wizard de creación de una nueva visualización.
 * Gestiona el flujo entre los pasos de selección de dataset, filtrado de datos y
 * configuración visual/guardado.
 */
@Component({
    selector: 'app-visualization-create-modal',
    standalone: true,
    imports: [
        MatDialogModule,
        ButtonComponent,
        TagComponent,
        Step1DatasetSelectionComponent,
        DataFilterStepComponent,
        VisualizationConfigStepComponent,
        OrientationWarningComponent
    ],
    templateUrl: './visualization-create-modal.component.html',
    styleUrl: './visualization-create-modal.component.scss'
})
export class VisualizationCreateModalComponent implements OnInit, OnDestroy {
    private readonly dialogRef = inject(MatDialogRef<VisualizationCreateModalComponent>);
    private readonly visualizationState = inject(VisualizationStateService);
    private readonly persistence = inject(VisualizationPersistenceService);
    private readonly dialogs = inject(AppDialogService);
    private readonly editModeService = inject(EditModeService);
    private readonly eventBus = inject(AppEventBusService);

    protected readonly icons = APP_ICONS;

    /** Señal que referencia al componente del paso 1 para invocar su selección. */
    step1 = viewChild(Step1DatasetSelectionComponent);

    /** Señal que referencia al componente del paso 2 para invocar su validación/procesamiento. */
    step2 = viewChild(DataFilterStepComponent);

    /** Señal que referencia al componente del paso 3 para invocar su acción de guardado. */
    step3 = viewChild(VisualizationConfigStepComponent);

    /** Paso actual del wizard (1-3). */
    currentStep = signal<number>(1);

    /** Información del dataset seleccionado en el primer paso. */
    selectedDatasetInfo = signal<DatasetInfo | null>(null);

    /** Dataset procesado y reducido tras aplicar los filtros en el segundo paso. */
    configuredDataset = signal<Dataset | null>(null);

    /** Modelo de visualización inicial generado para ser configurado en el tercer paso. */
    visualization = signal<Visualization | null>(null);

    ngOnInit(): void {
        this.editModeService.registerHidingModal();
        this.eventBus.emit({ type: AppEventType.VISUALIZATION_WIZARD_OPENED });
    }

    ngOnDestroy(): void {
        this.editModeService.unregisterHidingModal();
    }

    /**
     * Avanza al siguiente paso del wizard. 
     * Si está en el último paso de una sección, dispara su evento de procesamiento interno.
     */
    nextStep() {
        if (this.currentStep() === 1) {
            this.step1()?.onNext();
        } else if (this.currentStep() === 2) {
            this.step2()?.onNext();
        } else if (this.currentStep() === 3) {
            this.step3()?.onCreate();
        }
    }

    /**
     * Retrocede al paso anterior del wizard con confirmación según el contexto.
     */
    prevStep() {
        const step = this.currentStep();

        if (step === 2) {
            this.dialogs.confirm({
                title: '¿Desea volver?',
                message: 'Los filtros aplicados se perderán, ¿está seguro de que desea volver?',
                confirmText: 'Sí, volver',
                cancelText: 'Cancelar'
            }).subscribe(result => {
                if (result) this.currentStep.set(1);
            });
        } else if (step === 3) {
            this.dialogs.confirm({
                title: '¿Desea volver?',
                message: 'Las configuraciones realizadas se perderán, ¿está seguro de que desea volver?',
                confirmText: 'Sí, volver',
                cancelText: 'Cancelar'
            }).subscribe(result => {
                if (result) this.currentStep.set(2);
            });
        }
    }

    /**
     * Solicita confirmación antes de cerrar el modal para evitar pérdida de datos.
     */
    close() {
        this.dialogs.confirm({
            title: 'Descartar visualización',
            message: 'Si cierra se perderán los cambios. ¿Desea continuar?',
            confirmText: 'Cerrar sin guardar',
            cancelText: 'Cancelar',
            confirmPalette: 'pink',
        }).subscribe(result => {
            if (result) {
                this.dialogRef.close();
            }
        });
    }

    /**
     * Maneja la selección de un dataset en el paso 1.
     * @param dataset Información técnica del dataset elegido.
     */
    onDatasetSelected(dataset: DatasetInfo) {
        this.eventBus.emit({
            type: AppEventType.VISUALIZATION_WIZARD_DATASET_SELECTED,
            payload: { datasetId: dataset.id, datasetName: dataset.name }
        });
        this.selectedDatasetInfo.set(dataset);
        this.currentStep.update(s => s + 1);
    }

    /**
     * Maneja la configuración de filtros del paso 2 y genera la visualización base.
     * @param result Resultado del filtrado físico del dataset.
     */
    onDataConfigured(result: DataConfigResult) {
        this.eventBus.emit({
            type: AppEventType.VISUALIZATION_WIZARD_STEP2_NEXT,
            payload: { datasetId: this.selectedDatasetInfo()?.id || 'unknown' }
        });
        this.configuredDataset.set(result.dataset);
        this.visualization.set(VisualizationFactory.createInitialVisualization(result.dataset, this.selectedDatasetInfo() || undefined, result.baseFilters));
        this.currentStep.update(s => s + 1);
    }

    /**
     * Orquesta el guardado final de la visualización.
     * @param published Indica si la visualización debe marcarse como publicada.
     */
    onSave(published: boolean = true) {
        const vizComponent = this.step3()?.visualizationComponent();
        const editService = vizComponent?.editService;
        if (!vizComponent || !editService) return;

        const filters = vizComponent.getCurrentFilters();
        const hasVisualFilters = vizComponent.checkIfFiltersAreActive();

        const processSave = (saveWithFilters: boolean) => {
            const finalViz = editService.getUpdatedVisualization(saveWithFilters ? filters : undefined);
            finalViz.published = published;
            this.performCreate(finalViz);
        };

        if (hasVisualFilters) {
            this.dialogs.confirm({
                title: '¿Guardar filtros actuales?',
                message: 'Se han detectado filtros aplicados. ¿Deseas que estos filtros se guarden de forma permanente en la nueva visualización?',
                confirmText: 'Sí, guardar con filtros',
                cancelText: 'No, solo diseño',
            }).subscribe((result) => {
                processSave(!!result);
            });
        } else {
            processSave(false);
        }
    }

    private performCreate(visualization: Visualization) {
        this.persistence.create(visualization).subscribe({
            next: (newViz) => {
                this.eventBus.emit({
                    type: AppEventType.VISUALIZATION_WIZARD_SAVED,
                    payload: { id: newViz.id }
                });
                this.dialogRef.close(true);
            },
            error: (err) => console.error('Error al crear visualización:', err)
        });
    }
}
