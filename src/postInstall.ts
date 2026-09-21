import * as path from 'path';
import { log, selectors, types } from 'vortex-api';
import { GAME, NOTIFICATION_IDS } from './constants';
import { checkEngineVersionAsync, getDiscovery } from './detection';
import { fixOldEngineMod } from './oldEngine';

/**
 * Handles the `did-install-mod` event from Vortex.
 *
 * On the old engine, attempts to locate the main VS Mod Loader mod file and
 * apply a small patch to its `getMods` implementation so that Vortex-managed
 * folders do not cause issues. On the new engine no changes are made.
 * Vortex emits the event for every game, so mods of other games are ignored.
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

    if (await checkEngineVersionAsync(getDiscovery(api))) {
        return;
    }

    log('info', `[old-e] fixing old mod:"${modId}" on path:"${mod.installationPath}"`);
    if (await fixOldEngineMod(path.join(installPath, mod.installationPath))) {
        log('info', `[old-e] fixed old mod:"${modId}"`);
        api.sendNotification?.({
            id: `${NOTIFICATION_IDS.fixedModPrefix}${modId}`,
            type: 'info',
            title: 'Fixed Mod',
            message: `Successfully fixed Mod: "${modId}"`,
        });
    }
}
