import { Pipe, PipeTransform } from '@angular/core';

import { FilterControlType, KVPair } from '../../../models/kv-pair.model';

/**
 * Resolves the effective control type for a filter field. Falls back to a sensible
 * default (`input`) when a `KVPair` does not declare one.
 */
@Pipe({ name: 'filterControlType' })
export class FilterControlTypePipe implements PipeTransform {
  transform(field: KVPair): FilterControlType {
    if (field?.type) {
      return field.type;
    }
    if (field?.options && field.options.length) {
      return 'dropdown';
    }
    return 'input';
  }
}
