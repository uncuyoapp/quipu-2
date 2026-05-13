import {
    Component,
    DestroyRef,
    ElementRef,
    OnDestroy,
    OnInit,
    effect,
    inject,
    signal,
    viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VisualizationGridEditService } from '@components/visualization-grid/visualization-grid-edit.service';
import { VisualizationGridComponent } from '@components/visualization-grid/visualization-grid.component';
import { AppEventType } from '@core/models/events/app-event.types';
import { Visualization } from '@models/domain/visualization.model';
import { AppEventBusService, EditModeService, VisualizationStateService } from '@services';

/**
 * @class VisualizationsListComponent
 * @description
 * Componente de página que muestra un listado infinito de todas las visualizaciones
 * disponibles. Gestiona la carga bajo demanda mediante IntersectionObserver y 
 * permite la interacción en modo edición para acciones por lote.
 */
@Component({
    selector: 'app-visualizations-list',
    standalone: true,
    imports: [
        VisualizationGridComponent
    ],
    providers: [VisualizationGridEditService],
    templateUrl: './visualizations-list.component.html',
    styleUrl: './visualizations-list.component.scss'
})
export class VisualizationsListComponent implements OnInit, OnDestroy {
    private readonly visualizationState = inject(VisualizationStateService);
    private readonly editModeService = inject(EditModeService);
    private readonly eventBus = inject(AppEventBusService);
    public readonly editService = inject(VisualizationGridEditService);

    /** Sentinel para el IntersectionObserver (scroll infinito) */
    sentinel = viewChild<ElementRef>('sentinel');

    private readonly destroyRef = inject(DestroyRef);

    visualizations = signal<Visualization[]>([]);
    isFetching = signal<boolean>(false);
    page = 1;
    pageSize = 24;
    hasMore = true;


    private observer?: IntersectionObserver;

    constructor() {
        // Sincronizar el estado de selección de la grilla con el modo edición global
        effect(() => {
            const isEditMode = this.editModeService.isEditModeEnabled();
            this.editService.initialize({
                isSelectable: isEditMode,
                visibleActions: ['create', 'publish', 'unpublish', 'delete']
            });
        }, { allowSignalWrites: true });
    }

    ngOnInit(): void {
        this.loadMore();
        this.eventBus.emit({ type: AppEventType.VISUALIZATIONS_LIST_VIEWED });

        // Recargar datos cuando una acción por lote tenga éxito
        this.editService.onActionSuccess
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.editModeService.isEditModeEnabled()) {
                    this.refresh();
                }
            });
    }

    /**
     * Reinicia el estado de la lista y vuelve a cargar los datos.
     */
    refresh(): void {
        this.page = 1;
        this.hasMore = true;
        this.visualizations.set([]);
        this.loadMore();
    }

    ngAfterViewInit(): void {
        this.setupIntersectionObserver();
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    private setupIntersectionObserver(): void {
        this.observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !this.isFetching() && this.hasMore) {
                this.loadMore();
            }
        }, {
            rootMargin: '200px',
        });

        if (this.sentinel()) {
            this.observer.observe(this.sentinel()!.nativeElement);
        }
    }

    loadMore(): void {
        if (this.isFetching() || !this.hasMore) return;

        this.isFetching.set(true);
        this.visualizationState.getVisualizationsPage(this.page, this.pageSize)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    const currentItems = this.visualizations();
                    this.visualizations.set([...currentItems, ...response.items]);
                    this.page++;
                    this.hasMore = currentItems.length + response.items.length < response.totalItems;
                    this.isFetching.set(false);
                },
                error: (error: unknown) => {
                    console.error('Error al cargar la página de visualizaciones:', error);
                    this.isFetching.set(false);
                }
            });
    }
}
