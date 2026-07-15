import { useState } from 'react';
import type { FleetResponse, FleetChannel } from '../../src/types.js';
import { DriftBadge } from './DriftBadge.js';

interface Props {
  response: FleetResponse;
  channelFilter: string;
}

const TH_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  background: '#f1f3f5',
  borderBottom: '2px solid #dee2e6',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const TD_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #e9ecef',
  verticalAlign: 'middle',
};

const CHILD_TD_STYLE: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid #f1f3f5',
  verticalAlign: 'middle',
  background: '#f8f9fa',
};

function LibraryChannelTable({ channel }: { channel: FleetChannel }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (lib: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(lib)) next.delete(lib);
      else next.add(lib);
      return next;
    });
  };

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{channel.label}</h2>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: '400px',
            background: '#fff',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, width: '32px' }} />
              <th style={TH_STYLE}>Library</th>
              <th style={TH_STYLE}>Latest Version</th>
              <th style={TH_STYLE}>Consumers</th>
            </tr>
          </thead>
          <tbody>
            {channel.libraries.map((lib) => {
              const version = channel.latestVersions[lib] ?? '—';
              const consumers = channel.apps
                .map((app) => {
                  const cell = app.cells.find((c) => c.library === lib);
                  return cell && cell.consumed !== null
                    ? { appName: app.appName, consumed: cell.consumed, drift: cell.drift }
                    : null;
                })
                .filter((x): x is NonNullable<typeof x> => x !== null);

              const isExpanded = expanded.has(lib);
              const hasConsumers = consumers.length > 0;

              return (
                <>
                  <tr key={lib}>
                    <td style={{ ...TD_STYLE, textAlign: 'center', width: '32px' }}>
                      {hasConsumers && (
                        <button
                          onClick={() => toggle(lib)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            color: '#868e96',
                            padding: '2px 4px',
                          }}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                    </td>
                    <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontWeight: 500 }}>{lib}</td>
                    <td style={TD_STYLE}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: version === '—' ? '#f1f3f5' : '#e7f5ff',
                          color: version === '—' ? '#6c757d' : '#1971c2',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {version}
                      </span>
                    </td>
                    <td style={{ ...TD_STYLE, color: '#495057' }}>
                      {hasConsumers ? (
                        <button
                          onClick={() => toggle(lib)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#1971c2',
                            padding: 0,
                            fontSize: '13px',
                            textDecoration: 'underline',
                          }}
                        >
                          {consumers.length} app{consumers.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span style={{ color: '#adb5bd' }}>No apps registered yet</span>
                      )}
                    </td>
                  </tr>

                  {isExpanded &&
                    consumers.map((c) => (
                      <tr key={`${lib}-${c.appName}`}>
                        <td style={CHILD_TD_STYLE} />
                        <td style={{ ...CHILD_TD_STYLE, paddingLeft: '28px', color: '#495057' }}>
                          {c.appName}
                        </td>
                        <td style={CHILD_TD_STYLE}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              color: '#495057',
                            }}
                          >
                            {c.consumed}
                          </span>
                        </td>
                        <td style={CHILD_TD_STYLE}>
                          <DriftBadge drift={c.drift} consumed={c.consumed} />
                        </td>
                      </tr>
                    ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LibrariesView({ response, channelFilter }: Props) {
  const visibleChannels = channelFilter
    ? response.channels.filter((c) => `${c.framework}-${c.generation}` === channelFilter)
    : response.channels;

  return (
    <div>
      {visibleChannels.map((channel) => (
        <LibraryChannelTable key={`${channel.framework}-${channel.generation}`} channel={channel} />
      ))}
    </div>
  );
}
