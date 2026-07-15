import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridModule } from '@ag-grid-community/angular';
import { InputTextModule } from 'primeng/inputtext';
import { OpCoreControlsModule } from '@op/core-controls';
import { OpI18nModule } from '@op/i18n';

import { OccAggridComponent } from './occ-aggrid.component';
import { TextColorRendererComponent } from '../../renderers/text-color/text-color-renderer.component';
import { ActionRendererComponent } from '../../renderers/action/action-renderer.component';
import { CheckboxRendererComponent } from '../../renderers/checkbox/checkbox-renderer.component';
import { OccDropdownRendererComponent } from '../../renderers/occ-dropdown/occ-dropdown-renderer.component';
import { TextEditorComponent } from '../../cell-editors/text-editor/text-editor.component';
import { NumericEditorComponent } from '../../cell-editors/numeric-editor/numeric-editor.component';
import { OccDropdownEditorComponent } from '../../cell-editors/occ-dropdown-editor/occ-dropdown-editor.component';

const RENDERERS = [
  TextColorRendererComponent,
  ActionRendererComponent,
  CheckboxRendererComponent,
  OccDropdownRendererComponent,
];

const EDITORS = [TextEditorComponent, NumericEditorComponent, OccDropdownEditorComponent];

/**
 * Declares the `occ-aggrid` grid component plus all cell renderers and editors.
 * Imported by the root `OpAgGridModule` (which adds the NgRx feature stores and
 * the sidebar filter panel).
 */
@NgModule({
  declarations: [OccAggridComponent, ...RENDERERS, ...EDITORS],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AgGridModule,
    InputTextModule,
    OpCoreControlsModule,
    OpI18nModule,
  ],
  exports: [OccAggridComponent, ...RENDERERS, ...EDITORS],
})
export class OccAggridModule {}
