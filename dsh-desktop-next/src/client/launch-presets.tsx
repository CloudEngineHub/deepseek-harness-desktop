/** Launch choices on the official Plugins page: one configuration page per bundle row, applied by the Host. */
import { useEffect, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { Choice } from './DesktopSettingsSection.tsx'
import {
  LAUNCH_PRESETS_ROUTE, type BilingualText, type LaunchPresetBundle, type LaunchPresetRow, type LaunchPresetState,
} from '../launch-presets.ts'

/**
 * Give each row a configure control on its bundle's page, opening the row's launch choices.
 * @param ctx - client context with the Plugins page slots and the Remote.
 * @param bundle - the rows and their choices.
 */
export function registerLaunchPresets(ctx: Context, bundle: LaunchPresetBundle): void {
  ctx.slots.inject('plugins.row.config', () => {
    const disposers = bundle.rows.map(row => ctx.slots.register({ name: 'plugins.row.config', key: `${bundle.bundle}#${row.id}`,
      locale: 'desktop-next', inject: () => ({ context: ctx, row }),
    }, LaunchPresetPage))
    return () => { for (const dispose of disposers) dispose() }
  })
}

function LaunchPresetPage({ context, row, t, view }: PropsLocale<'desktop-next'> & PropsRuntime<'plugins.row.config'> & {
  context: Context
  row: LaunchPresetRow
}) {
  const zh = t('language') === 'zh'
  if (view === 'summary') return zh ? row.title.zh : row.title.en
  return <LaunchPresetForm context={context} row={row} zh={zh} />
}

/** The row's choices, staged until saved; the Host reports which one the row runs with. */
function LaunchPresetForm({ context, row, zh }: { context: Context; row: LaunchPresetRow; zh: boolean }) {
  const t = (cn: string, en: string): string => zh ? cn : en
  const text = (value: BilingualText): string => zh ? value.zh : value.en
  const [state, setState] = useState<LaunchPresetState | undefined>(undefined)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, refresh] = useState(0)
  useEffect(() => {
    const reload = (): void => { refresh(value => value + 1) }
    const off = context.remote.$on('plugin-manager/changed', reload)
    const reset = context.on('connection/reset', reload)
    return () => { off(); reset() }
  }, [context])
  useEffect(() => {
    const controller = new AbortController()
    void fetch(LAUNCH_PRESETS_ROUTE, { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error(t('无法读取当前设置。', 'Could not read the current setting.'))
      const current = ((await response.json()) as { rows?: LaunchPresetState[] }).rows?.find(item => item.row === row.id)
      setState(current)
      setSelected(staged => staged ?? current?.preset ?? null)
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : String(failure))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => { controller.abort() }
  }, [context, row.id, revision])
  const save = async (): Promise<void> => {
    if (selected === null || saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch(LAUNCH_PRESETS_ROUTE, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ row: row.id, preset: selected }),
      })
      const payload = await response.json() as { rows?: LaunchPresetState[]; error?: string }
      const current = payload.rows?.find(item => item.row === row.id)
      if (current !== undefined) setState(current)
      if (!response.ok) {
        throw new Error(payload.error === 'inactive'
          ? t('这一行没有运行，开启插件和这一行后才能修改。', 'This row is not running. Turn on the plugin and this row to change it.')
          : payload.error ?? t('无法保存设置。', 'Could not save the setting.'))
      }
      setNotice(t('已保存，之后委派的任务按新设置启动。', 'Saved. Tasks delegated from now on start with this setting.'))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setSaving(false)
    }
  }
  const active = state?.active === true
  return <div className="dshNextLaunchPresets" data-next-launch-presets={row.id}>
    <h4 className="dshNextLaunchPresetsTitle">{text(row.title)}</h4>
    {!loading && !active && <p className="dshDesktopSettingsHint">
      {t('这一行没有运行，开启插件和这一行后才能修改。', 'This row is not running. Turn on the plugin and this row to change it.')}
    </p>}
    {active && state.preset === null && <p className="dshDesktopSettingsHint">
      {t('这一行正在使用自定义启动参数，选择下面任一项会替换它们。', 'This row runs with custom launch arguments; choosing an option below replaces them.')}
    </p>}
    <div className="dshNextLaunchPresetChoices" role="radiogroup" aria-label={text(row.title)}>
      {row.presets.map(preset => <Choice key={preset.id} title={text(preset.title)} body={text(preset.description)}
        badge={preset.shipped === true ? t('默认', 'Default') : preset.unrestricted === true ? t('不受限制', 'Unrestricted') : undefined}
        selected={selected === preset.id} disabled={!active || saving}
        action={() => { setSelected(preset.id); setNotice('') }} />)}
    </div>
    <div className="dshNextPluginActions">
      <Button variant="primary" size="sm" disabled={!active || saving || selected === null || selected === state.preset}
        onClick={() => { void save() }}>{saving ? t('正在保存…', 'Saving…') : t('保存', 'Save')}</Button>
    </div>
    {notice && <p role="status" className="dshDesktopSettingsHint">{notice}</p>}
    {error && <p role="alert" className="dshDesktopSettingsError">{error}</p>}
  </div>
}
