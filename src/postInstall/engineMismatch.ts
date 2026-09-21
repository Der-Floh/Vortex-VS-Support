import * as path from 'path';
import Bluebird from 'bluebird';
import { types, util } from 'vortex-api';
import { inspectArchive } from '../archive/inspection';
import { NOTIFICATION_IDS } from '../common/constants';

const MOD_NAME_SEPARATOR = ', ';

/**
 * Warns if an installed mod was made for the other engine: old-engine files
 * without any `.dll` on the new engine, or a `.dll` on the old engine.
 *
 * @param api - Vortex extension API.
 * @param isNewEngine - Whether the game runs the new engine.
 * @param modPath - Staging folder of the installed mod.
 * @param modName - Display name of the installed mod.
 */
export async function warnOnEngineMismatch(api: types.IExtensionApi, isNewEngine: boolean, modPath: string, modName: string): Promise<void> {
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
