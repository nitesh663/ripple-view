// Finding — one regression finding within a run
export interface Finding {
  id: string;
  component: string;
  /** 0-1; G17: never rounded up to force a pass */
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
}

// RunResult — the canonical Mongo-shaped run document (G5)
// Field names are a contract — never rename to fit a store
export interface RunResult {
  /** unique run ID (UUID v4) */
  _id: string;
  /** workspace.name + ':' + appName */
  tenant: string;
  /** from app config; default 'default' */
  department: string;
  appName: string;
  verdict: 'pass' | 'fail';
  /** ISO 8601 */
  timestamp: string;
  durationMs: number;
  findings: Finding[];
}

// ResultStore SPI (exact signature from AI Context Pack)
export interface ResultStore {
  putRun(d: RunResult): Promise<void>;
  getRun(id: string): Promise<RunResult | undefined>;
}

// RedactFn — hook for PII redaction (design); placeholder until that story lands
export type RedactFn = (doc: RunResult) => RunResult;
