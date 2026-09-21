import * as path from 'path';
import { types, util } from 'vortex-api';
import { BEPINEX, GAME, MELON_LOADER, NOTIFICATION_IDS, VS_MOD_LOADER } from './constants';
import { anyModLoaderInstalled, checkEngineVersionAsync, fileExistsAsync, isBepInExInstalled, isMelonLoaderInstalled } from './detection';
import { apiMakeCheckAndDismissFunction, apiMakeOpenUrlFunction, ensureWritableDirOrWarn } from './notifications';

/**
 * Locates the Vampire Survivors installation directory.
 *
 * Uses Vortex's `GameStoreHelper` to find the game by its Steam app ID.
 *
 * @returns A promise that resolves to the game installation path.
 */
export async function findGame(): Promise<string> {
    const game = await util.GameStoreHelper.findByAppId(GAME.steamAppId, 'steam');
    return game.gamePath;
}

/**
 * Prepares the game installation for modding.
 *
 * Chooses between the old-engine and new-engine setup paths, based on the
 * engine detection.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 * @returns A promise that resolves once preparation is complete.
 */
export async function prepareForModding(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
    if (await checkEngineVersionAsync(discovery)) {
        return prepareForModdingNewEngine(discovery, api);
    }
    return prepareForModdingOldEngine(discovery, api);
}

/**
 * Prepares an old-engine Vampire Survivors installation for modding.
 *
 * Ensures the VS Mod Loader mods directory exists and checks whether
 * VS Mod Loader itself is properly installed. If it is missing,
 * a warning notification is shown to the user.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 */
async function prepareForModdingOldEngine(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
    await ensureWritableDirOrWarn(api, path.join(discovery.path!, VS_MOD_LOADER.modDir));
    await checkForVSModLoader(discovery, api);
}

/**
 * Verifies that VS Mod Loader is installed for an old-engine installation.
 *
 * Checks for the presence of all required VS Mod Loader files. If any are
 * missing, a warning notification is displayed with a link to download it.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 */
async function checkForVSModLoader(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
    for (const requiredFile of VS_MOD_LOADER.requiredFiles) {
        if (!(await fileExistsAsync(path.join(discovery.path!, requiredFile)))) {
            api.sendNotification?.({
                id: NOTIFICATION_IDS.vsModLoaderMissing,
                type: 'warning',
                title: `${VS_MOD_LOADER.name} not installed`,
                message: `${VS_MOD_LOADER.name} is required to mod Vampire Survivors (Old Engine).`,
                actions: [
                    apiMakeOpenUrlFunction('Get', VS_MOD_LOADER.downloadPage),
                ],
            });
            return;
        }
    }
}

/**
 * Prepares a new-engine Vampire Survivors installation for modding.
 *
 * Detects whether MelonLoader and/or BepInEx are installed and:
 * - Warns if neither is installed.
 * - Warns if both are installed and may conflict.
 * - Ensures the appropriate mods directory is writable for the active loader.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 */
async function prepareForModdingNewEngine(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
    const melonLoaderExists = isMelonLoaderInstalled(discovery);
    const bepinexExists = isBepInExInstalled(discovery);

    if (!melonLoaderExists && !bepinexExists) {
        api.sendNotification?.({
            id: NOTIFICATION_IDS.modLoaderMissing,
            type: 'warning',
            title: 'MelonLoader not installed',
            message: 'MelonLoader or BepInEx is required to mod Vampire Survivors (New Engine).',
            actions: [
                apiMakeOpenUrlFunction('Get', MELON_LOADER.downloadPage),
                apiMakeCheckAndDismissFunction('Check again', NOTIFICATION_IDS.modLoaderMissing, api, () => anyModLoaderInstalled(discovery)),
            ],
        });
        return;
    }
    if (melonLoaderExists && bepinexExists) {
        api.sendNotification?.({
            id: NOTIFICATION_IDS.bothModLoaders,
            type: 'warning',
            title: 'MelonLoader & BepInEx installed',
            message: 'MelonLoader & BepInEx are both installed. Please choose one mod loader to avoid conflicts.',
        });
        return;
    }

    const modDir = melonLoaderExists ? MELON_LOADER.modDir : BEPINEX.modDir;
    await ensureWritableDirOrWarn(api, path.join(discovery.path!, modDir));
}
