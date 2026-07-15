import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';

/**
 * Numeric cell editor. Constrains input to numbers and clamps to optional
 * min/max passed through `cellEditorParams`.
 */
@Component({
  selector: 'occ-numeric-editor',
  templateUrl: './numeric-editor.component.html',
  styleUrls: ['./numeric-editor.component.scss'],
})
export class NumericEditorComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  /** Bound numeric value while editing. */
  value: number | null = null;
  min?: number;
  max?: number;
  step = 1;

  agInit(params: ICellEditorParams & { min?: number; max?: number; step?: number }): void {
    this.value = params.value == null || params.value === '' ? null : Number(params.value);
    this.min = params.min;
    this.max = params.max;
    this.step = params.step ?? 1;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.input?.nativeElement.focus(), 0);
  }

  /** AG Grid reads the (clamped) number from here. */
  getValue(): number | null {
    if (this.value == null || isNaN(this.value)) {
      return null;
    }
    let v = this.value;
    if (this.min != null) {
      v = Math.max(this.min, v);
    }
    if (this.max != null) {
      v = Math.min(this.max, v);
    }
    return v;
  }
}
