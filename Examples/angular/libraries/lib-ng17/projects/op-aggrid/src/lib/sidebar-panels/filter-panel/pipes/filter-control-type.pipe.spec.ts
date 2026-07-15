import { FilterControlTypePipe } from './filter-control-type.pipe';

describe('FilterControlTypePipe', () => {
  const pipe = new FilterControlTypePipe();

  it('returns the explicit type when set', () => {
    expect(pipe.transform({ key: 'a', value: 'A', type: 'datepicker' })).toBe('datepicker');
  });

  it('infers dropdown when options are present', () => {
    expect(pipe.transform({ key: 'a', value: 'A', options: [{ label: 'x', value: 1 }] })).toBe(
      'dropdown',
    );
  });

  it('falls back to input', () => {
    expect(pipe.transform({ key: 'a', value: 'A' })).toBe('input');
  });
});
