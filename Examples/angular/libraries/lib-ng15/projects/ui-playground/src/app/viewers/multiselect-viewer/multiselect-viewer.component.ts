import { Component } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-multiselect-viewer',
  templateUrl: './multiselect-viewer.component.html',
  styleUrls: ['./multiselect-viewer.component.scss'],
})
export class MultiselectViewerComponent {
  control = new UntypedFormControl([]);

  label = 'MULTISELECT.LABEL';
  placeholder = 'MULTISELECT.PLACEHOLDER';
  display: 'comma' | 'chip' = 'comma';
  filter = true;
  showToggleAll = true;
  showHeader = true;
  disabled = false;
  isMandatory = false;
  floating = false;

  options: SelectItem[] = [
    { label: 'Angular', value: 'ng' },
    { label: 'TypeScript', value: 'ts' },
    { label: 'RxJS', value: 'rxjs' },
    { label: 'SCSS', value: 'scss' },
    { label: 'PrimeNG', value: 'pn' },
  ];

  get snippet(): string {
    return `<op-cc-multiselect-dropdown
  [control]="control"
  [options]="options"
  label="${this.label}"
  placeholder="${this.placeholder}"
  display="${this.display}"
  [filter]="${this.filter}"
  [showToggleAll]="${this.showToggleAll}"
  [showHeader]="${this.showHeader}"
  [disabled]="${this.disabled}"
  [isMandatory]="${this.isMandatory}"
  [floating]="${this.floating}"
></op-cc-multiselect-dropdown>`;
  }
}
