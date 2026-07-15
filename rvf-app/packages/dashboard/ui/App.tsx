import { useEffect, useRef, useState } from 'react';
import type { FleetResponse } from '../src/types.js';
import { FleetView } from './Fleet/FleetView.js';
import { LibrariesView } from './Fleet/LibrariesView.js';

type ActiveTab = 'libraries' | 'fleet';

const CODE_STYLE: React.CSSProperties = {
  background: '#212529',
  color: '#f8f9fa',
  padding: '12px 16px',
  borderRadius: '4px',
  fontSize: '12px',
  lineHeight: 1.6,
  overflowX: 'auto',
  margin: '0 0 12px',
};

function EmptyState() {
  return (
    <div
      style={{
        padding: '32px',
        background: '#fff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        maxWidth: '680px',
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600 }}>
        No workspaces registered yet
      </h2>
      <p style={{ color: '#6c757d', margin: '0 0 20px' }}>
        Register a workspace to start tracking library version drift. The dashboard updates live
        as each workspace registers — no restart needed.
      </p>

      <p style={{ fontWeight: 500, margin: '0 0 8px', fontSize: '13px' }}>
        Register one workspace:
      </p>
      <pre style={CODE_STYLE}>{`rv registry register \\
  --workspace /path/to/project/rippleview.workspace.yaml`}</pre>

      <p style={{ fontWeight: 500, margin: '0 0 8px', fontSize: '13px' }}>
        Or register independent frameworks one by one:
      </p>
      <pre style={CODE_STYLE}>{`# Angular ng-15 apps
rv registry register --workspace /path/to/ng15/rippleview.workspace.yaml

# Angular ng-17 apps
rv registry register --workspace /path/to/ng17/rippleview.workspace.yaml

# React 19 apps
rv registry register --workspace /path/to/react/rippleview.workspace.yaml`}</pre>

      <p style={{ color: '#6c757d', fontSize: '12px', margin: 0 }}>
        Each call scans the workspace and pushes its channel(s) to this dashboard.
        All channels appear in one Fleet view.
      </p>
    </div>
  );
}

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px',
  border: '1px solid #dee2e6',
  borderBottom: active ? '1px solid #fff' : '1px solid #dee2e6',
  borderRadius: '4px 4px 0 0',
  background: active ? '#fff' : '#f8f9fa',
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  fontSize: '14px',
  marginBottom: '-1px',
  position: 'relative',
});

export default function App() {
  const [fleet, setFleet] = useState<FleetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('libraries');
  const [channelFilter, setChannelFilter] = useState('');
  const esRef = useRef<EventSource | null>(null);

  const fetchFleet = () => {
    setError(null);
    fetch('/api/fleet')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${String(r.status)}`);
        return r.json() as Promise<FleetResponse>;
      })
      .then(setFleet)
      .catch((e: unknown) => setError(String(e)));
  };

  useEffect(() => {
    fetchFleet();

    const es = new EventSource('/api/events');
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { type: string };
        if (data.type === 'registry-updated') fetchFleet();
      } catch {
        // ignore malformed SSE frames
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>RippleView Dashboard</h1>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          Failed to load fleet data: {error}
        </div>
      )}

      {!fleet && !error && <p style={{ color: '#6c757d' }}>Loading…</p>}

      {fleet && fleet.channels.length === 0 && <EmptyState />}

      {fleet && fleet.channels.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label htmlFor="channel-filter" style={{ fontWeight: 500 }}>Channel:</label>
            <select
              id="channel-filter"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            >
              <option value="">All channels</option>
              {fleet.channels.map((c) => (
                <option key={`${c.framework}-${c.generation}`} value={`${c.framework}-${c.generation}`}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #dee2e6', marginBottom: '24px' }}>
            <button style={TAB_STYLE(activeTab === 'libraries')} onClick={() => setActiveTab('libraries')}>
              Libraries
            </button>
            <button style={TAB_STYLE(activeTab === 'fleet')} onClick={() => setActiveTab('fleet')}>
              Consumer Apps
            </button>
          </div>

          {activeTab === 'libraries' && <LibrariesView response={fleet} channelFilter={channelFilter} />}
          {activeTab === 'fleet' && <FleetView response={fleet} channelFilter={channelFilter} />}
        </div>
      )}
    </div>
  );
}
