import type { Context } from '@deepseek-ai/cordis'
import { beforeEach, expect, it, vi } from 'vitest'

const recompose = vi.hoisted(() => vi.fn())
const logging = vi.hoisted(() => ({ hostLog: vi.fn(), end: vi.fn(), hostOperation: vi.fn(), auditHostPlugins: vi.fn() }))
vi.mock('@deepseek-ai/dsh-app-boot', async importOriginal => ({
  ...await importOriginal<typeof import('@deepseek-ai/dsh-app-boot')>(),
  recomposeProfile: recompose,
}))
vi.mock('../src/host/logging.ts', () => logging)
const { createDeferredBundles } = await import('../src/host/deferred-bundles.ts')

const selection = { bundles: ['@agents-anywhere/dsh-bridge-next'], computerUseDriver: true }
const context = (hmr?: object): Context => ({ get: (name: string) => name === 'hmr' ? hmr : undefined }) as unknown as Context

beforeEach(() => {
  recompose.mockReset()
  for (const spy of [logging.hostLog, logging.end, logging.auditHostPlugins]) spy.mockReset()
  logging.hostOperation.mockReset().mockReturnValue(logging.end)
})

it('mounts nothing when the first composition left nothing out', async () => {
  const deferred = createDeferredBundles(undefined, () => [])
  expect(deferred.pending).toBeUndefined()
  await deferred.admit(context())
  expect(logging.hostOperation).not.toHaveBeenCalled()
})

it('recomposes once through the HMR service, as the plugin manager does', async () => {
  const order: string[] = []
  const deferred = createDeferredBundles(selection, () => { throw new Error('HMR reads the composition itself') })
  const hmr = {
    runExclusive: vi.fn(async (operation: () => Promise<unknown>) => { order.push('exclusive'); return operation() }),
    reconcileProfile: vi.fn(async () => { order.push(`reconcile, pending ${String(deferred.pending)}`); return { warnings: ['ui-market pending'] } }),
  }
  expect(deferred.pending).toEqual(selection)
  await Promise.all([deferred.admit(context(hmr)), deferred.admit(context(hmr))])
  await deferred.admit(context(hmr))
  expect(order).toEqual(['exclusive', 'reconcile, pending undefined'])
  expect(logging.hostOperation).toHaveBeenCalledExactlyOnceWith('host', 'deferred-bundles.mount',
    { bundles: '@agents-anywhere/dsh-bridge-next', computerUseDriver: true })
  expect(logging.end).toHaveBeenCalledExactlyOnceWith()
  expect(logging.hostLog).toHaveBeenCalledWith(expect.objectContaining({ event: 'deferred-bundles.warning', level: 'warn', message: 'ui-market pending' }))
  expect(logging.auditHostPlugins).toHaveBeenCalledOnce()
})

it('recomposes the Profile directly when it disabled HMR', async () => {
  const patches = [{ id: 'agents-anywhere-bridge-next', config: {} }]
  recompose.mockResolvedValue({ warnings: [], restartReason: 'package-moved' })
  const ctx = context()
  await createDeferredBundles(selection, () => patches).admit(ctx)
  expect(recompose).toHaveBeenCalledExactlyOnceWith(ctx, patches, 'dsh')
  expect(logging.hostLog).toHaveBeenCalledWith(expect.objectContaining({ event: 'deferred-bundles.restart-required', fields: { reason: 'package-moved' } }))
})

it('reports a failed recomposition once and never retries it', async () => {
  const failure = new Error('AA did not activate')
  const hmr = { runExclusive: vi.fn(async (operation: () => Promise<unknown>) => operation()), reconcileProfile: vi.fn(async () => { throw failure }) }
  const deferred = createDeferredBundles(selection, () => [])
  await expect(deferred.admit(context(hmr))).rejects.toBe(failure)
  await expect(deferred.admit(context(hmr))).rejects.toBe(failure)
  expect(hmr.reconcileProfile).toHaveBeenCalledOnce()
  expect(logging.end).toHaveBeenCalledExactlyOnceWith(failure)
  expect(logging.auditHostPlugins).not.toHaveBeenCalled()
})
