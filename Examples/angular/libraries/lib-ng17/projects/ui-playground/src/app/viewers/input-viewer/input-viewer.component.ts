import { Component } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-input-viewer',
  templateUrl: './input-viewer.component.html',
  styleUrls: ['./input-viewer.component.scss'],
})
export class InputViewerComponent {
  control = new UntypedFormControl('');

  label = 'INPUT.LABEL';
  placeholder = 'INPUT.PLACEHOLDER';
  type = 'text';
  maxLength: number | null = 40;
  disabled = false;
  isMandatory = false;
  floating = false;
  readonly = false;

  get snippet(): string {
    return `<op-cc-input
  [control]="control"
  label="${this.label}"
  placeholder="${this.placeholder}"
  type="${this.type}"
  [maxLength]="${this.maxLength}"
  [readonly]="${this.readonly}"
  [disabled]="${this.disabled}"
  [isMandatory]="${this.isMandatory}"
  [floating]="${this.floating}"
></op-cc-input>`;
  }
}
