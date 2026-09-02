/** Beta release-channel identities that must stay aligned with electron-builder. */
export const DESKTOP_PACKAGE_NAME = 'dsh-plugin-desktop-beta'
export const STABLE_DESKTOP_PACKAGE_NAME = 'dsh-plugin-desktop'
export const DESKTOP_PRODUCT_NAME = 'DSH Desktop Beta'
export const DESKTOP_APP_ID = 'ai.deepseek.dsh.desktop.beta'

/** Both Desktop package identities are launcher-owned, never Profile plugins. */
export const DESKTOP_PACKAGE_NAMES: ReadonlySet<string> = new Set([
  STABLE_DESKTOP_PACKAGE_NAME,
  DESKTOP_PACKAGE_NAME,
])
