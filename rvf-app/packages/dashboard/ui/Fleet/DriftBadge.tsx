import type { DriftInfo } from '../../src/types.js';

interface Props {
  drift: DriftInfo;
  consumed: string | null;
}

const STYLES: Record<string, { background: string; color: string; label: string }> = {
  current: { background: '#d1e7dd', color: '#0a3622', label: '🟢 current' },
  minor:   { background: '#fff3cd', color: '#664d03', label: '🟡 minor'   },
  major:   { background: '#f8d7da', color: '#58151c', label: '🔴 major'   },
  none:    { background: 'transparent', color: '#6c757d', label: '—'      },
};

export function DriftBadge({ drift, consumed }: Props) {
  const style = STYLES[drift.badge] ?? STYLES['none']!;

  if (drift.badge === 'none' || consumed === null) {
    return <span style={{ color: '#6c757d' }}>—</span>;
  }

  const behindParts: string[] = [];
  if (drift.majorsBehind > 0) behindParts.push(`${String(drift.majorsBehind)} major`);
  if (drift.minorsBehind > 0) behindParts.push(`${String(drift.minorsBehind)} minor`);
  if (drift.patchesBehind > 0) behindParts.push(`${String(drift.patchesBehind)} patch`);

  const title =
    drift.badge === 'current'
      ? `Up to date (${consumed})`
      : `${consumed} → ${behindParts.join(', ')} behind`;

  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        background: style.background,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}
