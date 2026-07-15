import { InjectionToken } from '@angular/core';

/**
 * Default container to which overlay/panel based controls attach their popups.
 * Controls read this token (falling back to 'body') so a host app can override
 * the global append target once.
 */
export const OP_APPEND_TO = new InjectionToken<string>('OP_APPEND_TO', {
  providedIn: 'root',
  factory: () => 'body',
});

/**
 * Global automation-id prefix. When set, controls prefix their generated
 * automation-id attribute with this value to keep ids unique across an app.
 */
export const OP_AUTOMATION_ID_PREFIX = new InjectionToken<string>('OP_AUTOMATION_ID_PREFIX', {
  providedIn: 'root',
  factory: () => '',
});

/**
 * NgRx feature key for the per-grid column-controls slice owned by `@op/aggrid`.
 * Lives in commonservices so feature modules and host apps reference one constant.
 */
export const AG_GRID_CONTROLS_KEY = 'opAgGridControls';

/**
 * NgRx feature key for the sidebar applied/saved filter slice owned by `@op/aggrid`.
 */
export const SIDEBAR_FILTER_KEY = 'opSidebarFilter';
