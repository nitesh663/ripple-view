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

function ChannelTable({ channel }: { channel: FleetChannel }) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{channel.label}</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px', background: '#fff', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>App</th>
              {channel.libraries.map((lib) => (
                <th key={lib} style={TH_STYLE}>{lib}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channel.apps.map((app) => (
              <tr key={app.appName}>
                <td style={{ ...TD_STYLE, fontWeight: 500 }}>{app.appName}</td>
                {app.cells.map((cell) => (
                  <td key={cell.library} style={TD_STYLE}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <DriftBadge drift={cell.drift} consumed={cell.consumed} />
                      {cell.consumed && (
                        <span style={{ fontSize: '11px', color: '#6c757d' }}>
                          {cell.consumed} → {cell.latest}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {channel.apps.length === 0 && (
              <tr>
                <td colSpan={channel.libraries.length + 1} style={{ ...TD_STYLE, color: '#6c757d', textAlign: 'center' }}>
                  No consumer apps found in this channel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FleetView({ response, channelFilter }: Props) {
  const visibleChannels = channelFilter
    ? response.channels.filter((c) => `${c.framework}-${c.generation}` === channelFilter)
    : response.channels;

  return (
    <div>
      {visibleChannels.map((channel) => (
        <ChannelTable key={`${channel.framework}-${channel.generation}`} channel={channel} />
      ))}
    </div>
  );
}
