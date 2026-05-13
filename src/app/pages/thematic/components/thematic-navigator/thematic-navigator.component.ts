import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Thematic } from '@models/domain/thematic.model';
import { ThematicCardComponent } from '@components/thematic-card/thematic-card.component';
import { ThematicChildSelectorComponent } from '../thematic-child-selector/thematic-child-selector.component';

@Component({
  selector: 'app-thematic-navigator',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ThematicCardComponent,
    ThematicChildSelectorComponent,
  ],
  templateUrl: './thematic-navigator.component.html',
  styleUrl: './thematic-navigator.component.scss',
})
export class ThematicNavigatorComponent {
  thematic = input.required<Thematic>();
  thematicSelected = output<Thematic | undefined>();

  selectThematic(thematic: Thematic | undefined) {
    this.thematicSelected.emit(thematic);
  }
}
