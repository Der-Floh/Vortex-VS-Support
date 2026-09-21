import * as path from 'path';
import { types } from 'vortex-api';
import { LEGACY_EXTENSION_NAME, NOTIFICATION_IDS } from '../common/constants';

/**
 * Warns if the extension's 2.2.x version is still installed next to this one.
 *
 * 3.0.0 added an id to `info.json`, which changed the plugin folder. Updates
 * from Nexus Mods remove the old folder, but a manual install keeps it, and
 * then both versions register the game.
 *
 * @param api - Vortex extension API.
 */
export function warnAboutLegacyExtension(api: types.IExtensionApi): void {
    const ownPath = path.normalize(__dirname);
    const legacyInstalled = api.getLoadedExtensions().some(extension =>
        extension.info?.name === LEGACY_EXTENSION_NAME && path.normalize(extension.path) !== ownPath);
    if (!legacyInstalled) {
        return;
    }
    api.sendNotification?.({
        id: NOTIFICATION_IDS.legacyExtension,
        type: 'warning',
        title: 'Old Vampire Survivors extension installed',
        message: `The old "${LEGACY_EXTENSION_NAME}" extension is still installed next to this one, so both handle Vampire Survivors. Remove it on the Extensions page and restart Vortex.`,
    });
}
