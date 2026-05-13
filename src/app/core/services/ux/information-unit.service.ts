import { Injectable, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { InformationUnitSelectorComponent } from '@components/information-unit-selector/information-unit-selector.component';
import { MatDialog } from '@angular/material/dialog';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root',
})
/**
 * Servicio de dominio encargado de la lógica de selección de Unidades de Información (IU).
 * Proporciona una interfaz para abrir el selector de IU adaptándose al dispositivo (diálogo o bottom sheet).
 */
export class InformationUnitService {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly dialog = inject(MatDialog);
  private readonly deviceService = inject(DeviceDetectorService);

  /**
   * Abre el selector de Unidad de Información.
   * En dispositivos móviles utiliza una hoja de fondo (BottomSheet),
   * mientras que en escritorio utiliza un diálogo modal.
   */
  openInformationUnitSelector(): void {
    this.deviceService.isMobile()
      ? this.openIUSBottomSheet()
      : this.openIUSDialog();
  }

  private openIUSDialog(): void {
    const dialogRef = this.dialog.open(InformationUnitSelectorComponent, {
      width: '100%',
      maxWidth: '500px',
    });
    dialogRef.componentInstance?.informationUnitSelect.subscribe(() => {
      dialogRef.close();
    });
  }

  private openIUSBottomSheet(): void {
    const bottomSheetRef = this.bottomSheet.open(
      InformationUnitSelectorComponent,
      {
        // panelClass: 'full-screen-bottom-sheet',
      }
    );
    bottomSheetRef.instance?.informationUnitSelect.subscribe(() => {
      bottomSheetRef.dismiss();
    });
  }
}
