import * as path from 'path';
import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { filesSignalBepInEx, filesSignalMelonLoader } from './archive';
import { BEPINEX, GAME } from './constants';
import { getDiscovery, isBepInExInstalled } from './detection';

/**
 * Test function for new-engine BepInEx archives.
 *
 * Conditions (in order):
 * - Only supports Vampire Survivors.
 * - Looks for `.dll` mod files.
 * - Prefers explicit BepInEx markers (special filenames or name matches).
 * - If BepInEx is installed and MelonLoader markers are absent, assumes
 *   the archive is for BepInEx.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @param api - Vortex extension API, used to read the current discovery.
 * @returns A promise resolving to the support state and required files.
 */
export function testSupportedContentNewEngineBepInEx(files: string[], gameId: string, api: types.IExtensionApi): Bluebird<types.ISupportedResult> {
    if (gameId !== GAME.id) {
        return Bluebird.resolve({ supported: false, requiredFiles: [] });
    }

    const filesIncludeModFile = files.some(file => path.extname(file).toLowerCase() === BEPINEX.modFile);
    if (filesSignalBepInEx(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    if (isBepInExInstalled(getDiscovery(api)) && !filesSignalMelonLoader(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    return Bluebird.resolve({ supported: false, requiredFiles: [] });
}

/**
 * Installer implementation for new-engine BepInEx mods.
 *
 * When a special `_keepstructure` marker is present, the original archive
 * folder structure is preserved. Otherwise, DLLs are placed into BepInEx's
 * plugins directory.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installContentNewEngineBepInEx: types.InstallFunc = (files) => {
    const keepStructure = files.some(file => path.basename(file).toLowerCase() === BEPINEX.keepStructureFile);
    const filtered = files.filter(file =>
        !file.endsWith(path.sep) &&
        path.basename(file).toLowerCase() !== BEPINEX.keepStructureFile,
    );

    if (keepStructure) {
        const instructions: types.IInstruction[] = filtered.map(file => ({ type: 'copy', source: file, destination: file }));
        return Bluebird.resolve({ instructions });
    }

    const instructions: types.IInstruction[] = filtered
        .filter(file => path.extname(file).toLowerCase() === BEPINEX.modFile)
        .map(file => ({ type: 'copy', source: file, destination: path.join(BEPINEX.modDir, path.basename(file)) }));

    return Bluebird.resolve({ instructions });
};
