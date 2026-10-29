/**
 * Host process entry. Node's module compile cache only covers modules loaded after it is turned on,
 * so this file imports nothing that loads the Host's module graph and imports the Host afterwards.
 */
import { constants, enableCompileCache, flushCompileCache } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOST_COMPILE_CACHE_ENV, type HostCompileCacheStatus } from '../host-compile-cache.ts'

/** Write what startup compiled once the Host is idle, rather than only when it exits cleanly. */
const FLUSH_DELAY_MS = 15_000

/**
 * Turn on the compile cache the shell assigned, and keep its location from plugin subprocesses.
 * @param environment - the Host's environment; the directory entry is removed from it.
 * @param enable - Node's switch; injectable for tests.
 * @returns the outcome, or undefined when the shell assigned no cache.
 */
export function enableHostCompileCache(
  environment: NodeJS.ProcessEnv = process.env,
  enable: typeof enableCompileCache = enableCompileCache,
): HostCompileCacheStatus | undefined {
  const directory = environment[HOST_COMPILE_CACHE_ENV]
  delete environment[HOST_COMPILE_CACHE_ENV]
  if (!directory) return undefined
  // A cache that cannot be opened costs only the compile time it would have saved.
  try {
    const { status } = enable(directory)
    const { ENABLED, ALREADY_ENABLED, DISABLED } = constants.compileCacheStatus
    return status === ENABLED ? 'enabled' : status === ALREADY_ENABLED ? 'already-enabled' : status === DISABLED ? 'disabled' : 'failed'
  } catch { return 'failed' }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const compileCache = enableHostCompileCache()
  const { fatal, main } = await import('./index.ts')
  main({ compileCache }).then(() => {
    if (compileCache !== 'enabled') return
    setTimeout(() => {
      try { flushCompileCache() } catch { /* Node still writes the cache when the Host exits. */ }
    }, FLUSH_DELAY_MS).unref()
  }, fatal)
}
