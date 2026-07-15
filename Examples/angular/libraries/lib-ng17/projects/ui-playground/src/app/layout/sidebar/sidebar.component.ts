import { Component } from '@angular/core';

interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
}

interface NavCategory {
  labelKey: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  readonly categories: NavCategory[] = [
    {
      labelKey: 'NAV.CORE_CONTROLS',
      items: [
        { labelKey: 'NAV.DROPDOWN', icon: 'pi pi-chevron-circle-down', route: '/cores/dropdown' },
        { labelKey: 'NAV.INPUT', icon: 'pi pi-pencil', route: '/cores/input' },
        { labelKey: 'NAV.DATEPICKER', icon: 'pi pi-calendar', route: '/cores/datepicker' },
        { labelKey: 'NAV.MULTISELECT', icon: 'pi pi-list', route: '/cores/multiselect' },
      ],
    },
    {
      labelKey: 'NAV.DATA_GRID',
      items: [
        { labelKey: 'NAV.GRID', icon: 'pi pi-table', route: '/grid' },
        { labelKey: 'NAV.DYNAMIC_GRID', icon: 'pi pi-cog', route: '/dynamic-grid' },
      ],
    },
  ];
}
