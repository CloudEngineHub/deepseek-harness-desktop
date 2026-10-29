import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { constants } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { enableHostCompileCache } from '../src/host/bootstrap.ts'
import { HOST_COMPILE_CACHE_ENV, hostCompileCacheDirectory, pruneHostCompileCaches } from '../src/host-compile-cache.ts'

const directories: string[] = []
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

it('gives each release its own cache beside the normal launch state, except on Windows', () => {
  expect(hostCompileCacheDirectory('/home/electron-user-data', '2.0.21-beta.1', 'darwin')).toBe(join('/home/electron-user-data', 'host-compile-cache', '2.0.21-beta.1'))
  expect(hostCompileCacheDirectory('/home/electron-user-data', '2.0.21-beta.1', 'linux')).toBe(join('/home/electron-user-data', 'host-compile-cache', '2.0.21-beta.1'))
  expect(hostCompileCacheDirectory('C:\\home\\electron-user-data', '2.0.21-beta.1', 'win32')).toBeUndefined()
})

it('removes what earlier releases cached and keeps this release', async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-compile-cache-'))
  directories.push(root)
  for (const release of ['2.0.20-beta.1', '2.0.21-beta.1']) {
    mkdirSync(join(root, release, 'v24.21.0-arm64-8c6a5e03-501'), { recursive: true })
    writeFileSync(join(root, release, 'v24.21.0-arm64-8c6a5e03-501', '0012f1e4'), 'cache')
  }
  await pruneHostCompileCaches(join(root, '2.0.21-beta.1'))
  expect(readdirSync(root)).toEqual(['2.0.21-beta.1'])
  expect(readdirSync(join(root, '2.0.21-beta.1', 'v24.21.0-arm64-8c6a5e03-501'))).toEqual(['0012f1e4'])
  // Nothing cached yet is not a failure.
  await expect(pruneHostCompileCaches(join(root, 'missing', '2.0.21-beta.1'))).resolves.toBeUndefined()
})

it('turns on the assigned cache and keeps its location out of the Host environment', () => {
  const environment: NodeJS.ProcessEnv = { [HOST_COMPILE_CACHE_ENV]: '/cache', PATH: '/bin' }
  const enabled: string[] = []
  const status = enableHostCompileCache(environment, directory => { enabled.push(directory!); return { status: constants.compileCacheStatus.ENABLED } })
  expect(status).toBe('enabled')
  expect(enabled).toEqual(['/cache'])
  expect(environment).toEqual({ PATH: '/bin' })
})

it('starts without a cache it was not given or cannot open', () => {
  const unused = () => { throw new Error('must not be called') }
  expect(enableHostCompileCache({}, unused)).toBeUndefined()
  expect(enableHostCompileCache({ [HOST_COMPILE_CACHE_ENV]: '' }, unused)).toBeUndefined()
  const { ALREADY_ENABLED, DISABLED, FAILED } = constants.compileCacheStatus
  expect(enableHostCompileCache({ [HOST_COMPILE_CACHE_ENV]: '/cache' }, () => ({ status: ALREADY_ENABLED }))).toBe('already-enabled')
  expect(enableHostCompileCache({ [HOST_COMPILE_CACHE_ENV]: '/cache' }, () => ({ status: DISABLED }))).toBe('disabled')
  expect(enableHostCompileCache({ [HOST_COMPILE_CACHE_ENV]: '/cache' }, () => ({ status: FAILED, message: 'EACCES' }))).toBe('failed')
  expect(enableHostCompileCache({ [HOST_COMPILE_CACHE_ENV]: '/cache' }, unused)).toBe('failed')
})
