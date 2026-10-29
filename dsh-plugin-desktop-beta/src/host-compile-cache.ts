/**
 * Node's module compile cache for the Host: V8 otherwise compiles the Host's whole module graph again
 * on every launch. Main chooses the directory; the Host entry (host/bootstrap.ts) turns the cache on
 * before that graph loads.
 * @module
 */
import { readdir, rm } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

/** Carries the directory to the Host entry, which removes it before any plugin can inherit it. */
export const HOST_COMPILE_CACHE_ENV = 'DSH_NEXT_COMPILE_CACHE'

/** What the Host entry reports in its `process.start` record. */
export type HostCompileCacheStatus = 'enabled' | 'already-enabled' | 'disabled' | 'failed'

/**
 * Choose the Host's compile cache directory for this release.
 * @param userData - the normal launch's Electron state; Safe Mode never passes its disposable one.
 * @param version - this release; each release starts a directory of its own.
 * @param platform - the running platform.
 * @returns the cache directory, or undefined on Windows: each cached module is one more small file
 *   read at every start, and real-time scanning of that many files has not been weighed there
 *   against the compile time it saves.
 */
export function hostCompileCacheDirectory(userData: string, version: string, platform: NodeJS.Platform): string | undefined {
  return platform === 'win32' ? undefined : join(userData, 'host-compile-cache', version)
}

/**
 * Remove what earlier releases cached beside this release's directory. Node keys entries by module
 * path and contents, so files of a replaced release would otherwise stay forever.
 * @param directory - this release's cache directory.
 */
export async function pruneHostCompileCaches(directory: string): Promise<void> {
  const root = dirname(directory)
  const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
  await Promise.all(entries.filter(entry => entry.name !== basename(directory))
    .map(entry => rm(join(root, entry.name), { recursive: true, force: true })))
}
