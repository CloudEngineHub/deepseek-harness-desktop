import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { expect, it } from 'vitest'
import { parse } from 'yaml'
import type { OfficialBundleCard } from '../src/client/plugin-controls.tsx'
import { OFFICIAL_OAR_SUBAGENTS, OFFICIAL_PLUGIN_INDEX } from '../src/upstream-family-labels.ts'

const require = createRequire(import.meta.url)
const meta = (locale: 'zh' | 'en'): { title?: unknown; description?: unknown } => JSON.parse(readFileSync(
  require.resolve(`@deepseek-ai/dsh-experimental-plugin-market-bundle/locale/${locale}.json`), 'utf8')).meta
// Releases before 0.2.2 still call the bundle a plugin market; Desktop shows the 0.2.2 name ahead of them.
const BEFORE_0_2_2 = { zh: '自定义插件市场', en: 'Custom plugin markets' }
const oarSubagents: OfficialBundleCard | undefined = OFFICIAL_OAR_SUBAGENTS

it('names the official plugin index bundle exactly as the installed release does from 0.2.2 on', () => {
  for (const locale of ['zh', 'en'] as const) {
    if (meta(locale).title === BEFORE_0_2_2[locale]) continue
    expect(meta(locale).title, locale).toBe(OFFICIAL_PLUGIN_INDEX.title[locale])
    expect(meta(locale).description, locale).toBe(OFFICIAL_PLUGIN_INDEX.description[locale])
  }
})

it.runIf(oarSubagents !== undefined)('names OAR subagents exactly as the installed provider does and ships it as an optional bundle', () => {
  const card = oarSubagents!
  for (const locale of ['zh', 'en'] as const) {
    const provider = JSON.parse(readFileSync(require.resolve(`${card.bundle}/locale/${locale}.json`), 'utf8')).meta
    expect(provider.title, locale).toBe(card.title[locale])
    expect(provider.description, locale).toBe(card.description[locale])
  }
  const installation = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  expect(installation.dsh.optionalBundles).toContain(card.bundle)
  expect(Object.hasOwn(installation.dependencies, card.bundle)).toBe(true)
})

it.runIf(oarSubagents !== undefined)('composes OAR subagents exactly as the provider README example does', () => {
  const manifest = require.resolve(`${oarSubagents!.bundle}/package.json`)
  const bundle = JSON.parse(readFileSync(manifest, 'utf8')).dsh?.bundle
  expect(bundle).toEqual({ patch: './cordis.patch.yml' })
  const example = /```yaml\n(- insert:\n[\s\S]*?)```/u.exec(readFileSync(join(dirname(manifest), 'README.md'), 'utf8'))?.[1]
  expect(example).toBeDefined()
  const rows = parse(readFileSync(join(dirname(manifest), bundle.patch), 'utf8'))
  expect(rows).toEqual(parse(example!))
  // The Loader resolves each row's module from the installation.
  for (const row of rows[0].insert) expect(require.resolve(row.name)).toBeTruthy()
})
