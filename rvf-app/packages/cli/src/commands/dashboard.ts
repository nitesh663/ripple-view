import { startServer } from '@rippleview/dashboard';

export interface DashboardOptions {
  input?: string;
  port: string;
  /**
   * Resolves when the server should stop. Defaults to waiting for SIGINT or SIGTERM.
   * Inject a pre-resolved promise in tests so the command returns immediately.
   */
  stopSignal?: Promise<void>;
}

export async function dashboardCommand(opts: DashboardOptions): Promise<{ exitCode: number }> {
  const port = parseInt(opts.port, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    process.stderr.write(`Invalid --port "${opts.port}" — must be a number between 1 and 65535\n`);
    return { exitCode: 1 };
  }

  await startServer({ registryPath: opts.input, port });

  const stop =
    opts.stopSignal ??
    new Promise<void>((resolve) => {
      process.once('SIGINT', resolve);
      process.once('SIGTERM', resolve);
    });

  await stop;
  return { exitCode: 0 };
}
