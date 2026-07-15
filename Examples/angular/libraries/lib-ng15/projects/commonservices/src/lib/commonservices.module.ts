import { NgModule } from '@angular/core';

/**
 * Aggregator module for commonservices. The services here are tree-shakable
 * (`providedIn: 'root'`), so this module exists mainly to give host apps a
 * single, explicit import point and room to grow.
 */
@NgModule({
  declarations: [],
  imports: [],
  exports: [],
})
export class CommonServicesModule {}
