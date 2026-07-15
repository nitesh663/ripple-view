import { InputText } from 'primereact/inputtext';

export interface RippleViewInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function RippleViewInput({ label, placeholder, value, onChange }: RippleViewInputProps) {
  return (
    <div className="rv-field">
      {label ? <label>{label}</label> : null}
      <InputText placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
