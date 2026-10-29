/**
 * Mount the optional bundles a Host leaves out of its first composition once the main window is up.
 *
 * The first composition omits the selected bundles of `DEFERRED_BUNDLES` (profiles.ts) and keeps the computer-use driver
 * disabled, so the Host reaches `ready` and the window mounts its interface without importing them. Admission then
 * recomposes the Profile through the official HMR service, the same path the plugin manager takes for a live bundle
 * change: rows that already run keep running, the new rows mount, and the Web client receives the grown plugin graph
 * through `/plugins/events`. A failure leaves those rows failed in the plugin manager; it never stops the Host.
 * @module
 */
import type { Context } from '@deepseek-ai/cordis'
import { recomposeProfile } from '@deepseek-ai/dsh-app-boot'
import type { DeferredSelection } from '../profiles.ts'
import { auditHostPlugins, hostLog, hostOperation } from './logging.ts'

type Patches = Parameters<typeof recomposeProfile>[1]

/** The part of the official HMR service the plugin manager uses to apply a Profile change. */
interface ProfileReconciler {
  runExclusive<T>(operation: () => Promise<T>): Promise<T>
  reconcileProfile(): Promise<{ readonly warnings: readonly string[]; readonly restartReason?: string }>
}

/**
 * Track what this Host left out and mount it once.
 * @param selection - What the first composition leaves out, or undefined when it leaves nothing out.
 * @param readPatches - The Host's complete composition, which no longer leaves anything out once boot finished.
 * @returns The pending selection for the composition, and the one-shot admission.
 */
export function createDeferredBundles(selection: DeferredSelection | undefined, readPatches: () => Patches) {
  let pending = selection
  let admission: Promise<void> | undefined
  return {
    /** What the boot composition leaves out; undefined once admission began or when nothing was deferred. */
    get pending(): DeferredSelection | undefined { return pending },
    /**
     * Mount what the first composition left out; later calls share the first one.
     * @param ctx - The booted root context.
     * @returns after the rows mounted; rejects when the recomposition failed.
     */
    admit(ctx: Context): Promise<void> {
      return admission ??= (async () => {
        const deferred = pending
        pending = undefined
        if (deferred === undefined) return
        const end = hostOperation('host', 'deferred-bundles.mount',
          { bundles: deferred.bundles.join(' ') || null, computerUseDriver: deferred.computerUseDriver })
        try {
          const hmr = ctx.get('hmr') as ProfileReconciler | undefined
          // A Profile that disabled HMR is recomposed directly; nothing else recomposes it concurrently then.
          const result = hmr === undefined
            ? await recomposeProfile(ctx, readPatches(), 'dsh')
            : await hmr.runExclusive(() => hmr.reconcileProfile())
          for (const warning of result.warnings) hostLog({ source: 'host', event: 'deferred-bundles.warning', level: 'warn', message: warning })
          if (result.restartReason !== undefined) {
            hostLog({ source: 'host', event: 'deferred-bundles.restart-required', level: 'warn', fields: { reason: result.restartReason } })
          }
          end()
        } catch (error) { end(error); throw error }
        auditHostPlugins(ctx)
      })()
    },
  }
}
