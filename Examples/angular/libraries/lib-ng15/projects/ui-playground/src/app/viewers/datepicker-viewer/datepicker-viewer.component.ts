import { Component } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-datepicker-viewer',
  templateUrl: './datepicker-viewer.component.html',
  styleUrls: ['./datepicker-viewer.component.scss'],
})
export class DatepickerViewerComponent {
  control = new UntypedFormControl(null);

  label = 'DATEPICKER.LABEL';
  placeholder = 'DATEPICKER.PLACEHOLDER';
  dateFormat = 'mm/dd/yy';
  selectionMode: 'single' | 'range' | 'multiple' = 'single';
  showTime = false;
  showIcon = true;
  disabled = false;
  isMandatory = false;
  floating = false;

  get snippet(): string {
    return `<op-cc-datepicker
  [control]="control"
  label="${this.label}"
  placeholder="${this.placeholder}"
  dateFormat="${this.dateFormat}"
  selectionMode="${this.selectionMode}"
  [showTime]="${this.showTime}"
  [showIcon]="${this.showIcon}"
  [disabled]="${this.disabled}"
  [isMandatory]="${this.isMandatory}"
  [floating]="${this.floating}"
></op-cc-datepicker>`;
  }
}
