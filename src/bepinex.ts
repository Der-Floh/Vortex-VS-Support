import * as path from 'path';
import Bluebird from 'bluebird';
import { log, types, util } from 'vortex-api';
import { chooseLoader, contentFiles, hasExtension, inspectArchive, isNewEngineMod } from './archive';
import { BEPINEX, GAME, MOD_TYPES, NOTIFICATION_IDS } from './constants';
import { detectLoaders } from './detection';
import { copyInstruction, setModTypeInstruction } from './instructions';

/**
 * Test function for new-engine BepInEx mods without marker files.
 *
 * Supports Vampire Survivors archives that contain a `.dll` file and are
 * routed to BepInEx (see {@link chooseLoader}). The BepInEx package itself is
 * left to Vortex's BepInEx extension.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @param api - Vortex extension API, used to detect the installed loaders.
 * @returns A promise resolving to the support state and required files.
 */
export function testSupportedContentNewEngineBepInEx(files: string[], gameId: string, api: types.IExtensionApi): Bluebird<types.ISupportedResult> {
    const archive = inspectArchive(files);
    const supported = gameId === GAME.id && isNewEngineMod(archive) && chooseLoader(archive, detectLoaders(api)) === 'bepinex';
    return Bluebird.resolve({ supported, requiredFiles: [] });
}

/**
 * Installer implementation for new-engine BepInEx mods.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installContentNewEngineBepInEx: types.InstallFunc = (files) =>
    Bluebird.resolve({ instructions: bepInExInstructions(files) });

/**
 * Builds the instructions for a BepInEx plugin: `.dll` files go flat into
 * `BepInEx/plugins`, everything else is skipped. With Vortex's BepInEx
 * extension this uses its `bepinex-plugin` mod type; if that extension is
 * disabled, the files go to `BepInEx/plugins` relative to the game folder.
 *
 * @param files - Files contained in the archive.
 * @returns The installer instructions.
 */
export function bepInExInstructions(files: string[]): types.IInstruction[] {
    const dllFiles = contentFiles(files).filter(file => hasExtension(file, BEPINEX.modFile));
    if (isBepInExPluginModTypeAvailable()) {
        return [
            ...dllFiles.map(file => copyInstruction(file, path.basename(file))),
            setModTypeInstruction(MOD_TYPES.bepInExPlugin),
        ];
    }
    return [
        ...dllFiles.map(file => copyInstruction(file, path.join(BEPINEX.modDir, path.basename(file)))),
        setModTypeInstruction(MOD_TYPES.gameRoot),
    ];
}

/**
 * Registers Vampire Survivors with Vortex's BepInEx extension, which then
 * provides the BepInEx mod types and installs the BepInEx package itself.
 * BepInEx isn't downloaded automatically, because MelonLoader is the
 * recommended loader.
 *
 * @param api - Vortex extension API.
 */
export function registerBepInExSupport(api: types.IExtensionApi): void {
    if (api.ext?.bepinexAddGame === undefined) {
        return;
    }
    try {
        api.ext.bepinexAddGame({
            gameId: GAME.id,
            autoDownloadBepInEx: false,
            // Without this, the BepInEx extension's update check compares the installed
            // BepInEx 6 with its bundled BepInEx 5 download and disables the installed one.
            forceGithubDownload: true,
            architecture: 'x64',
            unityBuild: 'unityil2cpp',
        });
    } catch (err) {
        log('error', `[bepinex] registering with the BepInEx extension failed: ${err}`);
    }
}

/**
 * Dismisses the notice Vortex's BepInEx extension shows on every activation.
 * Its advice points to the BepInEx 5 build, which can't load mods for the new
 * engine; this extension's own setup notifications explain what's needed.
 *
 * @param api - Vortex extension API.
 */
export function dismissBepInExExtensionNotice(api: types.IExtensionApi): void {
    api.onStateChange?.(['session', 'notifications', 'notifications'], (_previous, current: types.INotification[]) => {
        if (current?.some(notification => notification.id === NOTIFICATION_IDS.bepInExExtensionNotice)) {
            api.dismissNotification?.(NOTIFICATION_IDS.bepInExExtensionNotice);
        }
    });
}

/**
 * Checks whether the `bepinex-plugin` mod type is available for Vampire
 * Survivors, i.e. Vortex's BepInEx extension is enabled and the game is
 * registered with it.
 *
 * @returns True if the mod type is available; otherwise false.
 */
function isBepInExPluginModTypeAvailable(): boolean {
    return util.getGame(GAME.id)?.modTypes?.some(modType => modType.typeId === MOD_TYPES.bepInExPlugin) ?? false;
}
