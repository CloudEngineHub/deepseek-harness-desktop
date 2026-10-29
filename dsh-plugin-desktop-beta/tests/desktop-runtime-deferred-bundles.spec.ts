import { mkdtemp, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { NextDesktopRuntime } from '../src/desktop-runtime.ts'
import { DesktopHostProcess } from '../src/host-process.ts'
import { historyFiles } from '../src/log-history.ts'

vi.mock('../src/web-document.ts', async importOriginal => ({
  ...await importOriginal<typeof import('../src/web-document.ts')>(),
  authenticateWebHost: vi.fn(async () => 'dsh-session=fixture'),
}))

const runtimes: NextDesktopRuntime[] = []
const directories: string[] = []
afterEach(async () => {
  vi.useRealTimers()
  await Promise.all(runtimes.splice(0).map(runtime => runtime.close()))
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
  vi.restoreAllMocks()
})

async function fixture(deferred: boolean) {
  const home = await mkdtemp(join(tmpdir(), 'next-deferred-bundles-'))
  directories.push(home)
  vi.spyOn(DesktopHostProcess.prototype, 'stop').mockResolvedValue()
  vi.spyOn(DesktopHostProcess.prototype, 'start').mockResolvedValue({ url: 'http://127.0.0.1:43120/?token=fixture', injections: [], deferred })
  const admit = vi.spyOn(DesktopHostProcess.prototype, 'admitDeferredBundles').mockResolvedValue()
  const runtime = new NextDesktopRuntime({
    home, root: home, executable: process.execPath, addresses: () => ['127.0.0.1'],
    certificate: async () => { throw new Error('No LAN certificate in this test') },
    onFailure() {}, onChange() {}, onRestart() {}, onTerminal() {}, onNotification() {},
  })
  runtimes.push(runtime)
  const history = () => historyFiles(join(home, 'logs')).flatMap(file => readFileSync(file.file, 'utf8').trim().split('\n').filter(Boolean)
    .map(line => JSON.parse(line) as { event: string; fields?: Record<string, unknown> }))
  return { runtime, admit, history }
}

it('lets each Host mount its deferred bundles once, on the first report of a mounted interface', async () => {
  const { runtime, admit, history } = await fixture(true)
  runtime.admitDeferredBundles('renderer')
  expect(admit).not.toHaveBeenCalled()
  await runtime.start()
  const admission = runtime.admitDeferredBundles('renderer')
  expect(runtime.admitDeferredBundles('request')).toBe(admission)
  await admission
  expect(admit).toHaveBeenCalledOnce()
  await vi.waitFor(() => expect(history().find(record => record.event === 'deferred-bundles.admit.complete')?.fields)
    .toMatchObject({ trigger: 'renderer' }))
  // A replacement Host defers again and is admitted again.
  await runtime.restart()
  runtime.admitDeferredBundles('renderer')
  expect(admit).toHaveBeenCalledTimes(2)
})

it('admits on its own five seconds after ready when no window reports a mounted interface', async () => {
  vi.useFakeTimers()
  const { runtime, admit } = await fixture(true)
  await runtime.start()
  await vi.advanceTimersByTimeAsync(4_999)
  expect(admit).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(admit).toHaveBeenCalledOnce()
  runtime.admitDeferredBundles('renderer')
  expect(admit).toHaveBeenCalledOnce()
})

it('asks nothing of a Host that deferred nothing, nor of a Host that stopped', async () => {
  vi.useFakeTimers()
  const quiet = await fixture(false)
  await quiet.runtime.start()
  quiet.runtime.admitDeferredBundles('renderer')
  await vi.advanceTimersByTimeAsync(10_000)
  expect(quiet.admit).not.toHaveBeenCalled()
  vi.restoreAllMocks()
  const stopped = await fixture(true)
  await stopped.runtime.start()
  await stopped.runtime.backend.stop()
  stopped.runtime.admitDeferredBundles('renderer')
  await vi.advanceTimersByTimeAsync(10_000)
  expect(stopped.admit).not.toHaveBeenCalled()
})

it('keeps the Host running when its deferred bundles fail to mount', async () => {
  const { runtime, admit, history } = await fixture(true)
  admit.mockRejectedValue(new Error('Could not mount the optional bundles'))
  await runtime.start()
  runtime.admitDeferredBundles('renderer')
  await vi.waitFor(() => expect(history().some(record => record.event === 'deferred-bundles.admit.failed')).toBe(true))
  expect(runtime.backend.state.phase).toBe('ready')
  expect(runtime.state().failure).toBe('')
})
