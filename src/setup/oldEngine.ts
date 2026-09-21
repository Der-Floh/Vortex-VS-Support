import * as path from 'path';
import { types } from 'vortex-api';
import { NOTIFICATION_IDS, VS_MOD_LOADER } from '../common/constants';
import { fileExistsAsync } from '../common/files';
import { apiMakeOpenUrlFunction, ensureWritableDirOrWarn } from '../common/notifications';

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
export async function prepareForModdingOldEngine(discovery: types.IDiscoveryResult, api: types.IExtensionApi): Promise<void> {
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
