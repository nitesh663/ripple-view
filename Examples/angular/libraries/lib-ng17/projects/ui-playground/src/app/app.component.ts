import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = environment.appName;

  constructor(private readonly translate: TranslateService) {}

  ngOnInit(): void {
    this.translate.setDefaultLang(environment.defaultLang);
    this.translate.use(environment.defaultLang);
  }
}
