import * as path from 'path';
import { types } from 'vortex-api';
import { BEPINEX, MELON_LOADER, NOTIFICATION_IDS } from '../common/constants';
import { apiMakeCheckAndDismissFunction, apiMakeOpenUrlFunction, ensureWritableDirOrWarn } from '../common/notifications';
import { anyModLoaderInstalled, isBepInExInstalled, isLegacyBepInExInstalled, isMelonLoaderInstalled } from '../detection/loaders';

/**
 * Prepares a new-engine Vampire Survivors installation for modding.
 *
 * Detects whether MelonLoader and/or BepInEx are installed and:
 * - Warns if BepInEx 5 is installed, since it can't load mods for this IL2CPP game.
 * - Warns if no working loader is installed.
 * - Warns if both are installed and may conflict.
 * - Ensures the appropriate mods directory is writable for the active loader.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 */
export async function prepareForModdingNewEngine(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
    const melonLoaderExists = isMelonLoaderInstalled(discovery);
    const bepinexExists = isBepInExInstalled(discovery);
    const legacyBepInExExists = isLegacyBepInExInstalled(discovery);

    if (legacyBepInExExists) {
        notifyLegacyBepInEx(api);
    }
    if (!melonLoaderExists && !bepinexExists) {
        if (!legacyBepInExExists) {
            notifyNoModLoader(api, discovery);
        }
        return;
    }
    if (melonLoaderExists && bepinexExists) {
        notifyBothModLoaders(api);
        return;
    }

    const modDir = melonLoaderExists ? MELON_LOADER.modDir : BEPINEX.modDir;
    await ensureWritableDirOrWarn(api, path.join(discovery.path!, modDir));
}

/**
 * Warns that BepInEx 5 is installed, which can't load mods for the new engine.
 *
 * @param api - Vortex extension API.
 */
function notifyLegacyBepInEx(api: types.IExtensionApi): void {
    api.sendNotification?.({
        id: NOTIFICATION_IDS.legacyBepInEx,
        type: 'warning',
        title: 'BepInEx 5 installed',
        message: `BepInEx 5 can't load mods for Vampire Survivors (New Engine), which is an IL2CPP game. Replace it with the newest "${BEPINEX.downloadName}" build of BepInEx.`,
        actions: [
            apiMakeOpenUrlFunction('Get BepInEx', BEPINEX.downloadPage),
        ],
    });
}

/**
 * Warns that no working mod loader is installed, with links to both loaders
 * and a way to re-check after installing one.
 *
 * @param api - Vortex extension API.
 * @param discovery - The game discovery result from Vortex.
 */
function notifyNoModLoader(api: types.IExtensionApi, discovery: types.IDiscoveryResult): void {
    api.sendNotification?.({
        id: NOTIFICATION_IDS.modLoaderMissing,
        type: 'warning',
        title: 'No mod loader installed',
        message: `Mods for Vampire Survivors (New Engine) need MelonLoader (recommended) or BepInEx. For BepInEx, download the newest "${BEPINEX.downloadName}" build.`,
        actions: [
            apiMakeOpenUrlFunction('Get MelonLoader', MELON_LOADER.downloadPage),
            apiMakeOpenUrlFunction('Get BepInEx', BEPINEX.downloadPage),
            apiMakeCheckAndDismissFunction('Check again', NOTIFICATION_IDS.modLoaderMissing, api, () => anyModLoaderInstalled(discovery)),
        ],
    });
}

/**
 * Warns that MelonLoader and BepInEx are both installed, which can conflict.
 *
 * @param api - Vortex extension API.
 */
function notifyBothModLoaders(api: types.IExtensionApi): void {
    api.sendNotification?.({
        id: NOTIFICATION_IDS.bothModLoaders,
        type: 'warning',
        title: 'MelonLoader & BepInEx installed',
        message: 'MelonLoader & BepInEx are both installed. Please choose one mod loader to avoid conflicts.',
    });
}
