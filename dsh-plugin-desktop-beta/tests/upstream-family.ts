/**
 * Test fixtures for upstream APIs that differ between the DSH releases Next and Beta follow.
 * Like src/upstream-family.ts, this file is a declared difference between the variants while
 * Beta tracks a newer upstream prerelease than Next.
 */
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Context, Plugin } from '@deepseek-ai/cordis'
import * as NativeToolExecutor from '@deepseek-ai/dsh-tool-executor-native'

export { defineContentToolFixture, executeToolFixture } from '@deepseek-ai/dsh-tool-testkit'

/**
 * Load what a test Context needs before its registered tools can execute.
 * @param ctx - test root that already provides the tool runtime.
 */
export async function installToolExecution(ctx: Context): Promise<void> {
  // dsh 0.2.2 dispatches every call through the selected executor plugin.
  await ctx.plugin(NativeToolExecutor)
}

/** Whether the followed release ships the official Computer Use bundle, `@deepseek-ai/dsh-cua-bundle`. */
export const OFFICIAL_COMPUTER_USE = true

/**
 * Load the provider that the shipped official Computer Use bundle composes. An absolute helper path
 * skips native preparation; no test operation starts the helper.
 * @param ctx - test root providing the provider's registry, tool, prompt, subprocess, Agent and preset services.
 * @returns disposer that unloads the provider.
 */
export async function installOfficialComputerUse(ctx: Context): Promise<() => Promise<void>> {
  const bundle = createRequire(import.meta.url).resolve('@deepseek-ai/dsh-cua-bundle/package.json')
  const provider: Plugin = await import(pathToFileURL(createRequire(bundle).resolve('@deepseek-ai/dsh-experimental-cua-macos')).href)
  const fiber = ctx.plugin(provider, { helperPath: join(tmpdir(), 'dsh-cua-native') })
  await fiber
  return async () => { await fiber.dispose() }
}
