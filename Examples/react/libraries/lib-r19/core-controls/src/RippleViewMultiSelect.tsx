import { MultiSelect } from 'primereact/multiselect';

export interface RippleViewMultiSelectOption {
  label: string;
  value: string;
}

export interface RippleViewMultiSelectProps {
  label?: string;
  options: RippleViewMultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function RippleViewMultiSelect({ label, options, value, onChange }: RippleViewMultiSelectProps) {
  return (
    <div className="rv-field">
      {label ? <label>{label}</label> : null}
      {/* 19.2.0 REGRESSION (oracle: react-core-controls-multiselect-semantic-regression):
          optionValue switched from "value" to "label". The dropdown still shows
          the same options and still LOOKS correct - but the emitted value now
          carries the display label instead of the real value, a silent data
          bug, not a visual one. Same defect class as both Angular lines'
          regression. */}
      <MultiSelect
        options={options}
        optionLabel="label"
        optionValue="label"
        value={value}
        onChange={(event) => onChange(event.value)}
      />
    </div>
  );
}
