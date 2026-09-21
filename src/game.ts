import * as path from 'path';
import { types, util } from 'vortex-api';
import { BEPINEX, GAME, MELON_LOADER, NOTIFICATION_IDS, VS_MOD_LOADER } from './constants';
import { anyModLoaderInstalled, checkEngineVersionAsync, fileExistsAsync, isBepInExInstalled, isLegacyBepInExInstalled, isMelonLoaderInstalled } from './detection';
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
 * missing, a warning notification recommends installing it. It isn't required:
 * mods that replace game files directly work without it.
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
                message: `${VS_MOD_LOADER.name} is recommended for modding Vampire Survivors (Old Engine). Without it, mods that replace the same game files overwrite each other.`,
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
 * - Warns if BepInEx 5 is installed, since it can't load mods for this IL2CPP game.
 * - Warns if no working loader is installed.
 * - Warns if both are installed and may conflict.
 * - Ensures the appropriate mods directory is writable for the active loader.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 */
async function prepareForModdingNewEngine(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
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
        message: 'BepInEx 5 can\'t load mods for Vampire Survivors (New Engine), which is an IL2CPP game. Install the IL2CPP build of BepInEx 6 instead.',
        actions: [
            apiMakeOpenUrlFunction('Get BepInEx 6', BEPINEX.downloadPage),
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
        message: 'Mods for Vampire Survivors (New Engine) need MelonLoader (recommended) or the IL2CPP build of BepInEx 6.',
        actions: [
            apiMakeOpenUrlFunction('Get MelonLoader', MELON_LOADER.downloadPage),
            apiMakeOpenUrlFunction('Get BepInEx 6', BEPINEX.downloadPage),
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
