import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'product', pathMatch: 'full' },
  {
    path: 'product',
    loadChildren: () =>
      import('./features/product/product.module').then(m => m.ProductModule),
  },
  {
    path: 'target',
    loadChildren: () =>
      import('./features/target/target.module').then(m => m.TargetModule),
  },
  { path: '**', redirectTo: 'product' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
