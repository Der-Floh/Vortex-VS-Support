import * as path from 'path';
import Bluebird from 'bluebird';
import { fs, log, types } from 'vortex-api';
import { GAME, VS_MOD_LOADER } from './constants';

/**
 * Test function for old-engine VS Mod Loader archives.
 *
 * Marks a mod as supported if:
 * - The target game matches, and
 * - At least one `.js` file (VS mod file) is present.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @returns A promise resolving to the support state and required files.
 */
export const testSupportedContentOldEngine: types.TestSupported = (files, gameId) => {
    const supported = gameId === GAME.id && files.some(file => path.extname(file).toLowerCase() === VS_MOD_LOADER.modFile);
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
    const instructions: types.IInstruction[] = prepareFilesOldEngine(files).map(file => ({
        type: 'copy',
        source: file.source,
        destination: file.destination,
    }));

    return Bluebird.resolve({ instructions });
};

/**
 * Patches an installed Kekos mod so it ignores the folder tag files that
 * Vortex's deployment writes into every directory it creates.
 *
 * @param modPath - Staging folder of the installed mod.
 * @returns A promise resolving to true if the mod's main file was patched; otherwise false.
 */
export async function fixOldEngineMod(modPath: string): Promise<boolean> {
    const mainModPath = await findMainModFile(modPath);
    return mainModPath !== undefined && fixGetMods(mainModPath);
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
        .filter(file => !file.endsWith('/'))
        .map(file => ({ source: file, destination: `${modPathPre}${file}` }));

    const logString = preparedFiles.map(file => `(source:${file.source}|destination:${file.destination})`).join('');
    log('info', `[old-e] prepared files:"${logString}"`);

    return preparedFiles;
}

/**
 * Attempts to locate the main VS Mod Loader mod entry file for a given mod.
 *
 * Searches recursively for a `mods` folder and then looks for a directory
 * whose name matches its main `.js` file.
 *
 * @param modPath - The installation path of the mod.
 * @returns A promise resolving to the main mod file path, or undefined if not found.
 */
async function findMainModFile(modPath: string): Promise<string | undefined> {
    try {
        const modsFolderPath = await findModsFolder(modPath);
        if (!modsFolderPath) {
            return undefined;
        }
        for (const entry of fs.readdirSync(modsFolderPath)) {
            const entryPath = path.join(modsFolderPath, entry);
            if (fs.statSync(entryPath).isDirectory()) {
                const mainFilePath = path.join(entryPath, `${entry}.js`);
                return (await isFileAsync(mainFilePath)) ? mainFilePath : undefined;
            }
        }
        return undefined;
    } catch {
        return undefined;
    }
}

/**
 * Recursively searches for a `mods` folder beneath the given path
 * (old-engine VS Mod Loader layout).
 *
 * @param folderPath - The folder path to start searching from.
 * @returns A promise resolving to the path of the `mods` folder, or undefined if none is found.
 */
async function findModsFolder(folderPath: string): Promise<string | undefined> {
    try {
        for (const entry of await fs.readdirAsync(folderPath)) {
            const entryPath = path.join(folderPath, entry);
            if (!(await fs.statAsync(entryPath)).isDirectory()) {
                continue;
            }
            if (entry === 'mods') {
                return entryPath;
            }
            const modsFolderPath = await findModsFolder(entryPath);
            if (modsFolderPath) {
                return modsFolderPath;
            }
        }
        return undefined;
    } catch {
        return undefined;
    }
}

/**
 * Checks asynchronously whether a path exists and is a file.
 *
 * @param filePath - Absolute path to check.
 * @returns A promise resolving to true if the path is a file, false otherwise.
 */
async function isFileAsync(filePath: string): Promise<boolean> {
    try {
        return (await fs.statAsync(filePath)).isFile();
    } catch {
        return false;
    }
}

/**
 * Patches a VS Mod Loader main file to ignore Vortex-managed folders.
 *
 * Locates the `getMods()` function and augments the `readdirSync` call so
 * that it filters out the `__folder_managed_by_vortex` entry.
 *
 * @param filePath - Path to the main mod file to patch.
 * @returns True if the file was successfully patched; otherwise false.
 */
function fixGetMods(filePath: string): boolean {
    try {
        log('info', `[fix-get-mods] filePath:"${filePath}"`);
        const data = fs.readFileSync(filePath, 'utf8');

        const getModsRegex = /getMods\s*\(\)\s*{([\s\S]*?)}/;
        const readdirSyncRegex = /"mods\/"\),\s*{\s*withFileTypes:\s*true\s*}/;

        const getModsMatch = data.match(getModsRegex);
        if (!getModsMatch) {
            return false;
        }

        const readdirSyncMatch = getModsMatch[0].match(readdirSyncRegex);
        if (!readdirSyncMatch) {
            return false;
        }

        const modifiedData = data.replace(readdirSyncRegex, `${readdirSyncMatch[0]}).filter((dir) => dir.name !== "__folder_managed_by_vortex"`);

        fs.writeFileSync(filePath, modifiedData, 'utf8');
        return true;
    } catch (err) {
        log('error', `could not fix mod:"${err}"`);
        return false;
    }
}
