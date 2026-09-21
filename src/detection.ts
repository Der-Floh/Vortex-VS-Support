import * as path from 'path';
import { fs, selectors, types } from 'vortex-api';
import { BEPINEX, GAME, MELON_LOADER } from './constants';

const UNITY_CRASH_HANDLERS = ['UnityCrashHandler64.exe', 'UnityCrashHandler32.exe', 'UnityCrashHandler.exe'];

/**
 * Reads the current Vampire Survivors discovery result from the Vortex state.
 *
 * @param api - Vortex extension API.
 * @returns The discovery result, or undefined if the game hasn't been discovered.
 */
export function getDiscovery(api: types.IExtensionApi): types.IDiscoveryResult | undefined {
    return selectors.discoveryByGame(api.getState(), GAME.id);
}

/**
 * Detects whether the game is running on the new (Unity) engine.
 *
 * Checks for the Unity crash handler executables (`UnityCrashHandler64.exe`,
 * `UnityCrashHandler32.exe`, `UnityCrashHandler.exe`) in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns A promise resolving to true for the new engine, false for the old engine or an undiscovered game.
 */
export async function checkEngineVersionAsync(discovery?: types.IDiscoveryResult): Promise<boolean> {
    const gamePath = discovery?.path;
    if (!gamePath) {
        return false;
    }

    for (const crashHandler of UNITY_CRASH_HANDLERS) {
        if (await fileExistsAsync(path.join(gamePath, crashHandler))) {
            return true;
        }
    }
    return false;
}

/**
 * Checks asynchronously whether a file exists.
 *
 * @param filePath - Absolute path of the file to check.
 * @returns A promise resolving to true if the file exists, false otherwise.
 */
export async function fileExistsAsync(filePath: string): Promise<boolean> {
    try {
        await fs.statAsync(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks whether MelonLoader or BepInEx is installed in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if at least one mod loader is detected; otherwise false.
 */
export function anyModLoaderInstalled(discovery?: types.IDiscoveryResult): boolean {
    return isMelonLoaderInstalled(discovery) || isBepInExInstalled(discovery);
}

/**
 * Checks whether all MelonLoader files exist in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if MelonLoader is installed; otherwise false.
 */
export function isMelonLoaderInstalled(discovery?: types.IDiscoveryResult): boolean {
    return allFilesExist(discovery, MELON_LOADER.requiredFiles);
}

/**
 * Checks whether all BepInEx files exist in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns True if BepInEx is installed; otherwise false.
 */
export function isBepInExInstalled(discovery?: types.IDiscoveryResult): boolean {
    return allFilesExist(discovery, BEPINEX.requiredFiles);
}

/**
 * Checks whether every given file exists in the game folder.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @param relativePaths - Paths relative to the game folder.
 * @returns True if the game is discovered and all files exist; otherwise false.
 */
function allFilesExist(discovery: types.IDiscoveryResult | undefined, relativePaths: string[]): boolean {
    const gamePath = discovery?.path;
    return gamePath !== undefined && relativePaths.every(relativePath => fileExistsSync(path.join(gamePath, relativePath)));
}

/**
 * Checks synchronously whether a file exists.
 *
 * @param filePath - Absolute path of the file to check.
 * @returns True if the file exists, false otherwise.
 */
function fileExistsSync(filePath: string): boolean {
    try {
        fs.statSync(filePath);
        return true;
    } catch {
        return false;
    }
}
