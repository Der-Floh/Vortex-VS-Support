import { selectors, types, util } from 'vortex-api';
import { GAME } from '../common/constants';

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
 * Reads the current Vampire Survivors discovery result from the Vortex state.
 *
 * @param api - Vortex extension API.
 * @returns The discovery result, or undefined if the game hasn't been discovered.
 */
export function getDiscovery(api: types.IExtensionApi): types.IDiscoveryResult | undefined {
    return selectors.discoveryByGame(api.getState(), GAME.id);
}
