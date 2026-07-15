import { useState } from 'react';
import { RippleViewInput, RippleViewMultiSelect } from '@enterprise/react-core-controls';

const NOTIFICATION_OPTIONS = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Push', value: 'push' },
];

export function App() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Settings</h1>
      </header>

      <section className="app__field" aria-labelledby="workspace-heading">
        <h2 id="workspace-heading">Workspace</h2>
        <RippleViewInput label="Workspace name" placeholder="Acme Workspace" value={workspaceName} onChange={setWorkspaceName} />
        <p className="app__readout">
          Current name: <strong>{workspaceName || '(empty)'}</strong>
        </p>
      </section>

      <section className="app__field" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">Notifications</h2>
        <RippleViewMultiSelect label="Channels" options={NOTIFICATION_OPTIONS} value={notifications} onChange={setNotifications} />
        <p className="app__readout">
          Enabled: <strong>{notifications.length ? notifications.join(', ') : '(none)'}</strong>
        </p>
      </section>
    </main>
  );
}
