import { log, types, util } from 'vortex-api';
import { GAME, MOD_TYPES, NOTIFICATION_IDS } from '../common/constants';

/**
 * Registers Vampire Survivors with Vortex's BepInEx extension, which then
 * provides the BepInEx mod types and installs the BepInEx package itself.
 * BepInEx isn't downloaded automatically, because MelonLoader is the
 * recommended loader.
 *
 * @param api - Vortex extension API.
 */
export function registerBepInExSupport(api: types.IExtensionApi): void {
    if (api.ext?.bepinexAddGame === undefined) {
        return;
    }
    try {
        api.ext.bepinexAddGame({
            gameId: GAME.id,
            autoDownloadBepInEx: false,
            // Without this, the BepInEx extension's update check compares the installed
            // BepInEx 6 with its bundled BepInEx 5 download and disables the installed one.
            forceGithubDownload: true,
            architecture: 'x64',
            unityBuild: 'unityil2cpp',
        });
    } catch (err) {
        log('error', `[bepinex] registering with the BepInEx extension failed: ${err}`);
    }
}

/**
 * Dismisses the notice Vortex's BepInEx extension shows on every activation.
 * Its advice points to the BepInEx 5 build, which can't load mods for the new
 * engine; this extension's own setup notifications explain what's needed.
 *
 * @param api - Vortex extension API.
 */
export function dismissBepInExExtensionNotice(api: types.IExtensionApi): void {
    api.onStateChange?.(['session', 'notifications', 'notifications'], (_previous, current: types.INotification[]) => {
        if (current?.some(notification => notification.id === NOTIFICATION_IDS.bepInExExtensionNotice)) {
            api.dismissNotification?.(NOTIFICATION_IDS.bepInExExtensionNotice);
        }
    });
}

/**
 * Checks whether the `bepinex-plugin` mod type is available for Vampire
 * Survivors, i.e. Vortex's BepInEx extension is enabled and the game is
 * registered with it.
 *
 * @returns True if the mod type is available; otherwise false.
 */
export function isBepInExPluginModTypeAvailable(): boolean {
    return util.getGame(GAME.id)?.modTypes?.some(modType => modType.typeId === MOD_TYPES.bepInExPlugin) ?? false;
}
