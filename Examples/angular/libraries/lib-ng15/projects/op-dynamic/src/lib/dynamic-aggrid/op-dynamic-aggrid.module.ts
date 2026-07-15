import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpAgGridModule } from '@op/aggrid';
import { OpCoreControlsModule } from '@op/core-controls';
import { OpI18nModule } from '@op/i18n';

import { DynamicAggridComponent } from './components/dynamic-aggrid/dynamic-aggrid.component';

/**
 * The only feature exposed by `@op/dynamic`: the metadata-driven `dynamic-aggrid`
 * component, which renders `@op/aggrid`'s `<occ-aggrid>` internally.
 *
 * Host apps must also provide the NgRx root store (`StoreModule.forRoot({})`)
 * since the underlying `OpAgGridModule` registers feature slices.
 */
@NgModule({
  declarations: [DynamicAggridComponent],
  imports: [CommonModule, OpAgGridModule, OpCoreControlsModule, OpI18nModule],
  exports: [DynamicAggridComponent],
})
export class OpDynamicAggridModule {}
