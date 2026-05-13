import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SECTION_GRAPHICS } from '@core/config/illustrations.config';
import { AppEventType } from '@core/models/events/app-event.types';
import { AppEventBusService } from '@services';

/**
 * Componente contenedor para la sección de información del usuario.
 * Proporciona el diseño base (ilustración + contenido dinámico) para
 * las vistas de perfil y edición.
 */
@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss'
})
export class UserInfoComponent implements OnInit {
  /** Configuración gráfica centralizada para User Info */
  public readonly graphics = SECTION_GRAPHICS.userInfo;

  private readonly eventBus = inject(AppEventBusService);

  ngOnInit(): void {
    this.eventBus.emit({ type: AppEventType.USER_PROFILE_VIEWED });
  }
}
