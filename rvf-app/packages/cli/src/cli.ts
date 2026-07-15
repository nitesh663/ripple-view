import { run } from './index.js';

run(process.argv).catch((err: unknown) => {
  process.stderr.write(String(err instanceof Error ? err.message : err) + '\n');
  process.exit(1);
});
