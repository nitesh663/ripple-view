import { Component } from '@angular/core';

type TabId = 'product' | 'package';

interface Tab {
  id: TabId;
  label: string;
}

@Component({
  selector: 'app-product-shell',
  templateUrl: './product-shell.component.html',
  styleUrls: ['./product-shell.component.scss'],
})
export class ProductShellComponent {
  tabs: Tab[] = [
    { id: 'product', label: 'Product' },
    { id: 'package', label: 'Package' },
  ];

  activeTab: TabId = 'product';

  selectTab(id: TabId): void {
    this.activeTab = id;
  }
}
