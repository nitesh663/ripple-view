import { Component } from '@angular/core';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  readonly navItems: NavItem[] = [
    { label: 'Product', icon: 'pi pi-box', route: '/product' },
    { label: 'Target', icon: 'pi pi-bullseye', route: '/target' },
  ];
}
