import { Component } from '@angular/core';

type TabId = 'product' | 'package';

interface Tab {
  id: TabId;
  label: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  tabs: Tab[] = [
    { id: 'product', label: 'Product' },
    { id: 'package', label: 'Package' },
  ];

  activeTab: TabId = 'product';

  selectTab(id: TabId): void {
    this.activeTab = id;
  }
}
