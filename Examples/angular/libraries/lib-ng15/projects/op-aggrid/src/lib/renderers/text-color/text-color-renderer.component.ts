import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

import { TextColorRendererParams } from '../../models/grid-action.model';

/**
 * Renders a cell's text in a colour derived from its value, via either a static
 * `colorMap` or a `colorResolver` function passed through `cellRendererParams`.
 */
@Component({
  selector: 'occ-text-color-renderer',
  templateUrl: './text-color-renderer.component.html',
  styleUrls: ['./text-color-renderer.component.scss'],
})
export class TextColorRendererComponent implements ICellRendererAngularComp {
  /** Display text. */
  displayValue = '';
  /** Resolved CSS colour (empty = inherit). */
  color = '';

  agInit(params: ICellRendererParams & TextColorRendererParams): void {
    this.refresh(params);
  }

  refresh(params: ICellRendererParams & TextColorRendererParams): boolean {
    const value = params.valueFormatted ?? params.value;
    this.displayValue = value == null ? '' : String(value);
    this.color = this.resolveColor(params);
    return true;
  }

  private resolveColor(params: ICellRendererParams & TextColorRendererParams): string {
    if (params.colorResolver) {
      return params.colorResolver(params.value) ?? '';
    }
    if (params.colorMap && params.value != null) {
      return params.colorMap[String(params.value)] ?? '';
    }
    return '';
  }
}
