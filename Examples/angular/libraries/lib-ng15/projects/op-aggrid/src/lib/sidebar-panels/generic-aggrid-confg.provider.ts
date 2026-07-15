import {
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Type,
  createComponent,
} from '@angular/core';

import { OpSideBarDef } from '../models/op-sidebar-def.model';
import { KVPair } from '../models/kv-pair.model';
import { SavedFilter } from '../store/sidebar-filter';
import { OccFilterSidebarComponent } from './filter-panel/components/filter-sidebar/occ-filter-sidebar.component';
import { OccColumnsPanelComponent } from './columns-panel/occ-columns-panel.component';
import { OccGroupbyPanelComponent } from './groupby-panel/occ-groupby-panel.component';
import { OP_PANEL_IDS } from './filter-panel/constants/filter.constants';

/** Configuration consumed by the provider to assemble the side bar. */
export interface GenericSidebarConfig {
  /** Field metadata threaded into the filter panel. */
  filterMeta: KVPair[];
  /** Id of the owning filter-bar panel. */
  filterBarPanelId?: string;
  /** Module name (passed to the filter panel). */
  filterModuleName?: string;
  /** Display name of the filter panel. */
  filterPanelName?: string;
  /** System-defined filters to seed. */
  systemDefinedFilters?: SavedFilter[];
  /** Enable sticky filters. */
  enableStickyFilters?: boolean;
  /** Values to apply on open. */
  applySelectedFilter?: Record<string, unknown>;
  /** Toggle which panels appear (all on by default). */
  showFilters?: boolean;
  showColumns?: boolean;
  showGroupBy?: boolean;
}

/**
 * Builds an AG Grid `SideBarDef` (`OpSideBarDef`) wiring three custom tool panels:
 * a **filter panel**, a **columns panel** and a **group-by panel**.
 *
 * The custom-component bootstrapping helper (`createPanelComponent`) shows how a
 * panel component can be created imperatively via `createComponent` +
 * `EnvironmentInjector` and seeded with tool-panel params — useful when a host
 * needs a panel instance outside AG Grid's own lifecycle.
 */
@Injectable({ providedIn: 'root' })
export class GenericAggridConfgProvider {
  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  /** Assemble the side-bar definition from a config object. */
  buildSideBar(config: GenericSidebarConfig): OpSideBarDef {
    const showFilters = config.showFilters ?? true;
    const showColumns = config.showColumns ?? true;
    const showGroupBy = config.showGroupBy ?? true;

    const toolPanels: OpSideBarDef['toolPanels'] = [];

    if (showFilters) {
      toolPanels.push({
        id: OP_PANEL_IDS.filters,
        labelDefault: config.filterPanelName || 'Filters',
        labelKey: OP_PANEL_IDS.filters,
        iconKey: 'filter',
        toolPanel: OccFilterSidebarComponent,
        toolPanelParams: {
          filterMeta: config.filterMeta,
          filterBarPanelId: config.filterBarPanelId,
          filterModuleName: config.filterModuleName,
          filterPanelName: config.filterPanelName,
          systemDefinedFilters: config.systemDefinedFilters,
          enableStickyFilters: config.enableStickyFilters,
          applySelectedFilter: config.applySelectedFilter,
        },
      });
    }

    if (showColumns) {
      toolPanels.push({
        id: OP_PANEL_IDS.columns,
        labelDefault: 'Columns',
        labelKey: OP_PANEL_IDS.columns,
        iconKey: 'columns',
        toolPanel: OccColumnsPanelComponent,
      });
    }

    if (showGroupBy) {
      toolPanels.push({
        id: OP_PANEL_IDS.groupBy,
        labelDefault: 'Group By',
        labelKey: OP_PANEL_IDS.groupBy,
        iconKey: 'menu',
        toolPanel: OccGroupbyPanelComponent,
      });
    }

    return {
      toolPanels,
      defaultToolPanel: showFilters ? OP_PANEL_IDS.filters : undefined,
      filterBarPanelId: config.filterBarPanelId,
      filterModuleName: config.filterModuleName,
    };
  }

  /**
   * Imperatively create a tool-panel component instance (e.g. to render a panel
   * outside the grid). Caller is responsible for attaching `hostView` to an
   * `ApplicationRef`/DOM and calling `destroy()` when done.
   */
  createPanelComponent<T>(component: Type<T>): ComponentRef<T> {
    return createComponent(component, { environmentInjector: this.environmentInjector });
  }
}
