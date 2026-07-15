import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { OPi18nTranslateService } from './services/opi18n-translate.service';

/**
 * Wraps @ngx-translate for the @op libraries. Importing `OpI18nModule` makes
 * the `| translate` pipe available in a consumer's templates (it re-exports
 * `TranslateModule`) and provides `OPi18nTranslateService`.
 *
 * The host application is still responsible for the root configuration
 * (loader + default language) via `TranslateModule.forRoot(...)`.
 */
@NgModule({
  imports: [CommonModule, TranslateModule],
  exports: [TranslateModule],
})
export class OpI18nModule {
  static forRoot(): ModuleWithProviders<OpI18nModule> {
    return {
      ngModule: OpI18nModule,
      providers: [OPi18nTranslateService],
    };
  }
}
