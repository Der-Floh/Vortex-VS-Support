import Bluebird from 'bluebird';
import { log, types } from 'vortex-api';
import { ArchiveInfo, inspectArchive, isMarkerFile } from '../archive/inspection';
import { GAME, VS_MOD_LOADER } from '../common/constants';
import { copyInstruction } from './instructions';

/**
 * Test function for old-engine archives: VS Mod Loader mods and mods that
 * replace game files directly.
 *
 * Marks a mod as supported if the target game matches and the archive is an
 * old-engine mod: it contains a `.js` file or starts inside the old engine's
 * folder layout, and nothing in it points at the new engine.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @returns A promise resolving to the support state and required files.
 */
export const testSupportedContentOldEngine: types.TestSupported = (files, gameId) => {
    const supported = gameId === GAME.id && isOldEngineArchive(inspectArchive(files));
    return Bluebird.resolve({ supported, requiredFiles: [] });
};

/**
 * Installer implementation for old-engine VS Mod Loader mods.
 *
 * Normalizes paths into the expected old-engine structure and emits
 * copy instructions for Vortex.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installContentOldEngine: types.InstallFunc = (files) => {
    const instructions = prepareFilesOldEngine(files).map(file => copyInstruction(file.source, file.destination));
    return Bluebird.resolve({ instructions });
};

/**
 * Decides whether an archive is an old-engine mod this installer can place.
 *
 * It must contain a `.js` file or start inside the old engine's folder layout
 * (e.g. `assets/`, `renderer/`, `mods/`), and nothing in it may point at the
 * new engine: no `.dll` file, no loader marker, no path mentioning a loader.
 *
 * @param archive - The inspected archive.
 * @returns True if the archive is an old-engine mod; otherwise false.
 */
function isOldEngineArchive(archive: ArchiveInfo): boolean {
    const targetsNewEngine = archive.hasDll
        || archive.markers.melonLoader || archive.markers.bepInEx
        || archive.mentionsMelonLoader || archive.mentionsBepInEx;
    return !targetsNewEngine && (archive.hasJs || archive.oldEngineLayout);
}

/**
 * Prepares archive files for installation on the old engine.
 *
 * Attempts to detect a common prefix inside the archive based on known
 * VS Mod Loader hierarchy, and rewrites destinations so that the in-game
 * layout matches expectations.
 *
 * @param files - Files from the archive.
 * @returns An array of objects describing source and destination paths.
 */
function prepareFilesOldEngine(files: string[]): { source: string, destination: string }[] {
    log('info', `[old-e] prepare files:"${files}"`);

    let modPathPre = '';
    for (let file of files) {
        file = file.replaceAll('\\', '/');
        const fileComponents = file.split('/');

        for (const hierPath of VS_MOD_LOADER.hier) {
            const hierComponents = hierPath.split('/');
            const hierIndex = hierComponents.indexOf(fileComponents[0]);

            if (hierIndex !== -1) {
                modPathPre = hierComponents.slice(0, hierIndex).join('/');
                break;
            }
        }

        if (modPathPre && modPathPre.length !== 0) {
            modPathPre += '/';
            break;
        }
    }

    const preparedFiles = files
        .map(file => file.replaceAll('\\', '/'))
        .filter(file => !file.endsWith('/') && !isMarkerFile(file))
        .map(file => ({ source: file, destination: `${modPathPre}${file}` }));

    const logString = preparedFiles.map(file => `(source:${file.source}|destination:${file.destination})`).join('');
    log('info', `[old-e] prepared files:"${logString}"`);

    return preparedFiles;
}
