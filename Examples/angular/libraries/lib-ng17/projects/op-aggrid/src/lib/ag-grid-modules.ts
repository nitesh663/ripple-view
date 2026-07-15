import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { SideBarModule } from '@ag-grid-enterprise/side-bar';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';

let registered = false;

/**
 * Registers the modular AG Grid 30 feature modules exactly once. We use the
 * modular packages (community + enterprise) and never the all-in-one bundle.
 */
export function registerOpAgGridModules(): void {
  if (registered) {
    return;
  }
  ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    InfiniteRowModelModule,
    CsvExportModule,
    MenuModule,
    RowGroupingModule,
    SetFilterModule,
    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
    RangeSelectionModule,
    ServerSideRowModelModule,
  ]);
  registered = true;
}
