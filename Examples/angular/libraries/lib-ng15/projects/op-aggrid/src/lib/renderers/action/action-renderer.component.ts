import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

import { ActionRendererParams, GridAction, GridActionEvent } from '../../models/grid-action.model';

/**
 * Renders one or more row-action buttons. Clicks are emitted back to the host
 * through the `onAction` callback supplied via `cellRendererParams`.
 */
@Component({
  selector: 'occ-action-renderer',
  templateUrl: './action-renderer.component.html',
  styleUrls: ['./action-renderer.component.scss'],
})
export class ActionRendererComponent implements ICellRendererAngularComp {
  /** Actions visible for the current row. */
  actions: GridAction[] = [];

  private params!: ICellRendererParams & ActionRendererParams & { onAction?: (e: GridActionEvent) => void };

  agInit(
    params: ICellRendererParams & ActionRendererParams & { onAction?: (e: GridActionEvent) => void },
  ): void {
    this.params = params;
    this.actions = (params.actions ?? []).filter((a) => (a.visible ? a.visible(params) : true));
  }

  refresh(
    params: ICellRendererParams & ActionRendererParams & { onAction?: (e: GridActionEvent) => void },
  ): boolean {
    this.agInit(params);
    return true;
  }

  onActionClick(action: GridAction, event: MouseEvent): void {
    event.stopPropagation();
    this.params.onAction?.({ action, data: this.params.data, params: this.params });
  }

  trackByActionId(_index: number, action: GridAction): string {
    return action.id;
  }
}
