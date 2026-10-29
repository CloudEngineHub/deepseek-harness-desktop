import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { NextDesktopRuntime } from '../src/desktop-runtime.ts'
import { HOST_COMPILE_CACHE_ENV } from '../src/host-compile-cache.ts'
import { DesktopHostProcess } from '../src/host-process.ts'

vi.mock('../src/web-document.ts', async importOriginal => ({
  ...await importOriginal<typeof import('../src/web-document.ts')>(),
  authenticateWebHost: vi.fn(async () => 'dsh-session=fixture'),
}))

const runtimes: NextDesktopRuntime[] = []
const directories: string[] = []
afterEach(async () => {
  await Promise.all(runtimes.splice(0).map(runtime => runtime.close()))
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
  vi.restoreAllMocks()
})

it('hands the Host its compile cache in a normal launch only, never one inherited into Safe Mode', async () => {
  vi.stubEnv(HOST_COMPILE_CACHE_ENV, '/inherited')
  const environments: NodeJS.ProcessEnv[] = []
  vi.spyOn(DesktopHostProcess.prototype, 'stop').mockResolvedValue()
  vi.spyOn(DesktopHostProcess.prototype, 'start').mockImplementation(function (this: DesktopHostProcess) {
    environments.push((this as unknown as { environment: NodeJS.ProcessEnv }).environment)
    return Promise.resolve({ url: 'http://127.0.0.1:43120/?token=fixture', injections: [] })
  })
  try {
    for (const safeMode of [false, true]) {
      const home = await mkdtemp(join(tmpdir(), 'next-compile-cache-runtime-'))
      directories.push(home)
      const runtime = new NextDesktopRuntime({
        home, root: home, compileCache: join(home, 'host-compile-cache', '2.0.21-next'), executable: process.execPath, addresses: () => [],
        certificate: async () => { throw new Error('No LAN certificate in this test') },
        onFailure() {}, onChange() {}, onRestart() {}, onTerminal() {}, onNotification() {},
      })
      runtimes.push(runtime)
      runtime.safeMode = safeMode
      await runtime.start()
    }
    expect(environments[0]![HOST_COMPILE_CACHE_ENV]).toMatch(/host-compile-cache[\\/]2\.0\.21-next$/u)
    expect(environments[1]![HOST_COMPILE_CACHE_ENV]).toBeUndefined()
  } finally { vi.unstubAllEnvs() }
})
