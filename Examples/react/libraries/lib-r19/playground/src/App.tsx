import { useState } from 'react';
import { RippleViewButton, RippleViewForm, RippleViewInput, RippleViewMultiSelect } from '@enterprise/react-core-controls';

type NavKey = 'button' | 'input' | 'multi-select' | 'form';

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'button', label: 'Button' },
  { key: 'input', label: 'Input' },
  { key: 'multi-select', label: 'Multi Select' },
  { key: 'form', label: 'Form' },
];

const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function App() {
  const [selected, setSelected] = useState<NavKey>('button');
  const [buttonClickLog, setButtonClickLog] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);
  const [formName, setFormName] = useState('');

  return (
    <div>
      <header className="pg-header">
        <h1>RippleView React 19 Playground</h1>
      </header>

      <div className="pg-body">
        <nav className="pg-sidebar">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`pg-nav-item${selected === item.key ? ' pg-nav-item--active' : ''}`}
                  onClick={() => setSelected(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="pg-demo-area">
          {selected === 'button' && (
            <section>
              <h2>Button</h2>
              <p>&#64;enterprise/react-core-controls &mdash; PrimeReact-backed, default + disabled states.</p>
              <div className="pg-demo-row">
                <RippleViewButton
                  label="Save"
                  icon="pi pi-check"
                  onClick={() => setButtonClickLog((log) => [...log, `Clicked at ${new Date().toLocaleTimeString()}`])}
                />
                <RippleViewButton label="Disabled" disabled />
              </div>
              <ul className="pg-log">
                {buttonClickLog.map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ul>
            </section>
          )}

          {selected === 'input' && (
            <section>
              <h2>Input</h2>
              <p>&#64;enterprise/react-core-controls.</p>
              <RippleViewInput label="Your name" placeholder="Type here" value={inputValue} onChange={setInputValue} />
              <p className="pg-readout">
                Current value: <strong>{inputValue || '(empty)'}</strong>
              </p>
            </section>
          )}

          {selected === 'multi-select' && (
            <section>
              <h2>Multi Select</h2>
              <p>&#64;enterprise/react-core-controls.</p>
              <RippleViewMultiSelect label="Status" options={STATUS_OPTIONS} value={multiSelectValue} onChange={setMultiSelectValue} />
              <p className="pg-readout">
                Selected: <strong>{multiSelectValue.length ? multiSelectValue.join(', ') : '(none)'}</strong>
              </p>
            </section>
          )}

          {selected === 'form' && (
            <section>
              <h2>Form</h2>
              <p>&#64;enterprise/react-core-controls &mdash; composes other controls as children.</p>
              <RippleViewForm>
                <RippleViewInput label="Name" placeholder="Jane Doe" value={formName} onChange={setFormName} />
                <RippleViewButton label="Submit" disabled={!formName} />
              </RippleViewForm>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
