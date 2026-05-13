import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { APP_ICONS } from '@core/config/icons.config';
import { ButtonComponent } from '@shared/components/button/button.component';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Representa un elemento individual en la ruta de navegación (breadcrumb).
 */
interface BreadcrumbItem {
  /** Etiqueta descriptiva que se muestra al usuario */
  label: string;
  /** URL de destino para la navegación */
  url: string;
}

/**
 * Componente Breadcrumb que muestra la jerarquía de navegación actual.
 * Se basa en la configuración de datos de las rutas de Angular (`data.breadcrumb`).
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent implements OnInit {
  // ============================================
  // Dependencias (inject)
  // ============================================

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly icons = APP_ICONS;

  // ============================================
  // Estado Reactivo (Signals)
  // ============================================

  /** Lista reactiva de elementos que conforman el breadcrumb actual */
  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  // ============================================
  // Propiedades Internas
  // ============================================

  /** Subject para gestionar la desuscripción automática */
  private readonly destroy$ = new Subject<void>();

  /**
   * Inicializa la escucha de eventos de navegación para reconstruir los breadcrumbs.
   */
  ngOnInit(): void {
    // Construcción inicial
    this.breadcrumbs.set(this.buildBreadcrumbs(this.route.root));

    // Reconstrucción ante cambios de navegación
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.breadcrumbs.set(this.buildBreadcrumbs(this.route.root));
      });
  }

  /**
   * Limpia las suscripciones al destruir el componente.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Construye recursivamente la jerarquía de breadcrumbs basándose en la configuración de rutas.
   * 
   * @param route La ruta activada actual desde el nodo raíz.
   * @param url La URL acumulada hasta el momento.
   * @param breadcrumbs El acumulador de elementos de navegación.
   * @returns Una lista refinada de BreadcrumbItem.
   */
  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: BreadcrumbItem[] = []
  ): BreadcrumbItem[] {
    const routeConfig = route.routeConfig;

    if (routeConfig?.data?.['breadcrumb']) {
      const routeUrl = routeConfig.path ?? '';
      const nextUrl = `${url}/${routeUrl}`;

      const breadcrumb: BreadcrumbItem = {
        label: routeConfig.data['breadcrumb'],
        url: nextUrl,
      };

      breadcrumbs.push(breadcrumb);
    }

    if (route.firstChild) {
      return this.buildBreadcrumbs(
        route.firstChild,
        breadcrumbs.at(-1)?.url ?? '',
        breadcrumbs
      );
    }

    return breadcrumbs;
  }

  /**
   * Navega a la ruta anterior en la jerarquía de breadcrumbs.
   * Si no hay niveles previos, vuelve al inicio.
   */
  public goBack(): void {
    const list = this.breadcrumbs();
    if (list.length > 1) {
      this.navigate(list[list.length - 2].url);
    } else {
      this.navigate('/');
    }
  }

  /**
   * Navega a una ruta específica del sistema.
   * @param route Ruta de destino.
   */
  public navigate(route: string): void {
    this.router.navigate([route]);
  }
}
