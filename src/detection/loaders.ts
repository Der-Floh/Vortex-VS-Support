import * as path from 'path';
import { types } from 'vortex-api';
import { LoaderPresence } from '../archive/routing';
import { BEPINEX, GAME, LOADER_PACKAGE_ATTRIBUTE, MELON_LOADER, MOD_TYPES } from '../common/constants';
import { fileExistsSync } from '../common/files';
import { getDiscovery } from './discovery';

/**
 * Checks whether a working mod loader (MelonLoader or BepInEx 6) is installed
 * in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if at least one working mod loader is detected; otherwise false.
 */
export function anyModLoaderInstalled(discovery?: types.IDiscoveryResult): boolean {
    return isMelonLoaderInstalled(discovery) || isBepInExInstalled(discovery);
}

/**
 * Checks whether MelonLoader (0.5 or later) is installed in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if MelonLoader is installed; otherwise false.
 */
export function isMelonLoaderInstalled(discovery?: types.IDiscoveryResult): boolean {
    return anyFileExists(discovery, MELON_LOADER.detectionFiles);
}

/**
 * Checks whether BepInEx 6 is installed in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if BepInEx 6 is installed; otherwise false.
 */
export function isBepInExInstalled(discovery?: types.IDiscoveryResult): boolean {
    return anyFileExists(discovery, BEPINEX.detectionFiles);
}

/**
 * Checks whether BepInEx 5 is installed in the game folder. BepInEx 5 can't
 * load mods for IL2CPP games such as the new engine.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if BepInEx 5 is installed; otherwise false.
 */
export function isLegacyBepInExInstalled(discovery?: types.IDiscoveryResult): boolean {
    return anyFileExists(discovery, BEPINEX.legacyDetectionFiles);
}

/**
 * Detects the installed mod loaders for routing archives. Besides the game
 * folder, it counts loaders installed through Vortex that may not be deployed
 * yet: the MelonLoader package installed by this extension, and the BepInEx
 * package installed by Vortex's BepInEx extension.
 *
 * @param api - Vortex extension API.
 * @returns Which mod loaders are installed.
 */
export function detectLoaders(api: types.IExtensionApi): LoaderPresence {
    const discovery = getDiscovery(api);
    const mods: types.IMod[] = Object.values(api.getState().persistent.mods?.[GAME.id] ?? {});
    return {
        melonLoader: isMelonLoaderInstalled(discovery) || mods.some(isMelonLoaderPackageMod),
        bepInEx: isBepInExInstalled(discovery) || isLegacyBepInExInstalled(discovery) || mods.some(mod => mod.type === MOD_TYPES.bepInExInjector),
    };
}

/**
 * Checks whether a mod is the MelonLoader package installed by this extension.
 *
 * @param mod - The mod to check.
 * @returns True if the mod is the MelonLoader package; otherwise false.
 */
function isMelonLoaderPackageMod(mod: types.IMod): boolean {
    return mod.attributes?.[LOADER_PACKAGE_ATTRIBUTE.key] === LOADER_PACKAGE_ATTRIBUTE.melonLoader;
}

/**
 * Checks whether any of the given files exists in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @param relativePaths - Paths relative to the game folder.
 * @returns True if the game is discovered and at least one file exists; otherwise false.
 */
function anyFileExists(discovery: types.IDiscoveryResult | undefined, relativePaths: string[]): boolean {
    const gamePath = discovery?.path;
    return gamePath !== undefined && relativePaths.some(relativePath => fileExistsSync(path.join(gamePath, relativePath)));
}
