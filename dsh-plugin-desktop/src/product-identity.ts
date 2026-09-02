/** Stable release-channel identities that must stay aligned with electron-builder. */
export const DESKTOP_PACKAGE_NAME = 'dsh-plugin-desktop'
export const BETA_DESKTOP_PACKAGE_NAME = 'dsh-plugin-desktop-beta'
export const DESKTOP_PRODUCT_NAME = 'DSH Desktop'
export const DESKTOP_APP_ID = 'ai.deepseek.dsh.desktop'
export const DESKTOP_RELEASE_CHANNEL = 'stable' as const

/** Both Desktop package identities are launcher-owned, never Profile plugins. */
export const DESKTOP_PACKAGE_NAMES: ReadonlySet<string> = new Set([
  DESKTOP_PACKAGE_NAME,
  BETA_DESKTOP_PACKAGE_NAME,
])
