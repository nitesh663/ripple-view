// Cookie and Origin shapes are Playwright storageState-compatible so a plugin
// can pass them through directly without transformation.

export interface AuthCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number; // Unix timestamp; -1 = session cookie
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

export interface AuthOrigin {
  origin: string;
  localStorage: { name: string; value: string }[];
}

/** Captured session state — Playwright storageState-compatible shape. */
export interface AuthState {
  cookies?: AuthCookie[];
  origins?: AuthOrigin[];
  /** Date.now() at the moment of capture. Always set by StorageStateAuthProvider. */
  capturedAt: number;
  /** Optional expiry (Date.now() value). Absent = never expires. */
  expiresAt?: number;
}

/**
 * App-provided hook that performs the actual login and returns the captured state.
 * `ctx` is typed `unknown` so core stays UI-agnostic (G1).
 * A Playwright implementation would cast ctx to BrowserContext and call page.goto / fill / click.
 */
export type AuthHookFn = (ctx: unknown) => Promise<AuthState>;

/**
 * AuthProvider SPI — the extension point for session hydration.
 *
 * G11: implement this interface in a plugin (@rippleview/plugin-playwright etc.);
 * never fork core.
 * G1:  ctx is unknown — core never imports Playwright or any framework type.
 * G18: implementations must never log the contents of AuthState.
 */
export interface AuthProvider {
  readonly name: string;
  /** Perform login and return the captured session state. */
  authenticate(ctx: unknown): Promise<AuthState>;
  /**
   * Inject a previously captured state into a new browser context.
   * The default StorageStateAuthProvider leaves this as a no-op;
   * real injection (addCookies / addInitScript) lives in the framework plugin.
   */
  restore(state: AuthState, ctx: unknown): Promise<void>;
  /** Return true if the cached state is still valid (not expired). */
  isValid(state: AuthState): boolean;
}
