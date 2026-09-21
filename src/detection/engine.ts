import * as path from 'path';
import { types } from 'vortex-api';
import { fileExistsAsync } from '../common/files';

const UNITY_CRASH_HANDLERS = ['UnityCrashHandler64.exe', 'UnityCrashHandler32.exe', 'UnityCrashHandler.exe'];

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
