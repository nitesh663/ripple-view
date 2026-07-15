import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DropdownViewerComponent } from './viewers/dropdown-viewer/dropdown-viewer.component';
import { InputViewerComponent } from './viewers/input-viewer/input-viewer.component';
import { DatepickerViewerComponent } from './viewers/datepicker-viewer/datepicker-viewer.component';
import { MultiselectViewerComponent } from './viewers/multiselect-viewer/multiselect-viewer.component';
import { GridViewerComponent } from './viewers/grid-viewer/grid-viewer.component';
import { DynamicGridViewerComponent } from './viewers/dynamic-grid-viewer/dynamic-grid-viewer.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cores/dropdown' },
  { path: 'cores/dropdown', component: DropdownViewerComponent },
  { path: 'cores/input', component: InputViewerComponent },
  { path: 'cores/datepicker', component: DatepickerViewerComponent },
  { path: 'cores/multiselect', component: MultiselectViewerComponent },
  { path: 'grid', component: GridViewerComponent },
  { path: 'dynamic-grid', component: DynamicGridViewerComponent },
  { path: '**', redirectTo: 'cores/dropdown' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
