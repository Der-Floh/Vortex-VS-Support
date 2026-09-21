import * as path from 'path';
import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { filesSignalBepInEx, filesSignalMelonLoader, isMarkerFile } from './archive';
import { GAME, MELON_LOADER } from './constants';
import { getDiscovery, isMelonLoaderInstalled } from './detection';

/**
 * Test function for new-engine MelonLoader archives.
 *
 * Conditions (in order):
 * - Only supports Vampire Survivors.
 * - Looks for `.dll` mod files.
 * - Prefers explicit MelonLoader markers (special filenames or name matches).
 * - If MelonLoader is installed and BepInEx markers are absent, assumes
 *   the archive is for MelonLoader.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @param api - Vortex extension API, used to read the current discovery.
 * @returns A promise resolving to the support state and required files.
 */
export function testSupportedContentNewEngineMelonLoader(files: string[], gameId: string, api: types.IExtensionApi): Bluebird<types.ISupportedResult> {
    if (gameId !== GAME.id) {
        return Bluebird.resolve({ supported: false, requiredFiles: [] });
    }

    const filesIncludeModFile = files.some(file => path.extname(file).toLowerCase() === MELON_LOADER.modFile);
    if (filesSignalMelonLoader(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    if (isMelonLoaderInstalled(getDiscovery(api)) && !filesSignalBepInEx(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    return Bluebird.resolve({ supported: false, requiredFiles: [] });
}

/**
 * Installer implementation for new-engine MelonLoader mods.
 *
 * When a special `_keepstructure` marker is present, the original archive
 * folder structure is preserved. Otherwise, DLLs are placed into MelonLoader's
 * mods directory and CFG files into its UserData directory. Marker files are
 * never copied.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installContentNewEngineMelonLoader: types.InstallFunc = (files) => {
    const keepStructure = files.some(file => path.basename(file).toLowerCase() === MELON_LOADER.keepStructureFile);
    const filtered = files.filter(file => !file.endsWith(path.sep) && !isMarkerFile(file));

    if (keepStructure) {
        const instructions: types.IInstruction[] = filtered.map(file => ({ type: 'copy', source: file, destination: file }));
        return Bluebird.resolve({ instructions });
    }

    const dllInstructions: types.IInstruction[] = filtered
        .filter(file => path.extname(file).toLowerCase() === MELON_LOADER.modFile)
        .map(file => ({ type: 'copy', source: file, destination: path.join(MELON_LOADER.modDir, path.basename(file)) }));
    const cfgInstructions: types.IInstruction[] = filtered
        .filter(file => path.extname(file).toLowerCase() === MELON_LOADER.userDataFile)
        .map(file => ({ type: 'copy', source: file, destination: path.join(MELON_LOADER.userDataDir, path.basename(file)) }));

    return Bluebird.resolve({ instructions: [...dllInstructions, ...cfgInstructions] });
};
