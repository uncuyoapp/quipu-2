import { Component, computed, inject, input, output, viewChild } from '@angular/core';
import { Visualization } from '@models/domain/visualization.model';
import { VisualizationComponent } from '@pages/visualization/visualization.component';
import { EditModeService } from '@services';
import { Dataset } from '@uncuyoapp/ngx-data-visualizer';

@Component({
    selector: 'app-visualization-config-step',
    standalone: true,
    imports: [VisualizationComponent],
    templateUrl: './step3-visualization-config.component.html',
    styleUrl: './step3-visualization-config.component.scss'
})
export class VisualizationConfigStepComponent {
    dataset = input.required<Dataset>();
    visualizationInput = input.required<Visualization>();
    visualizationComponent = viewChild(VisualizationComponent);

    save = output<boolean>();

    private editMode = inject(EditModeService);

    visualization = computed(() => this.visualizationInput());
    hasErrors = computed(() => this.visualizationComponent()?.editService.hasErrors() || false);

    getFinalVisualization(): Visualization | undefined {
        return this.visualizationComponent()?.editService.getUpdatedVisualization();
    }

    onCreate(published = true) {
        this.save.emit(published);
    }
}
