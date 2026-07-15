import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from '@ag-grid-community/angular';
import { InputTextModule } from 'primeng/inputtext';
import { OpCoreControlsModule } from '@op/core-controls';
import { OpI18nModule } from '@op/i18n';

import { OccFilterSidebarComponent } from './filter-panel/components/filter-sidebar/occ-filter-sidebar.component';
import { OccFilterSidebarFormComponent } from './filter-panel/components/occ-filter-sidebar-form/occ-filter-sidebar-form.component';
import { SavedFiltersSidebarComponent } from './filter-panel/components/saved-filters-sidebar/saved-filters-sidebar.component';
import { SaveConfigurationSidebarComponent } from './filter-panel/components/save-configuration-sidebar/save-configuration-sidebar.component';
import { TitlebarComponent } from './filter-panel/components/titlebar/titlebar.component';
import { RequireInfoComponent } from './filter-panel/components/require-info/require-info.component';
import { FilterControlTypePipe } from './filter-panel/pipes/filter-control-type.pipe';
import { OccColumnsPanelComponent } from './columns-panel/occ-columns-panel.component';
import { OccGroupbyPanelComponent } from './groupby-panel/occ-groupby-panel.component';

const COMPONENTS = [
  OccFilterSidebarComponent,
  OccFilterSidebarFormComponent,
  SavedFiltersSidebarComponent,
  SaveConfigurationSidebarComponent,
  TitlebarComponent,
  RequireInfoComponent,
  OccColumnsPanelComponent,
  OccGroupbyPanelComponent,
];

/**
 * Declares the sidebar filter panel (and the lighter columns/group-by panels).
 * Imported by the root `OpAgGridModule`.
 */
@NgModule({
  declarations: [...COMPONENTS, FilterControlTypePipe],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AgGridModule,
    InputTextModule,
    OpCoreControlsModule,
    OpI18nModule,
  ],
  exports: [...COMPONENTS, FilterControlTypePipe],
})
export class OpSidebarPanelsModule {}
