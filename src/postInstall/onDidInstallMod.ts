import * as path from 'path';
import { selectors, types, util } from 'vortex-api';
import { GAME } from '../common/constants';
import { getDiscovery } from '../detection/discovery';
import { checkEngineVersionAsync } from '../detection/engine';
import { warnOnEngineMismatch } from './engineMismatch';
import { fixOldEngineMod } from './getModsFix';

/**
 * Handles the `did-install-mod` event from Vortex.
 *
 * Warns when the installed mod was made for the other engine, and on the old
 * engine applies the `getMods` fix-up. Vortex emits the event for every game,
 * so mods of other games are ignored.
 *
 * @param api - Vortex extension API.
 * @param gameId - ID of the game the mod was installed for.
 * @param modId - ID of the installed mod.
 */
export async function onDidInstallMod(api: types.IExtensionApi, gameId: string, modId: string): Promise<void> {
    if (gameId !== GAME.id) {
        return;
    }

    const state = api.getState();
    const installPath = selectors.installPathForGame(state, gameId);
    const mod = state.persistent.mods?.[gameId]?.[modId];
    if (!installPath || !mod?.installationPath) {
        return;
    }

    const modPath = path.join(installPath, mod.installationPath);
    const discovery = getDiscovery(api);
    const isNewEngine = await checkEngineVersionAsync(discovery);
    if (discovery?.path) {
        await warnOnEngineMismatch(api, isNewEngine, modPath, util.renderModName(mod));
    }
    if (!isNewEngine) {
        await fixOldEngineMod(api, modId, modPath);
    }
}
