import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

/**
 * Thin wrapper over @ngx-translate's TranslateService that gives the @op
 * libraries a single, stable i18n surface. Host apps still configure the
 * loader/default language via `TranslateModule.forRoot(...)`; this service
 * just exposes the common operations the controls need.
 */
@Injectable({ providedIn: 'root' })
export class OPi18nTranslateService {
  constructor(private readonly translate: TranslateService) {}

  /** Register the available languages. */
  addLangs(langs: string[]): void {
    this.translate.addLangs(langs);
  }

  /** Set the fallback language used when a key is missing in the active one. */
  setDefaultLang(lang: string): void {
    this.translate.setDefaultLang(lang);
  }

  /** Switch the active language. */
  use(lang: string): Observable<unknown> {
    return this.translate.use(lang);
  }

  /** Currently active language. */
  get currentLang(): string {
    return this.translate.currentLang;
  }

  /** Asynchronously resolve a translation (supports interpolation params). */
  get(key: string | string[], params?: object): Observable<string | { [key: string]: string }> {
    return this.translate.get(key, params);
  }

  /** Synchronously resolve a translation (must already be loaded). */
  instant(key: string | string[], params?: object): string | { [key: string]: string } {
    return this.translate.instant(key, params);
  }

  /** Emits whenever the active language changes. */
  get onLangChange(): Observable<unknown> {
    return this.translate.onLangChange.asObservable();
  }
}
