/** Configure the shipped provider through the official Plugins slot and manager. */
import { useEffect, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { BundleInfo, PluginInfo } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, StateDot, Switch, Toast } from '@deepseek-ai/dsh-client-ui-primitives'
import { ComputerUsePluginArtwork } from './computer-use-command-ui.tsx'
import { DesktopPermissionsButton, PermissionDetails } from './permissions.tsx'

const PROVIDER = '@deepseek-ai/dsh-experimental-computer-use-cua-driver-native'
const COMPUTER_USE_SETTINGS_ROUTE = '/api/desktop-next/computer-use'
/** The official Computer Use bundle and its macOS provider, which take over PTC sessions while the bundle is on. */
const OFFICIAL_BUNDLE = '@deepseek-ai/dsh-cua-bundle'
const OFFICIAL_PROVIDER = '@deepseek-ai/dsh-experimental-cua-macos'

interface ComputerUseCacheEntry {
  loaded: boolean
  row: PluginInfo | undefined
  commandMode: boolean
  commandModeLoaded: boolean
}

const computerUseCache = new WeakMap<Context, ComputerUseCacheEntry>()

function getComputerUseCache(context: Context): ComputerUseCacheEntry {
  let entry = computerUseCache.get(context)
  if (!entry) {
    entry = { loaded: false, row: undefined, commandMode: true, commandModeLoaded: false }
    computerUseCache.set(context, entry)
  }
  return entry
}

export function ComputerUseSettings({ context, zh, mode = 'overview' }: { context: Context; zh: boolean; mode?: 'overview' | 'actions' | 'page' }) {
  const t = (chinese: string, english: string): string => zh ? chinese : english
  const cache = getComputerUseCache(context)
  const [revision, refresh] = useState(0)
  const [row, setRow] = useState<PluginInfo | undefined>(() => cache.row)
  const [loading, setLoading] = useState(() => !cache.loaded)
  const [busy, setBusy] = useState(false)
  const [commandMode, setCommandMode] = useState<boolean>(() => cache.commandMode)
  const [commandBusy, setCommandBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [official, setOfficial] = useState<BundleInfo | undefined>(undefined)
  const [officialProvider, setOfficialProvider] = useState<PluginInfo | undefined>(undefined)
  const [officialSupported, setOfficialSupported] = useState(false)
  const [officialBusy, setOfficialBusy] = useState(false)
  useEffect(() => {
    const reload = (): void => { refresh(value => value + 1) }
    const off = context.remote.$on('plugin-manager/changed', reload)
    const reset = context.on('connection/reset', reload)
    window.addEventListener('focus', reload)
    return () => { off(); reset(); window.removeEventListener('focus', reload) }
  }, [context])
  useEffect(() => {
    let disposed = false
    if (!cache.loaded) setLoading(true)
    void context.remote.pluginManager.listPlugins().then(result => {
      if (disposed) return
      if (!result.ok) throw new Error(result.error.message)
      const rows = result.value.filter(item => item.moduleName === PROVIDER)
      const next = rows.length === 1 ? rows[0] : undefined
      cache.row = next
      cache.loaded = true
      setRow(next)
      setOfficialProvider(result.value.find(item => item.moduleName === OFFICIAL_PROVIDER))
    }).catch(failure => {
      if (!disposed) {
        if (!cache.loaded) setRow(undefined)
        setError(String(failure))
      }
    }).finally(() => { if (!disposed) setLoading(false) })
    return () => { disposed = true }
  }, [cache, context, revision])
  useEffect(() => {
    if (mode !== 'page') return
    let disposed = false
    void context.remote.pluginManager.listBundles().then(result => {
      if (disposed) return
      if (!result.ok) throw new Error(result.error.message)
      setOfficial(result.value.find(bundle => bundle.name === OFFICIAL_BUNDLE))
    }).catch(failure => { if (!disposed) setError(String(failure)) })
    return () => { disposed = true }
  }, [context, mode, revision])
  useEffect(() => {
    if (mode !== 'page' || typeof fetch !== 'function') return
    let disposed = false
    void fetch(COMPUTER_USE_SETTINGS_ROUTE, { method: 'GET' })
      .then(async response => {
        if (!response.ok) return
        const payload = await response.json() as { commandMode?: unknown; officialSupported?: unknown } | null
        if (!disposed && payload && typeof payload.commandMode === 'boolean') {
          cache.commandMode = payload.commandMode
          cache.commandModeLoaded = true
          setCommandMode(payload.commandMode)
        }
        if (!disposed) setOfficialSupported(payload?.officialSupported === true)
      })
      .catch(() => {
        // Keep the cached/default commandMode if the Host route is unreachable in a mock environment.
      })
    return () => { disposed = true }
  }, [cache, mode, revision])
  const change = async (enabled: boolean): Promise<void> => {
    if (!row || busy || loading) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await context.remote.pluginManager.setPluginEnabled(row.entryId, enabled)
      if (!result.ok) throw new Error(result.error.message)
      const change = result.value
      if (change.application === 'failed') throw new Error(change.error?.diagnostic ?? t('无法更改插件状态。', 'Could not change the plugin state.'))
      if (change.application === 'restart-required') setNotice(t('已保存，请重启后台服务以应用。', 'Saved. Restart the background service to apply.'))
      if (change.application === 'overridden') setNotice(t('已保存，但当前配置覆盖了此开关。', 'Saved, but another configuration overrides this switch.'))
      const next = { ...row, enabled }
      cache.row = next
      setRow(next)
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)) }
    finally { setBusy(false); refresh(value => value + 1) }
  }
  const changeCommandMode = async (nextMode: boolean): Promise<void> => {
    if (busy || commandBusy || loading) return
    setCommandBusy(true); setError(''); setNotice('')
    try {
      const response = await fetch(COMPUTER_USE_SETTINGS_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commandMode: nextMode }),
      })
      if (!response.ok) {
        throw new Error(t('无法保存 Computer Use（Next）命令模式设置。', 'Could not save the Computer Use (Next) command mode setting.'))
      }
      const payload = await response.json() as { commandMode?: unknown } | null
      const resolved = payload && typeof payload.commandMode === 'boolean' ? payload.commandMode : nextMode
      cache.commandMode = resolved
      cache.commandModeLoaded = true
      setCommandMode(resolved)
      setNotice(
        resolved
          ? t('已开启按需命令加载（/computer-use）。', 'On-demand command loading (/computer-use) enabled.')
          : t('已关闭按需命令加载，Computer Use（Next）工具将在所有会话中常驻。', 'On-demand command loading disabled; Computer Use (Next) tools remain active across sessions.'),
      )
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setCommandBusy(false)
    }
  }
  const changeOfficial = async (enabled: boolean): Promise<void> => {
    if (!official || officialBusy) return
    setOfficialBusy(true); setError(''); setNotice('')
    try {
      const result = await context.remote.pluginManager.setBundleEnabled(OFFICIAL_BUNDLE, enabled)
      if (!result.ok) throw new Error(result.error.message)
      const change = result.value
      if (change.application === 'failed' || change.application === 'cancelled') throw new Error(change.error?.diagnostic ?? t('无法更改插件状态。', 'Could not change the plugin state.'))
      if (change.application === 'restart-required') setNotice(t('已保存，请重启后台服务以应用。', 'Saved. Restart the background service to apply.'))
      if (change.application === 'overridden') setNotice(t('已保存，但当前配置覆盖了此开关。', 'Saved, but another configuration overrides this switch.'))
      setOfficial({ ...official, enabled })
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)) }
    finally { setOfficialBusy(false); refresh(value => value + 1) }
  }
  const status = loading ? t('正在读取…', 'Loading…') : !row ? t('当前 Profile 中不可用', 'Unavailable in this Profile')
    : !row.enabled ? t('已停用', 'Disabled') : row.fiberPhase === 'active' ? t('运行中', 'Running')
      : row.fiberPhase === 'failed' ? t('加载失败', 'Failed to load') : t('等待加载', 'Waiting to load')
  const commandSwitchLabel = t('按需命令加载（/computer-use）', 'On-demand command loading (/computer-use)')
  const commandActive = Boolean(row?.enabled && commandMode)
  // The Host offers the official Computer Use only on macOS 14 and later, a narrower set than the bundle's platforms.
  const officialAvailable = officialSupported && official !== undefined
  const officialActive = officialAvailable && official.enabled && officialProvider?.fiberPhase === 'active'
  const components = official === undefined ? [commandActive] : [commandActive, officialActive]
  const running = components.filter(Boolean).length
  const componentCount = [t(`共 ${String(components.length)} 个`, `${String(components.length)} total`),
    ...running > 0 ? [t(`${String(running)} 运行中`, `${String(running)} running`)] : [],
    ...running < components.length ? [t(`${String(components.length - running)} 已停用`, `${String(components.length - running)} off`)] : []].join(' · ')
  return <div className="dshNextComputerUse" data-next-computer-use>
    {mode !== 'page' && <>
      <div className="dshNextPluginActions">
        <DesktopPermissionsButton service={window.desktopNext?.permissions} language={zh ? 'zh' : 'en'} label={t('权限设置', 'Permission settings')} />
        <Switch label={t('启用 Computer Use（Next）', 'Enable Computer Use (Next)')} checked={row?.enabled ?? false}
          disabled={loading || busy || !row || row.readOnlyReason !== undefined} onChange={enabled => { void change(enabled) }} />
      </div>
    </>}
    {mode === 'page' && <>
      <p className="dshDesktopSettingsHint"><code>{PROVIDER}</code></p>
      <p role="status" className="dshNextPermissionStatus"><StateDot state={row?.enabled && row.fiberPhase === 'active' ? 'done' : row?.fiberPhase === 'failed' ? 'error' : 'idle'} />{status}</p>
      <section className="dshNextComponentSection" data-next-computer-use-options>
        <div className="dshNextComponentSectionHead">
          <h4 className="dshNextComponentSectionTitle">{t('包含的组件', 'Components')}</h4>
          <span className="dshNextComponentSectionCount">{componentCount}</span>
        </div>
        <ul className="dshNextComponentRows">
          <li
            className="dshNextComponentRow"
            data-plugin-row="computer-use-command"
            {...(commandActive ? {} : { 'data-state': 'off' })}
          >
            <div className="dshNextComponentRowLine">
              <span className="dshNextComponentRowIcon" aria-hidden="true">
                <ComputerUsePluginArtwork size={30} />
              </span>
              <div className="dshNextComponentRowMain">
                <span className="dshNextComponentRowId">{commandSwitchLabel}</span>
                <span className="dshNextComponentRowModule">
                  {t(
                    '默认开启：普通会话不常驻加载 Computer Use（Next）工具与系统提示词，避免占用上下文；需要时可在会话中通过 /computer-use 命令手动加载（/computer-use off 关闭）。若关闭此项，则恢复在所有会话中常驻加载。',
                    'Enabled by default: Computer Use (Next) tools and guidance are not loaded into sessions by default to save context; run /computer-use in a session to load them on demand (/computer-use off to unload). Turn off to keep them resident in all sessions.',
                  )}
                </span>
                <code className="dshNextComponentRowModule">computer-use</code>
                <code className="dshNextComponentRowModule">{PROVIDER}</code>
              </div>
              <span className="dshNextComponentRowState">
                <StateDot state={commandActive ? 'done' : 'idle'} />
                {commandActive ? t('运行中', 'Running') : t('已关闭', 'Off')}
              </span>
              {row?.enabled ? (
                <Switch
                  label={commandSwitchLabel}
                  checked={commandMode}
                  disabled={loading || busy || commandBusy}
                  onChange={enabled => { void changeCommandMode(enabled) }}
                />
              ) : null}
            </div>
          </li>
          {official !== undefined && <OfficialComputerUseRow t={t} official={official} provider={officialProvider}
            available={officialAvailable} disabled={loading || officialBusy || official.readOnlyReason !== undefined}
            onChange={enabled => { void changeOfficial(enabled) }} />}
        </ul>
      </section>
      {window.desktopNext?.permissions ? <PermissionDetails service={window.desktopNext.permissions} language={zh ? 'zh' : 'en'} />
        : <p>{t('请在运行 DSH 的桌面应用中管理系统权限。', 'Manage system permissions in the desktop app running DSH.')}</p>}
    </>}
    {notice && <Toast text={notice} onDone={() => { setNotice('') }} />}
    {error && <Toast text={error} onDone={() => { setError('') }} />}
    {error && <div className="dshNextPluginActions"><Button variant="outline" size="sm" onClick={() => { setError(''); refresh(value => value + 1) }}>{t('重试', 'Retry')}</Button></div>}
  </div>
}

/**
 * The switch for the official Computer Use bundle. Where it cannot run, it stays off and refuses input.
 * @param props.official - the bundle as the plugin manager lists it.
 * @param props.provider - the bundle's macOS provider row, once the bundle has loaded.
 * @param props.available - whether this system can run the official Computer Use.
 * @param props.disabled - whether a read or write is in flight or the profile locks the bundle.
 */
function OfficialComputerUseRow({ t, official, provider, available, disabled, onChange }: {
  t: (chinese: string, english: string) => string
  official: BundleInfo
  provider: PluginInfo | undefined
  available: boolean
  disabled: boolean
  onChange: (enabled: boolean) => void
}) {
  const enabled = available && official.enabled
  const active = enabled && provider?.fiberPhase === 'active'
  const failed = enabled && !active && (official.error !== undefined || provider?.fiberPhase === 'failed')
  const state = !available ? t('当前系统不支持', 'Not supported on this system') : !enabled ? t('已关闭', 'Off')
    : active ? t('运行中', 'Running') : failed ? t('加载失败', 'Failed to load') : t('等待加载', 'Waiting to load')
  return <li className="dshNextComponentRow" data-plugin-row="official-computer-use" {...(active ? {} : { 'data-state': 'off' })}>
    <div className="dshNextComponentRowLine">
      <span className="dshNextComponentRowIcon" aria-hidden="true">
        <ComputerUsePluginArtwork size={30} />
      </span>
      <div className="dshNextComponentRowMain">
        <span className="dshNextComponentRowId">{t('官方 Computer Use', 'Official Computer Use')}</span>
        <span className="dshNextComponentRowModule">
          {t(
            '仅支持 macOS 14 及以上的 PTC 模式。开启后，PTC 模式的会话改用官方 Computer Use，取代 Computer Use（Next）；其他模式仍使用 Computer Use（Next）。',
            'Supports PTC mode on macOS 14 and later only. When on, the official Computer Use replaces Computer Use (Next) in PTC sessions; other modes keep Computer Use (Next).',
          )}
        </span>
        <code className="dshNextComponentRowModule">{OFFICIAL_BUNDLE}</code>
      </div>
      <span className="dshNextComponentRowState">
        <StateDot state={active ? 'done' : failed ? 'error' : 'idle'} />
        {state}
      </span>
      <Switch label={t('启用官方 Computer Use', 'Enable official Computer Use')} checked={enabled} disabled={!available || disabled}
        title={available ? undefined : t('官方 Computer Use 仅支持 macOS 14 及以上', 'The official Computer Use requires macOS 14 or later')}
        onChange={onChange} />
    </div>
  </li>
}
