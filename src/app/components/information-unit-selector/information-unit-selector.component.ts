import { A11yModule } from "@angular/cdk/a11y";
import { CommonModule } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { InformationUnit } from '@models/domain/information-unit.model';
import { SessionPersistenceService, SessionStateService } from '@services';


@Component({
  selector: 'app-information-unit-selector',
  standalone: true,
  imports: [CommonModule, MatRadioModule, A11yModule],
  templateUrl: './information-unit-selector.component.html',
  styleUrl: './information-unit-selector.component.scss',
})
export class InformationUnitSelectorComponent {
  private readonly sessionState = inject(SessionStateService);
  private readonly sessionPersistence = inject(SessionPersistenceService);

  informationUnits = computed(
    () => this.sessionState.userInformationUnits()
  );

  selectedIU = computed(
    () => this.sessionState.user()?.selectedIU ?? null
  );
  informationUnitSelect = output<InformationUnit>();

  onChange(informationUnit: InformationUnit): void {
    this.sessionPersistence.selectInformationUnit(informationUnit.id).subscribe();
    this.informationUnitSelect.emit(informationUnit);
  }
}
