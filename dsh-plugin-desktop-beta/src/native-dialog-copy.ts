/** Localized copy for Desktop-owned native dialogs and notifications. */

import type { DesktopLocale } from './runtime.ts'

export interface DesktopNativeCopy {
  readonly ok: string
  readonly pluginRecoveryTitle: string
  readonly pluginRecoveryMessage: string
  readonly unknownPlugin: string
  readonly missingPluginError: string
  readonly failedPlugins: string
  readonly pluginRecoveryInstructions: string
  readonly openTerminal: string
  readonly restart: string
  readonly dismiss: string
  readonly updateAvailableTitle: string
  readonly updateAvailableMessage: (version: string) => string
  readonly downloadUpdate: string
  readonly installStableAlongsideBeta: string
  readonly download: string
  readonly later: string
  readonly updateCheckFailedTitle: string
  readonly updateCheckFailedMessage: string
  readonly tryAgainLater: string
  readonly upToDateTitle: string
  readonly upToDateMessage: string
  readonly installedVersion: (version: string) => string
  readonly installerUnavailable: string
  readonly updateDownloadedTitle: string
  readonly updateReady: (version: string) => string
  readonly macInstallInstructions: string
  readonly windowsInstallQuestion: string
  readonly restartAndInstall: string
  readonly saveInstallerTitle: string
  readonly saveAndDownload: string
  readonly diskImage: string
  readonly windowsInstaller: string
  readonly removeInstallerTitle: string
  readonly updateInstalled: (version: string) => string
  readonly removeInstallerQuestion: (path: string) => string
  readonly deleteInstaller: string
  readonly keepInstaller: string
  readonly terminalErrorTitle: string
  readonly terminalErrorMessage: string
  readonly diagnosticsErrorTitle: string
  readonly diagnosticsErrorMessage: string
  readonly skippedPluginTitle: string
  readonly skippedPluginBody: (name: string, additionalCount: number) => string
  readonly unsupportedStorageTitle: string
  readonly unsupportedStorageBody: (label: string) => string
  readonly profileCompatibilityTitle: string
  readonly profileCompatibilityMessage: (profileName: string, previousProductName?: string) => string
  readonly profileCompatibilityDetail: (
    previousDesktopVersion: string,
    previousDshVersion: string,
    currentProductName: string,
    currentDesktopVersion: string,
    currentDshVersion: string,
  ) => string
  readonly profileCompatibilityUnknownDetail: (
    currentProductName: string,
    currentDesktopVersion: string,
    currentDshVersion: string,
  ) => string
  readonly createNewProfile: string
  readonly useProfileAnyway: string
  readonly quit: string
  readonly unknownVersion: string
}

const COPY: Record<DesktopLocale, DesktopNativeCopy> = {
  en: {
    ok: 'OK',
    pluginRecoveryTitle: 'Plugin Load Failed',
    pluginRecoveryMessage: 'Some plugins could not be loaded.',
    unknownPlugin: 'Unknown client plugin',
    missingPluginError: 'The plugin loader did not provide an error message.',
    failedPlugins: 'Plugins that failed to load:',
    pluginRecoveryInstructions: 'Open DSH Terminal to update or remove the failing third-party plugin, then restart DSH Desktop.',
    openTerminal: 'Open DSH Terminal',
    restart: 'Restart DSH Desktop',
    dismiss: 'Dismiss',
    updateAvailableTitle: 'DSH Desktop Update Available',
    updateAvailableMessage: version => `DSH Desktop ${version} is available.`,
    downloadUpdate: 'Download this update now?',
    installStableAlongsideBeta: 'Install the stable edition alongside DSH Desktop Beta? The Beta app will remain installed.',
    download: 'Download',
    later: 'Later',
    updateCheckFailedTitle: 'Unable to Check for Updates',
    updateCheckFailedMessage: 'DSH Desktop could not check for updates.',
    tryAgainLater: 'Please try again later.',
    upToDateTitle: 'DSH Desktop Is Up to Date',
    upToDateMessage: 'No newer version of DSH Desktop is available.',
    installedVersion: version => `Installed version: ${version}`,
    installerUnavailable: 'Installer downloads are unavailable in this build.',
    updateDownloadedTitle: 'DSH Desktop Update Downloaded',
    updateReady: version => `DSH Desktop ${version} is ready to install.`,
    macInstallInstructions: 'The disk image has opened. Replace DSH Desktop in Applications, then reopen it.',
    windowsInstallQuestion: 'Restart DSH Desktop and run the installer now?',
    restartAndInstall: 'Restart and Install',
    saveInstallerTitle: 'Save Update Installer',
    saveAndDownload: 'Save and Download',
    diskImage: 'Disk Image',
    windowsInstaller: 'Windows Installer',
    removeInstallerTitle: 'Remove Update Installer',
    updateInstalled: version => `DSH Desktop ${version} has been installed.`,
    removeInstallerQuestion: path => `Delete the downloaded installer to free disk space?\n\n${path}`,
    deleteInstaller: 'Delete Installer',
    keepInstaller: 'Keep Installer',
    terminalErrorTitle: 'Unable to Open DSH Terminal',
    terminalErrorMessage: 'DSH Desktop could not open a terminal.',
    diagnosticsErrorTitle: 'Unable to Export Diagnostics',
    diagnosticsErrorMessage: 'DSH Desktop could not export the diagnostic archive.',
    skippedPluginTitle: 'UI Plugin Not Loaded',
    skippedPluginBody: (name, additionalCount) => additionalCount > 0
      ? `${name} and ${additionalCount} other UI ${additionalCount === 1 ? 'plugin are' : 'plugins are'} not installed in this Profile.`
      : `${name} is not installed in this Profile.`,
    unsupportedStorageTitle: 'Storage May Be Unsupported',
    unsupportedStorageBody: label => `${label} is on a volume that may prevent sandboxed commands or plugin installation from working.`,
    profileCompatibilityTitle: 'Profile Compatibility Warning',
    profileCompatibilityMessage: (profileName, previousProductName) => previousProductName === undefined
      ? `The previous Desktop edition for Profile “${profileName}” could not be determined.`
      : `Profile “${profileName}” was most recently used by ${previousProductName}.`,
    profileCompatibilityDetail: (previousDesktopVersion, previousDshVersion, currentProductName, currentDesktopVersion, currentDshVersion) =>
      `Previous Desktop: ${previousDesktopVersion}\nPrevious DSH: ${previousDshVersion}\nCurrent: ${currentProductName} ${currentDesktopVersion}\nCurrent DSH: ${currentDshVersion}\n\nPlugins, dependency locks, settings, or sessions may be incompatible. Creating a new Profile is recommended.`,
    profileCompatibilityUnknownDetail: (currentProductName, currentDesktopVersion, currentDshVersion) =>
      `Current: ${currentProductName} ${currentDesktopVersion}\nCurrent DSH: ${currentDshVersion}\n\nSome Desktop usage records are missing, outdated, or damaged. Creating a new Profile is recommended before this Profile is changed.`,
    createNewProfile: 'Create New Profile',
    useProfileAnyway: 'Use Anyway',
    quit: 'Quit',
    unknownVersion: 'Unknown',
  },
  zh: {
    ok: '确定',
    pluginRecoveryTitle: '插件加载失败',
    pluginRecoveryMessage: '部分插件未能加载。',
    unknownPlugin: '未知客户端插件',
    missingPluginError: '插件加载器没有提供错误信息。',
    failedPlugins: '加载失败的插件：',
    pluginRecoveryInstructions: '请打开 DSH 终端更新或移除失败的第三方插件，然后重启 DSH Desktop。',
    openTerminal: '打开 DSH 终端',
    restart: '重启 DSH Desktop',
    dismiss: '关闭',
    updateAvailableTitle: 'DSH Desktop 有可用更新',
    updateAvailableMessage: version => `DSH Desktop ${version} 已可用。`,
    downloadUpdate: '现在下载此更新？',
    installStableAlongsideBeta: '是否同时安装稳定版？DSH Desktop Beta 将继续保留。',
    download: '下载',
    later: '稍后',
    updateCheckFailedTitle: '无法检查更新',
    updateCheckFailedMessage: 'DSH Desktop 无法检查更新。',
    tryAgainLater: '请稍后重试。',
    upToDateTitle: 'DSH Desktop 已是最新版本',
    upToDateMessage: '当前没有更新版本的 DSH Desktop。',
    installedVersion: version => `当前版本：${version}`,
    installerUnavailable: '此构建不支持下载安装包。',
    updateDownloadedTitle: 'DSH Desktop 更新已下载',
    updateReady: version => `DSH Desktop ${version} 已可安装。`,
    macInstallInstructions: '磁盘映像已打开。请替换“应用程序”中的 DSH Desktop，然后重新打开。',
    windowsInstallQuestion: '现在重启 DSH Desktop 并运行安装程序？',
    restartAndInstall: '重启并安装',
    saveInstallerTitle: '保存更新安装包',
    saveAndDownload: '保存并下载',
    diskImage: '磁盘映像',
    windowsInstaller: 'Windows 安装程序',
    removeInstallerTitle: '删除更新安装包',
    updateInstalled: version => `DSH Desktop ${version} 已安装。`,
    removeInstallerQuestion: path => `是否删除下载的安装包以释放磁盘空间？\n\n${path}`,
    deleteInstaller: '删除安装包',
    keepInstaller: '保留安装包',
    terminalErrorTitle: '无法打开 DSH 终端',
    terminalErrorMessage: 'DSH Desktop 无法打开终端。',
    diagnosticsErrorTitle: '无法导出诊断信息',
    diagnosticsErrorMessage: 'DSH Desktop 无法导出诊断包。',
    skippedPluginTitle: '界面插件未加载',
    skippedPluginBody: (name, additionalCount) => additionalCount > 0
      ? `${name} 及另外 ${additionalCount} 个界面插件未安装在当前 Profile 中。`
      : `${name} 未安装在当前 Profile 中。`,
    unsupportedStorageTitle: '存储位置可能不受支持',
    unsupportedStorageBody: label => `${label} 所在的磁盘可能导致沙盒命令或插件安装无法正常工作。`,
    profileCompatibilityTitle: 'Profile 兼容性警告',
    profileCompatibilityMessage: (profileName, previousProductName) => previousProductName === undefined
      ? `无法确定 Profile“${profileName}”此前由哪个桌面版本使用。`
      : `Profile“${profileName}”最近由 ${previousProductName} 使用。`,
    profileCompatibilityDetail: (previousDesktopVersion, previousDshVersion, currentProductName, currentDesktopVersion, currentDshVersion) =>
      `此前桌面版本：${previousDesktopVersion}\n此前 DSH 版本：${previousDshVersion}\n当前版本：${currentProductName} ${currentDesktopVersion}\n当前 DSH 版本：${currentDshVersion}\n\n直接复用可能导致插件、依赖锁文件、设置或会话不兼容，建议新建 Profile。`,
    profileCompatibilityUnknownDetail: (currentProductName, currentDesktopVersion, currentDshVersion) =>
      `当前版本：${currentProductName} ${currentDesktopVersion}\n当前 DSH 版本：${currentDshVersion}\n\n部分桌面使用记录缺失、过旧或损坏。为避免当前 Profile 被修改，建议先新建 Profile。`,
    createNewProfile: '新建 Profile',
    useProfileAnyway: '仍然使用',
    quit: '退出',
    unknownVersion: '未知',
  },
}

export function desktopNativeCopy(locale: DesktopLocale): DesktopNativeCopy {
  return COPY[locale]
}
