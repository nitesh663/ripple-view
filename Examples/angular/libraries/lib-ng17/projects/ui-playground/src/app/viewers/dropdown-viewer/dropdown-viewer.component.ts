import { Component } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-dropdown-viewer',
  templateUrl: './dropdown-viewer.component.html',
  styleUrls: ['./dropdown-viewer.component.scss'],
})
export class DropdownViewerComponent {
  control = new UntypedFormControl(null);

  // Live, editable inputs
  label = 'DROPDOWN.LABEL';
  placeholder = 'DROPDOWN.PLACEHOLDER';
  disabled = false;
  isMandatory = false;
  floating = false;
  showClear = false;
  isFilter = true;
  sortAlphabetically = false;

  options: SelectItem[] = [
    { label: 'India', value: 'in' },
    { label: 'United States', value: 'us' },
    { label: 'Germany', value: 'de' },
    { label: 'Brazil', value: 'br' },
  ];

  get snippet(): string {
    return `<op-cc-dropdown
  [control]="control"
  [options]="options"
  label="${this.label}"
  placeholder="${this.placeholder}"
  [isFilter]="${this.isFilter}"
  [showClear]="${this.showClear}"
  [sortAlphabetically]="${this.sortAlphabetically}"
  [disabled]="${this.disabled}"
  [isMandatory]="${this.isMandatory}"
  [floating]="${this.floating}"
></op-cc-dropdown>`;
  }
}
