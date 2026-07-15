import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';

/**
 * Inline text cell editor. Wraps a PrimeNG `pInputText` and reports its value
 * back to AG Grid via `getValue()`.
 */
@Component({
  selector: 'occ-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
})
export class TextEditorComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  /** Bound value while editing. */
  value = '';
  /** Optional max length passed via `cellEditorParams`. */
  maxLength?: number;

  agInit(params: ICellEditorParams & { maxLength?: number }): void {
    this.value = params.value == null ? '' : String(params.value);
    this.maxLength = params.maxLength;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.input?.nativeElement.focus(), 0);
  }

  /** AG Grid reads the edited value from here when editing stops. */
  getValue(): string {
    return this.value;
  }
}
