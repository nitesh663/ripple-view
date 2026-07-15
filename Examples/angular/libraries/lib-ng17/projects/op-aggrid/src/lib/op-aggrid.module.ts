import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { AG_GRID_CONTROLS_KEY, SIDEBAR_FILTER_KEY } from '@op/commonservices';
import { OpCoreControlsModule } from '@op/core-controls';
import { OpI18nModule } from '@op/i18n';

import { OccAggridModule } from './components/occ-aggrid/occ-aggrid.module';
import { OpSidebarPanelsModule } from './sidebar-panels/sidebar-panels.module';
import { gridControlsReducers } from './store/grid-controls/grid-controls.reducer';
import { sidebarFilterReducers } from './store/sidebar-filter/sidebar-filter.reducer';

/**
 * Root module for `@op/aggrid`. Registers the two NgRx feature slices
 * (grid-controls + sidebar-filter) and re-exports the grid component, renderers,
 * editors and the sidebar filter panel.
 *
 * Host apps must still provide the NgRx root store (`StoreModule.forRoot({})`).
 */
@NgModule({
  imports: [
    CommonModule,
    OpCoreControlsModule,
    OpI18nModule,
    OccAggridModule,
    OpSidebarPanelsModule,
    StoreModule.forFeature(AG_GRID_CONTROLS_KEY, gridControlsReducers),
    StoreModule.forFeature(SIDEBAR_FILTER_KEY, sidebarFilterReducers),
  ],
  exports: [OccAggridModule, OpSidebarPanelsModule],
})
export class OpAgGridModule {}
