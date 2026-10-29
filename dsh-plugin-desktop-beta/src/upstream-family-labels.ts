/**
 * Official names that differ between the DSH releases Next and Beta follow. Like
 * src/upstream-family.ts, this file is a declared difference between the variants
 * (scripts/verify-desktop-variants.mjs); it stays free of imports because renderer bundles use it.
 */

/** How the official `@deepseek-ai/dsh-experimental-plugin-market-bundle` presents itself in its locale files. */
export const OFFICIAL_PLUGIN_INDEX = {
  title: { zh: '自定义插件索引', en: 'Custom plugin indexes' },
  description: {
    zh: '在插件页添加“发现”标签页，从你添加的插件索引中浏览和安装插件。',
    en: 'Adds a Discover tab to Plugins, where you browse and install plugins from plugin indexes you add.',
  },
} as const

/**
 * The official OAR subagent provider, as its locale files present it. Desktop ships it as an optional bundle whose
 * rows are the README's Codex and Claude Code example, with Claude Code accepting file edits instead of running
 * read-only (`patches/dsh-experimental-subagent-oar@<version>.patch`).
 */
export const OFFICIAL_OAR_SUBAGENTS = {
  bundle: '@deepseek-ai/dsh-experimental-subagent-oar',
  title: { zh: 'OAR 子智能体', en: 'OAR subagents' },
  description: {
    zh: '通过 OAR 向已安装的编程智能体委派任务，并提供 Codex 和 Claude Code 配置。',
    en: 'Delegate tasks to installed coding agents through OAR, with Codex and Claude Code configurations.',
  },
} as const
