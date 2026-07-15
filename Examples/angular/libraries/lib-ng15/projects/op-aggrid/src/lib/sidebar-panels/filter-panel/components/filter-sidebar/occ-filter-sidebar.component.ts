import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IToolPanelAngularComp } from '@ag-grid-community/angular';
import { IToolPanelParams } from '@ag-grid-community/core';

import { KVPair } from '../../../../models/kv-pair.model';
import { SavedFilter } from '../../../../store/sidebar-filter';
import { SaveFilterPayload } from '../../models/save-filter.model';
import { SavedFilterService } from '../../services/saved-filter.service';
import { StickyFilterService } from '../../services/sticky-filter.service';
import { FILTER_PANEL_LABELS } from '../../constants/filter.constants';

/** Tool-panel params understood by the filter sidebar when hosted by AG Grid. */
export interface FilterSidebarToolPanelParams extends IToolPanelParams {
  filterMeta?: KVPair[];
  filterBarPanelId?: string;
  filterModuleName?: string;
  filterPanelName?: string;
  systemDefinedFilters?: SavedFilter[];
  enableStickyFilters?: boolean;
  applySelectedFilter?: Record<string, unknown>;
}

/**
 * `occ-filter-sidebar` — the main sidebar filter panel. Renders a dynamic form
 * (built from `filterMeta`) of `op-core-controls`, with Apply / Clear-All actions,
 * a saved-filters list and a save-configuration form. Works standalone (bind the
 * `@Input`s) or as an AG Grid tool panel (params supplied through `agInit`).
 */
@Component({
  selector: 'occ-filter-sidebar',
  templateUrl: './occ-filter-sidebar.component.html',
  styleUrls: ['./occ-filter-sidebar.component.scss'],
})
export class OccFilterSidebarComponent implements OnInit, IToolPanelAngularComp {
  /** Field metadata driving the filter form. */
  @Input() filterMeta: KVPair[] = [];
  /** Id of the owning filter bar panel (used for persistence/sticky/saved). */
  @Input() filterBarPanelId = '';
  /** Module name (passed to the saved-filter service / events). */
  @Input() filterModuleName = '';
  /** Display name of this filter panel. */
  @Input() filterPanelName = '';
  /** System-defined (read-only) filters seeded into the saved list. */
  @Input() systemDefinedFilters: SavedFilter[] = [];
  /** Enable persisting the last selection to localStorage. */
  @Input() enableStickyFilters = false;
  /** A saved filter's values to apply on open. */
  @Input() applySelectedFilter: Record<string, unknown> = {};

  /** Emits the live value map as fields change. */
  @Output() onSelectionChange = new EventEmitter<Record<string, unknown>>();
  /** Emits the applied value map when Apply is pressed. */
  @Output() onApplyFilter = new EventEmitter<Record<string, unknown>>();
  /** Emits when more data/options are needed for a field. */
  @Output() dataNeeded = new EventEmitter<KVPair>();
  /** Emits when Clear-All is pressed. */
  @Output() onClearAll = new EventEmitter<void>();
  /** Emits saved-filter changes (create/apply/delete). */
  @Output() savedFilterData = new EventEmitter<SavedFilter[]>();

  readonly labels = FILTER_PANEL_LABELS;

  /** Whether the save-configuration sub-form is showing. */
  showSaveForm = false;
  /** Current live values from the form. */
  currentValues: Record<string, unknown> = {};
  /** Initial values seeded into the form. */
  initialValues: Record<string, unknown> = {};
  /** Saved filters shown in the list. */
  savedFilters: SavedFilter[] = [];

  constructor(
    private readonly savedFilterService: SavedFilterService,
    private readonly stickyFilterService: StickyFilterService,
  ) {}

  ngOnInit(): void {
    this.initialValues = this.resolveInitialValues();
    this.currentValues = { ...this.initialValues };
    this.loadSavedFilters();
  }

  /** AG Grid tool-panel entry point. */
  agInit(params: FilterSidebarToolPanelParams): void {
    this.filterMeta = params.filterMeta ?? this.filterMeta;
    this.filterBarPanelId = params.filterBarPanelId ?? this.filterBarPanelId;
    this.filterModuleName = params.filterModuleName ?? this.filterModuleName;
    this.filterPanelName = params.filterPanelName ?? this.filterPanelName;
    this.systemDefinedFilters = params.systemDefinedFilters ?? this.systemDefinedFilters;
    this.enableStickyFilters = params.enableStickyFilters ?? this.enableStickyFilters;
    this.applySelectedFilter = params.applySelectedFilter ?? this.applySelectedFilter;
    this.ngOnInit();
  }

  /** Called by AG Grid when the panel is shown again; refresh the saved list. */
  refresh(): void {
    this.loadSavedFilters();
  }

  onFormValueChange(values: Record<string, unknown>): void {
    this.currentValues = values;
    this.onSelectionChange.emit(values);
  }

  applyFilter(): void {
    this.onApplyFilter.emit(this.currentValues);
    if (this.enableStickyFilters && this.filterBarPanelId) {
      this.stickyFilterService.set(this.filterBarPanelId, this.currentValues);
    }
  }

  clearAll(): void {
    this.currentValues = {};
    this.initialValues = {};
    if (this.enableStickyFilters && this.filterBarPanelId) {
      this.stickyFilterService.clear(this.filterBarPanelId);
    }
    this.onClearAll.emit();
  }

  openSaveForm(): void {
    this.showSaveForm = true;
  }

  cancelSave(): void {
    this.showSaveForm = false;
  }

  saveConfiguration(payload: SaveFilterPayload): void {
    this.savedFilterService.save(payload);
    this.showSaveForm = false;
    this.loadSavedFilters();
  }

  applySavedFilter(filter: SavedFilter): void {
    this.initialValues = { ...filter.values };
    this.currentValues = { ...filter.values };
    this.onApplyFilter.emit(this.currentValues);
  }

  deleteSavedFilter(filter: SavedFilter): void {
    this.savedFilterService.remove(filter.id);
    this.loadSavedFilters();
  }

  private resolveInitialValues(): Record<string, unknown> {
    if (this.applySelectedFilter && Object.keys(this.applySelectedFilter).length) {
      return { ...this.applySelectedFilter };
    }
    if (this.enableStickyFilters && this.filterBarPanelId) {
      const sticky = this.stickyFilterService.get(this.filterBarPanelId);
      if (sticky) {
        return sticky;
      }
    }
    return {};
  }

  private loadSavedFilters(): void {
    if (this.systemDefinedFilters?.length) {
      this.savedFilterService.load(this.systemDefinedFilters);
    }
    if (this.filterBarPanelId) {
      this.savedFilterService.getByPanel(this.filterBarPanelId).subscribe((list) => {
        this.savedFilters = list;
        this.savedFilterData.emit(list);
      });
    }
  }
}
