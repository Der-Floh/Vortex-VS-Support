import { types } from 'vortex-api';
import { checkEngineVersionAsync } from '../detection/engine';
import { prepareForModdingNewEngine } from './newEngine';
import { prepareForModdingOldEngine } from './oldEngine';

/**
 * Prepares the game installation for modding. Vortex calls this every time
 * the game mode is activated.
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
