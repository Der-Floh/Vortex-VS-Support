import * as path from 'path';
import { fs, log, types } from 'vortex-api';
import { NOTIFICATION_IDS } from '../common/constants';

/**
 * Patches an installed old-engine mod by Kekos so it ignores the folder tag
 * files (`__folder_managed_by_vortex`) that Vortex's deployment writes into
 * every directory it creates. Those mods treat every entry in their `mods`
 * folder as a mod, so the tag file gives a black screen. Reports a successful
 * patch with a notification.
 *
 * @param api - Vortex extension API.
 * @param modId - ID of the installed mod.
 * @param modPath - Staging folder of the installed mod.
 */
export async function fixOldEngineMod(api: types.IExtensionApi, modId: string, modPath: string): Promise<void> {
    log('info', `[old-e] fixing old mod:"${modId}" on path:"${modPath}"`);
    const mainModPath = await findMainModFile(modPath);
    if (mainModPath === undefined || !fixGetMods(mainModPath)) {
        return;
    }
    log('info', `[old-e] fixed old mod:"${modId}"`);
    api.sendNotification?.({
        id: `${NOTIFICATION_IDS.fixedModPrefix}${modId}`,
        type: 'info',
        title: 'Fixed Mod',
        message: `Successfully fixed Mod: "${modId}"`,
    });
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
