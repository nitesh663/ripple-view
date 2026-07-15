/**
 * build-app-runtime-args.mjs — pure `docker build` argument construction for
 * the app-runtime image (T-5.2.3; split out of build-app-runtime.mjs
 * to respect the 200-line/file limit and keep a single responsibility: this
 * file only knows how to shape the docker CLI arguments from a contract).
 */

/**
 * @typedef {import('./resolve-build-contract.mjs').BuildContract} BuildContract
 */

/**
 * Builds the `docker build` argument array from a resolved contract. Always
 * includes --target <serveMode>, the tag, the -f dockerfile, and the contract
 * build-args. The node serve mode additionally passes START_CMD + PORT.
 *
 * `frameworkRoot`, when given, adds a secondary build context named
 * `rv-framework` (Buildx "additional build contexts") pointed at the rv
 * repo itself. The build context (`appDir`) is a throwaway copy of the
 * CONSUMER's app — it never contains RippleView's own files — so the Dockerfile's
 * `COPY docker/app-runtime/nginx.conf ...` line must pull that file from this
 * second context instead of the (consumer) primary one. Omitted by callers
 * that only inspect the argv shape (existing tests) — see
 * docker/app-runtime/Dockerfile's `static` stage for the `--from=rv-framework`
 * reference this enables.
 *
 * @param {{ contract: BuildContract, imageTag: string, dockerfilePath: string, appDir: string, frameworkRoot?: string }} options
 * @returns {string[]}
 */
export function buildDockerArgs({ contract, imageTag, dockerfilePath, appDir, frameworkRoot }) {
  const args = [
    'build',
    '--target',
    contract.serveMode,
    '-t',
    imageTag,
    '-f',
    dockerfilePath,
    '--build-arg',
    `NODE_VERSION=${contract.nodeVersion}`,
    '--build-arg',
    `BUILD_CMD=${contract.buildCmd}`,
    '--build-arg',
    `OUTPUT_DIR=${contract.outputDir}`,
  ];

  if (contract.serveMode === 'node') {
    args.push(
      '--build-arg',
      `START_CMD=${contract.startCmd}`,
      '--build-arg',
      `PORT=${contract.port}`,
    );
  }

  if (frameworkRoot) {
    args.push('--build-context', `rv-framework=${frameworkRoot}`);
  }

  args.push(appDir);
  return args;
}
