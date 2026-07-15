import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectItem } from 'primeng/api';

import { KVPair } from '../../../../models/kv-pair.model';

/**
 * The dynamic form body of the sidebar filter. Builds a `FormGroup` from the
 * supplied `filterMeta` and renders one `op-core-controls` control per field
 * (dropdown / multiselect / input / datepicker). Emits the live value map.
 */
@Component({
  selector: 'occ-filter-sidebar-form',
  templateUrl: './occ-filter-sidebar-form.component.html',
  styleUrls: ['./occ-filter-sidebar-form.component.scss'],
})
export class OccFilterSidebarFormComponent implements OnChanges {
  /** Field metadata driving the form. */
  @Input() filterMeta: KVPair[] = [];
  /** Initial values keyed by field. */
  @Input() initialValues: Record<string, unknown> = {};

  /** Emits the full value map whenever any field changes. */
  @Output() valueChange = new EventEmitter<Record<string, unknown>>();

  /** The reactive form backing the fields. */
  form = new FormGroup<Record<string, FormControl>>({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterMeta'] || changes['initialValues']) {
      this.buildForm();
    }
  }

  /** Options adapter for dropdown/multiselect controls. */
  optionsFor(field: KVPair): SelectItem[] {
    return (field.options ?? []).map((o) => ({ label: o.label, value: o.value }));
  }

  /** Get the control for a field key. */
  controlFor(key: string): FormControl {
    return this.form.get(key) as FormControl;
  }

  /** Notify listeners with the current value map. */
  emitValues(): void {
    this.valueChange.emit(this.form.getRawValue());
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};
    for (const field of this.filterMeta ?? []) {
      const initial = this.initialValues?.[field.key] ?? field.selected ?? null;
      const control = new FormControl(initial);
      if (field.disabled) {
        control.disable({ emitEvent: false });
      }
      group[field.key] = control;
    }
    this.form = new FormGroup<Record<string, FormControl>>(group);
  }
}
