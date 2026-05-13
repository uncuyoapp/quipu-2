import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { InformationUnitSelectorComponent } from '@components/information-unit-selector/information-unit-selector.component';
import { MenuComponent } from '@components/menu/menu.component';
import { APP_ICONS } from '@core/config/icons.config';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { SessionStateService } from '@services';
import { ButtonComponent } from '@shared/components/button/button.component';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Componente de barra de navegación principal.
 * Maneja la navegación, el selector de unidad de información y el menú lateral/inferior.
 * Implementa comportamiento reactivo para cambios de ruta, scroll y tamaño de pantalla (mobile/desktop).
 */
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    ButtonComponent,
    RouterModule,
    MatDialogModule,
    MatBottomSheetModule,
    LayoutModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent implements OnInit, OnDestroy {
  // ============================================
  // Estado Reactivo (Signals)
  // ============================================

  /** Indica si la vista actual es de un dispositivo móvil */
  readonly isMobile = signal<boolean>(false);

  /** Indica si el usuario se encuentra en la página de inicio (Home) */
  readonly isHome = signal<boolean>(false);

  /** Indica si el selector de unidad de información está abierto */
  readonly isOpenInformationUnitSelector = signal<boolean>(false);

  /** Indica si la barra de navegación debe estar fija en la parte superior */
  readonly isFixed = signal<boolean>(false);

  /** Indica si la barra de navegación es visible (se oculta al hacer scroll hacia abajo) */
  readonly isVisible = signal<boolean>(true);

  /** Nombre de la unidad de información seleccionada actualmente */
  readonly selectedUnitName = computed(
    () => this.sessionState.currentInformationUnit()?.name ?? ''
  );

  // ============================================
  // Propiedades Internas
  // ============================================

  /** Configuración gráfica centralizada para el NavBar */
  protected readonly graphics = SECTION_GRAPHICS.navBar;

  /** Configuración de iconos centralizada */
  protected readonly icons = APP_ICONS;

  /** Última posición de scroll registrada para determinar la dirección del scroll */
  private lastScrollTop = 0;

  /** Referencia al botón de menú para posicionamiento del diálogo en desktop */
  readonly menuButton = viewChild<ButtonComponent>('menuButton');

  // ============================================
  // Dependencias (inject)
  // ============================================

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly sessionState = inject(SessionStateService);

  /** Subject para gestionar la desuscripción automática de observables */
  private readonly destroy$ = new Subject<void>();

  /**
   * Inicializa el componente configurando los escuchadores de ruta y pantalla.
   */
  ngOnInit(): void {
    this.setupIsHome();
    this.setupRouterEvents();
    this.setupBreakpointObserver();
  }

  /**
   * Limpia las suscripciones al destruir el componente.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verifica si una URL corresponde a la página de inicio.
   * @param url URL a verificar.
   * @returns Verdadero si es el inicio.
   */
  private checkUrlIsHome(url: string): boolean {
    return url === '' || url === '/' || url === '/home';
  }

  /**
   * Configura el estado inicial de `isHome` basado en la URL actual.
   */
  private setupIsHome(): void {
    this.isHome.set(this.checkUrlIsHome(this.router.url));
  }

  /**
   * Escucha los eventos de navegación para actualizar el estado `isHome` y la visibilidad.
   */
  private setupRouterEvents(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isHome.set(this.checkUrlIsHome(event.url));
          this.updateNavbarVisibility();
        }
      });
  }

  /**
   * Configura el observador de breakpoints para detectar dispositivos móviles.
   */
  private setupBreakpointObserver(): void {
    this.breakpointObserver
      .observe('(max-width: 767px)')
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        this.updateNavbarVisibility();
      });
  }

  /**
   * Actualiza la visibilidad de la barra de navegación basada en el dispositivo y la página actual.
   */
  private updateNavbarVisibility(): void {
    if (this.isMobile() && !this.isHome()) {
      this.isVisible.set(false);
    } else {
      this.isVisible.set(true);
    }
  }

  /**
   * Escucha el evento de scroll de la ventana para ocultar/mostrar la barra de navegación de forma animada.
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingDown = currentScroll > this.lastScrollTop;
    const navbarHeight = 70;

    // Lógica para ocultar al bajar y mostrar al subir
    if (isScrollingDown && currentScroll > navbarHeight) {
      this.isVisible.set(false);
    }

    if (!isScrollingDown && currentScroll > navbarHeight) {
      this.isFixed.set(true);
      this.isVisible.set(true);
    }

    if (currentScroll === 0) {
      this.isFixed.set(false);
    }

    this.lastScrollTop = currentScroll;
  }

  /**
   * Abre el selector de unidad de información en un diálogo (desktop) o bottom sheet (mobile).
   */
  openInformationUnitSelector(): void {
    this.isOpenInformationUnitSelector.set(true);
    this.isMobile() ? this.openIUSBottomSheet() : this.openIUSDialog();
  }

  /**
   * Abre el selector de unidad de información en un diálogo para desktop.
   */
  private openIUSDialog(): void {
    const dialogRef = this.dialog.open(InformationUnitSelectorComponent, {
      width: '100%',
      maxWidth: '500px',
    });

    dialogRef.componentInstance?.informationUnitSelect.subscribe(() => {
      dialogRef.close();
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isOpenInformationUnitSelector.set(false);
    });
  }

  /**
   * Abre el selector de unidad de información en un bottom sheet para mobile.
   */
  private openIUSBottomSheet(): void {
    const bottomSheetRef = this.bottomSheet.open(
      InformationUnitSelectorComponent,
      {
        panelClass: 'full-screen-bottom-sheet',
      }
    );

    bottomSheetRef.instance?.informationUnitSelect.subscribe(() => {
      bottomSheetRef.dismiss();
    });

    bottomSheetRef.afterDismissed().subscribe(() => {
      this.isOpenInformationUnitSelector.set(false);
    });
  }

  /**
   * Abre el menú principal de la aplicación.
   * En mobile se muestra como bottom sheet, en desktop como diálogo posicionado.
   */
  openMenu(): void {
    if (this.isMobile()) {
      const menu = this.bottomSheet.open(MenuComponent, {
        panelClass: 'full-screen-bottom-sheet',
      });
      menu.componentRef?.instance.closeMenu.subscribe(() => {
        menu.dismiss();
      });
    } else {
      const menuButton = this.menuButton();
      if (!menuButton) return;

      const rect = menuButton.elementRef.nativeElement.getBoundingClientRect();
      const menu = this.dialog.open(MenuComponent, {
        width: '400px',
        panelClass: 'menu-dialog-panel',
        position: {
          top: `${rect.bottom}px`,
          right: `${window.innerWidth - rect.right}px`,
        },
      });
      menu.componentRef?.instance.closeMenu.subscribe(() => {
        menu.close();
      });
    }
  }
}
