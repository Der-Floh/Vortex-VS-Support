import * as path from 'path';
import Bluebird from 'bluebird';
import { log, selectors, types, util } from 'vortex-api';
import { inspectArchive } from './archive';
import { GAME, NOTIFICATION_IDS } from './constants';
import { checkEngineVersionAsync, getDiscovery } from './detection';
import { fixOldEngineMod } from './oldEngine';

const MOD_NAME_SEPARATOR = ', ';

/**
 * Handles the `did-install-mod` event from Vortex.
 *
 * Warns when the installed mod was made for the other engine. On the old
 * engine, it also attempts to locate the main VS Mod Loader mod file and apply
 * a small patch to its `getMods` implementation so that Vortex-managed folders
 * do not cause issues. Vortex emits the event for every game, so mods of other
 * games are ignored.
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
        await fixOldEngineModAndNotify(api, modId, modPath);
    }
}

/**
 * Warns if an installed mod was made for the other engine: old-engine files
 * without any `.dll` on the new engine, or a `.dll` on the old engine.
 *
 * @param api - Vortex extension API.
 * @param isNewEngine - Whether the game runs the new engine.
 * @param modPath - Staging folder of the installed mod.
 * @param modName - Display name of the installed mod.
 */
async function warnOnEngineMismatch(api: types.IExtensionApi, isNewEngine: boolean, modPath: string, modName: string): Promise<void> {
    const installed = inspectArchive(await listFilesAsync(modPath));
    if (isNewEngine && !installed.hasDll && (installed.hasJs || installed.oldEngineLayout)) {
        notifyEngineMismatch(api, NOTIFICATION_IDS.oldModOnNewEngine, modName,
            'Mod made for the old engine',
            'Vampire Survivors runs on the new engine, but these mods were made for the old engine and won\'t load: {{mods}}');
    } else if (!isNewEngine && installed.hasDll) {
        notifyEngineMismatch(api, NOTIFICATION_IDS.newModOnOldEngine, modName,
            'Mod made for the new engine',
            'Vampire Survivors runs on the old engine, but these mods were made for the new engine and won\'t load: {{mods}}');
    }
}

/**
 * Shows an engine-mismatch warning, adding the mod to the names already listed
 * in an open notification with the same id, so repeated installs update one
 * notification instead of stacking.
 *
 * @param api - Vortex extension API.
 * @param notificationId - Id of the mismatch notification.
 * @param modName - Display name of the mismatched mod.
 * @param title - Notification title.
 * @param message - Notification message; `{{mods}}` is replaced with the mod names.
 */
function notifyEngineMismatch(api: types.IExtensionApi, notificationId: string, modName: string, title: string, message: string): void {
    const open = api.getState().session.notifications.notifications.find(notification => notification.id === notificationId);
    const listedMods = open?.replace?.mods ? String(open.replace.mods).split(MOD_NAME_SEPARATOR) : [];
    const modNames = new Set([...listedMods, modName]);
    api.sendNotification?.({
        id: notificationId,
        type: 'warning',
        title,
        message,
        allowSuppress: true,
        replace: { mods: [...modNames].join(MOD_NAME_SEPARATOR) },
    });
}

/**
 * Applies the old-engine `getMods` fix-up and reports a successful patch.
 *
 * @param api - Vortex extension API.
 * @param modId - ID of the installed mod.
 * @param modPath - Staging folder of the installed mod.
 */
async function fixOldEngineModAndNotify(api: types.IExtensionApi, modId: string, modPath: string): Promise<void> {
    log('info', `[old-e] fixing old mod:"${modId}" on path:"${modPath}"`);
    if (await fixOldEngineMod(modPath)) {
        log('info', `[old-e] fixed old mod:"${modId}"`);
        api.sendNotification?.({
            id: `${NOTIFICATION_IDS.fixedModPrefix}${modId}`,
            type: 'info',
            title: 'Fixed Mod',
            message: `Successfully fixed Mod: "${modId}"`,
        });
    }
}

/**
 * Lists the files below a folder, relative to it.
 *
 * @param rootPath - Folder to list.
 * @returns A promise resolving to the relative paths of all files.
 */
async function listFilesAsync(rootPath: string): Promise<string[]> {
    const files: string[] = [];
    await util.walk(rootPath, (iterPath, stats) => {
        if (!stats.isDirectory()) {
            files.push(path.relative(rootPath, iterPath));
        }
        return Bluebird.resolve();
    }, { ignoreErrors: true });
    return files;
}
