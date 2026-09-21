import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { ArchiveInfo, chooseLoader, contentFiles, inspectArchive } from './archive';
import { bepInExInstructions } from './bepinex';
import { GAME, MOD_TYPES } from './constants';
import { detectLoaders } from './detection';
import { copyInstruction, setModTypeInstruction } from './instructions';
import { melonLoaderInstructions } from './melonLoader';

/**
 * Test function for archives with marker files (`_melonloader`, `_bepinex`,
 * `_keepstructure`).
 *
 * It runs before Vortex's BepInEx extension, whose installers would otherwise
 * claim some marked archives (e.g. ones with a top-level `config` folder).
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @returns A promise resolving to the support state and required files.
 */
export const testSupportedMarkedArchive: types.TestSupported = (files, gameId) =>
    Bluebird.resolve({ supported: gameId === GAME.id && isMarkedArchive(inspectArchive(files)), requiredFiles: [] });

/**
 * Installer implementation for archives with marker files.
 *
 * With `_keepstructure`, the archive's layout is installed as-is, relative to
 * the game folder. Otherwise the archive is installed for the loader it is
 * routed to (see {@link chooseLoader}).
 *
 * @param files - Files contained in the archive.
 * @param api - Vortex extension API, used to detect the installed loaders.
 * @returns A promise resolving to installer instructions.
 */
export function installMarkedArchive(files: string[], api: types.IExtensionApi): Bluebird<types.IInstallResult> {
    const archive = inspectArchive(files);
    if (archive.markers.keepStructure) {
        return Bluebird.resolve({ instructions: keepStructureInstructions(files) });
    }
    const instructions = chooseLoader(archive, detectLoaders(api)) === 'bepinex'
        ? bepInExInstructions(files)
        : melonLoaderInstructions(files);
    return Bluebird.resolve({ instructions });
}

/**
 * Decides whether this installer handles an archive: it has `_keepstructure`
 * and something to install, or a loader marker and a `.dll` file. Loader
 * packages are left to their own installers.
 *
 * @param archive - The inspected archive.
 * @returns True if the archive is a marked mod; otherwise false.
 */
function isMarkedArchive(archive: ArchiveInfo): boolean {
    if (archive.melonLoaderPackage || archive.bepInExPackage) {
        return false;
    }
    if (archive.markers.keepStructure) {
        return archive.hasContent;
    }
    return (archive.markers.melonLoader || archive.markers.bepInEx) && archive.hasDll;
}

/**
 * Builds the instructions for a `_keepstructure` archive: every file keeps its
 * path, relative to the game folder.
 *
 * @param files - Files contained in the archive.
 * @returns The installer instructions.
 */
function keepStructureInstructions(files: string[]): types.IInstruction[] {
    return [
        ...contentFiles(files).map(file => copyInstruction(file, file)),
        setModTypeInstruction(MOD_TYPES.gameRoot),
    ];
}
