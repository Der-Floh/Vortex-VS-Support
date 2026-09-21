import * as vortex from 'vortex-api';
import * as path from 'path';
import Bluebird from 'bluebird';
import { fs, log, util, selectors } from 'vortex-api';

type IExtensionContext = vortex.types.IExtensionContext;
type IExtensionApi = vortex.types.IExtensionApi;
type IDiscoveryResult = vortex.types.IDiscoveryResult;
type TestSupported = vortex.types.TestSupported;
type ISupportedResult = vortex.types.ISupportedResult;
type InstallFunc = vortex.types.InstallFunc;
type IInstruction = vortex.types.IInstruction;

const GAME = {
    id: 'vampiresurvivors',
    name: 'Vampire Survivors',
    exe: 'VampireSurvivors.exe',
    steamAppId: '1794680',
    requiredFiles: [
        'VampireSurvivors.exe'
    ]
};

const MELON_LOADER = {
    name: 'MelonLoader',
    modFile: '.dll',
    userDataFile: '.cfg',
    detectorFile: '_melonloader',
    keepStructureFile: '_keepstructure',
    modDir: 'Mods',
    userDataDir: 'UserData',
    requiredFiles: [
        path.join('MelonLoader', 'net6', 'MelonLoader.dll'),
    ],
    modPage: 'https://melonwiki.xyz',
    downloadPage: 'https://github.com/LavaGang/MelonLoader/releases/latest',
}

const BEPINEX = {
    name: 'BepInEx',
    modFile: '.dll',
    modDir: path.join('BepInEx', 'plugins'),
    detectorFile: '_bepinex',
    keepStructureFile: '_keepstructure',
    requiredFiles: [
        'BepInEx/core/BepInEx.dll',
    ],
    modPage: 'https://docs.bepinex.dev/index.html',
    downloadPage: 'https://github.com/BepInEx/BepInEx/releases/latest',
}

const VS_MOD_LOADER = {
    name: 'VS Mod Loader',
    modFile: '.js',
    modDir: path.join('resources', 'app', '.webpack', 'renderer', 'mod_loader', 'mods'),
    requiredFiles: [
        path.join('resources', 'app', '.webpack', 'renderer', 'mod_loader', 'index.js'),
    ],
    modPage: 'https://www.nexusmods.com/vampiresurvivors/mods/64',
    downloadPage: 'https://www.nexusmods.com/vampiresurvivors/mods/64?tab=files',
    hier: [
        'resources/app/.webpack/renderer/mod_loader/mods',
        'resources/app/.webpack/renderer/assets',
        'resources/app/.webpack/renderer/main.bundle.js'
    ]
}


// -------------------------------------
//#region Register Game
// -------------------------------------

/**
 * Vortex extension entry point for Vampire Survivors.
 *
 * Registers the game, sets up mod installers for the different engines / mod
 * loaders (VS Mod Loader, MelonLoader, BepInEx), and hooks into relevant
 * events such as `did-install-mod`.
 *
 * @param context - Vortex extension context supplied by the host.
 * @returns True if the extension initialized successfully.
 */
function main(context: IExtensionContext): boolean {
    // Register game here
    context.registerGame({
        id: GAME.id,
        name: GAME.name,
        mergeMods: true,
        queryPath: () => Bluebird.resolve(findGame()),
        supportedTools: [],
        queryModPath: () => '.',
        logo: 'gameart.jpg',
        executable: () => GAME.exe,
        requiredFiles: GAME.requiredFiles,
        setup: (discovery) => Bluebird.resolve(prepareForModding(discovery, context.api)),
        environment: { SteamAPPId: GAME.steamAppId },
        details: { steamAppId: GAME.steamAppId },
    });

    // Register mod installer
    context.registerInstaller('vs-newengine-melonloader-mod', 30, (files, gameId) => testSupportedContentNewEngineMelonLoader(files, gameId, context.api), installContentNewEngineMelonLoader);
    context.registerInstaller('vs-newengine-bepinex-mod', 20, (files, gameId) => testSupportedContentNewEngineBepInEx(files, gameId, context.api), installContentNewEngineBepInEx);
    context.registerInstaller('vs-oldengine-mod', 10, testSupportedContentOldEngine, installContentOldEngine);

    context.once(() => {
        context.api.events.on('did-install-mod', (gameId: string, _archiveId: string, modId: string) =>
            onDidInstallMod(context.api, gameId, modId).catch(err => log('error', `[did-install-mod] ${err}`)));
    });

    return true;
}

/**
 * Locates the Vampire Survivors installation directory.
 *
 * Uses Vortex's `GameStoreHelper` to find the game by its Steam app ID.
 *
 * @returns A promise that resolves to the game installation path.
 */
async function findGame() {
    const game = await util.GameStoreHelper.findByAppId(GAME.steamAppId, 'steam');
    return game.gamePath;
}

/**
 * Reads the current Vampire Survivors discovery result from the Vortex state.
 *
 * @param api - Vortex extension API.
 * @returns The discovery result, or undefined if the game hasn't been discovered.
 */
function getDiscovery(api: IExtensionApi): IDiscoveryResult | undefined {
    return selectors.discoveryByGame(api.getState(), GAME.id);
}

/**
 * Prepares the game installation for modding.
 *
 * Chooses between the old-engine and new-engine setup paths, based on the
 * engine detection.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 * @returns A promise that resolves once preparation is complete.
 */
async function prepareForModding(discovery: IDiscoveryResult, api: IExtensionApi) {
    const isNewEngine = await checkEngineVersionAsync(discovery);
    if (isNewEngine) {
        return prepareForModdingNewEngine(discovery, api);
    } else {
        return prepareForModdingOldEngine(discovery, api);
    }
}

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
async function prepareForModdingOldEngine(discovery: IDiscoveryResult, api: IExtensionApi) {
    // Ensure the mods folder exists, then check for ML.
    await ensureWritableDirOrWarn(api, path.join(discovery.path!, VS_MOD_LOADER.modDir));
    await checkForVSModLoader(discovery, api, VS_MOD_LOADER.requiredFiles);
}

/**
 * Verifies that VS Mod Loader is installed for an old-engine installation.
 *
 * Checks for the presence of all required VS Mod Loader files. If any are
 * missing, a warning notification is displayed with a link to download it.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 * @param requiredFiles - List of files that must exist for VS Mod Loader.
 */
async function checkForVSModLoader(discovery: IDiscoveryResult, api: IExtensionApi, requiredFiles: string[]) {
    for (const reqFile of requiredFiles) {
        try {
            await fs.statAsync(path.join(discovery.path!, reqFile));
        } catch {
            api.sendNotification?.({
                id: 'vs-modloader-missing',
                type: 'warning',
                title: 'VS Mod Loader not installed',
                message: 'VS Mod Loader is required to mod Vampire Survivors (Old Engine).',
                actions: [
                    apiMakeOpenUrlFunction('Get', VS_MOD_LOADER.downloadPage),
                ],
            });
            return;
        }
    }
}

/**
 * Prepares a new-engine Vampire Survivors installation for modding.
 *
 * Detects whether MelonLoader and/or BepInEx are installed and:
 * - Warns if neither is installed.
 * - Warns if both are installed and may conflict.
 * - Ensures the appropriate mods directory is writable for the active loader.
 *
 * @param discovery - The game discovery result from Vortex.
 * @param api - Vortex extension API.
 */
async function prepareForModdingNewEngine(discovery: IDiscoveryResult, api: IExtensionApi) {
    const melonLoaderExists = isMelonLoaderInstalled(discovery);
    const bepinexExists = isBepInExInstalled(discovery);

    if (!melonLoaderExists && !bepinexExists) {
        api.sendNotification?.({
            id: 'ml-or-bix-missing',
            type: 'warning',
            title: 'MelonLoader not installed',
            message: 'MelonLoader or BepInEx is required to mod Vampire Survivors (New Engine).',
            actions: [
                apiMakeOpenUrlFunction('Get', MELON_LOADER.downloadPage),
                apiMakeCheckAndDismissFunction('Check again', 'ml-or-bix-missing', api, () => anyModLoaderInstalled(discovery)),
            ],
        });
        return;
    } else if (melonLoaderExists && bepinexExists) {
        api.sendNotification?.({
            id: 'ml-and-bix-both',
            type: 'warning',
            title: 'MelonLoader & BepInEx installed',
            message: 'MelonLoader & BepInEx are both installed. Please choose one mod loader to avoid conflicts.',
        });
        return;
    }

    if (melonLoaderExists) {
        await ensureWritableDirOrWarn(api, path.join(discovery.path!, MELON_LOADER.modDir));
    } else if (bepinexExists) {
        await ensureWritableDirOrWarn(api, path.join(discovery.path!, BEPINEX.modDir));
    }
}

/**
 * Checks whether any supported mod loader (MelonLoader or BepInEx)
 * is installed for a new-engine installation.
 *
 * @param discovery - The game discovery result from Vortex.
 * @returns True if at least one mod loader is detected; otherwise false.
 */
function anyModLoaderInstalled(discovery: IDiscoveryResult) {
    return isMelonLoaderInstalled(discovery) || isBepInExInstalled(discovery);
}

/**
 * Checks if MelonLoader is installed for a given discovery.
 *
 * Looks for all MelonLoader required files under the game directory.
 *
 * @param discovery - The game discovery result from Vortex.
 * @returns True if all required MelonLoader files exist; otherwise false.
 */
function isMelonLoaderInstalled(discovery: IDiscoveryResult) {
    for (const reqFile of MELON_LOADER.requiredFiles) {
        try {
            fs.statSync(path.join(discovery.path!, reqFile));
        } catch {
            return false;
        }
    }
    return true;
}

/**
 * Checks if BepInEx is installed for a given discovery.
 *
 * Looks for all BepInEx required files under the game directory.
 *
 * @param discovery - The game discovery result from Vortex.
 * @returns True if all required BepInEx files exist; otherwise false.
 */
function isBepInExInstalled(discovery: IDiscoveryResult) {
    for (const reqFile of BEPINEX.requiredFiles) {
        try {
            fs.statSync(path.join(discovery.path!, reqFile));
        } catch {
            return false;
        }
    }
    return true;
}
//#endregion


// -------------------------------------
//#region Mod installers
// -------------------------------------

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
 * @function
 */
const testSupportedContentOldEngine: TestSupported = (files, gameId) => {
    // Make sure we're able to support this mod.
    const supported =
        (gameId === GAME.id) &&
        (files.find(file => path.extname(file).toLowerCase() === VS_MOD_LOADER.modFile) !== undefined);
    return Bluebird.resolve({ supported, requiredFiles: [] });
};

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
function testSupportedContentNewEngineMelonLoader(files: string[], gameId: string, api: IExtensionApi): Bluebird<ISupportedResult> {
    if (gameId !== GAME.id) {
        return Bluebird.resolve({ supported: false, requiredFiles: [] });
    }

    const filesIncludeModFile = files.some(file => path.extname(file).toLowerCase() === MELON_LOADER.modFile);
    const filesSignalMelonLoader =
        (files.some(file => path.basename(file).toLowerCase() === MELON_LOADER.detectorFile)) ||
        (files.some(file => file.toLowerCase().includes(MELON_LOADER.name.toLowerCase())));

    if (filesSignalMelonLoader) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    const discovery = getDiscovery(api);
    const melonLoaderInstalled = discovery?.path ? isMelonLoaderInstalled(discovery) : false;
    if (melonLoaderInstalled && !filesSignalBepInEx(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    return Bluebird.resolve({ supported: false, requiredFiles: [] });
}

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
function testSupportedContentNewEngineBepInEx(files: string[], gameId: string, api: IExtensionApi): Bluebird<ISupportedResult> {
    if (gameId !== GAME.id) {
        return Bluebird.resolve({ supported: false, requiredFiles: [] });
    }

    const filesIncludeModFile = files.some(file => path.extname(file).toLowerCase() === BEPINEX.modFile);

    if (filesSignalBepInEx(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    const discovery = getDiscovery(api);
    const bepinexInstalled = discovery?.path ? isBepInExInstalled(discovery) : false;
    if (bepinexInstalled && !filesSignalMelonLoader(files)) {
        return Bluebird.resolve({ supported: filesIncludeModFile, requiredFiles: [] });
    }

    return Bluebird.resolve({ supported: false, requiredFiles: [] });
}

/**
 * Detects whether a list of files appears to target MelonLoader.
 *
 * Uses a small marker file name or presence of the loader name in paths.
 *
 * @param files - Files to inspect.
 * @returns True if MelonLoader markers are present; otherwise false.
 */
function filesSignalMelonLoader(files: string[]) {
    return (files.some(file => path.basename(file).toLowerCase() === MELON_LOADER.detectorFile)) ||
        (files.some(file => file.toLowerCase().includes(MELON_LOADER.name.toLowerCase())));
}

/**
 * Detects whether a list of files appears to target BepInEx.
 *
 * Uses a small marker file name or presence of the loader name in paths.
 *
 * @param files - Files to inspect.
 * @returns True if BepInEx markers are present; otherwise false.
 */
function filesSignalBepInEx(files: string[]) {
    return (files.some(file => path.basename(file).toLowerCase() === BEPINEX.detectorFile)) ||
        (files.some(file => file.toLowerCase().includes(BEPINEX.name.toLowerCase())));
}

/**
 * Installer implementation for old-engine VS Mod Loader mods.
 *
 * Normalizes paths into the expected old-engine structure and emits
 * copy instructions for Vortex.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 * @function
 */
const installContentOldEngine: InstallFunc = (files) => {
    const preparedFiles = prepareFilesOldEngine(files);
    const instructions: IInstruction[] = preparedFiles.map(file => ({
        type: 'copy',
        source: file.source,
        destination: file.destination,
    }));

    return Bluebird.resolve({ instructions });
};

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
function prepareFilesOldEngine(files: string[]) {
    const preparedFiles = [];
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

    for (let file of files) {
        file = file.replaceAll('\\', '/');
        if (file.endsWith('/')) {
            continue;
        }
        preparedFiles.push({ source: file, destination: `${modPathPre}${file}` });
    }

    let logString = '';
    for (const file of preparedFiles) {
        logString += `(source:${file.source}|destination:${file.destination})`;
    }
    log('info', `[old-e] prepared files:"${logString}"`);

    return preparedFiles;
}

/**
 * Installer implementation for new-engine MelonLoader mods.
 *
 * When a special `_keepstructure` marker is present, the original archive
 * folder structure is preserved. Otherwise, DLLs are placed into MelonLoader's
 * mods directory and CFG files into its UserData directory.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 * @function
 */
const installContentNewEngineMelonLoader: InstallFunc = (files) => {
    const keepStructure = files.some(file => path.basename(file).toLowerCase() === MELON_LOADER.keepStructureFile);

    // Strip directories and the keep-structure marker
    const filtered = files.filter(file =>
        !file.endsWith(path.sep) &&
        path.basename(file).toLowerCase() !== MELON_LOADER.keepStructureFile
    );

    let instructions: IInstruction[] = [];

    if (keepStructure) {
        instructions = filtered.map(file => ({
            type: 'copy',
            source: file,
            destination: file, // keep structure from archive
        }));
    } else {
        // Don't keep structure: only place relevant files in the proper folders
        const dllFiles = filtered.filter(file => path.extname(file).toLowerCase() === MELON_LOADER.modFile);
        const cfgFiles = filtered.filter(file => path.extname(file).toLowerCase() === MELON_LOADER.userDataFile);

        const dllInstructions: IInstruction[] = dllFiles.map(file => ({
            type: 'copy',
            source: file,
            destination: path.join(MELON_LOADER.modDir, path.basename(file)),
        }));

        const cfgInstructions: IInstruction[] = cfgFiles.map(file => ({
            type: 'copy',
            source: file,
            destination: path.join(MELON_LOADER.userDataDir, path.basename(file)),
        }));

        instructions = [...dllInstructions, ...cfgInstructions];
    }

    return Bluebird.resolve({ instructions });
};

/**
 * Installer implementation for new-engine BepInEx mods.
 *
 * When a special `_keepstructure` marker is present, the original archive
 * folder structure is preserved. Otherwise, DLLs are placed into BepInEx's
 * plugins directory.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 * @function
 */
const installContentNewEngineBepInEx: InstallFunc = (files) => {
    const keepStructure = files.some(file => path.basename(file).toLowerCase() === BEPINEX.keepStructureFile);

    // Strip directories and the keep-structure marker
    const filtered = files.filter(file =>
        !file.endsWith(path.sep) &&
        path.basename(file).toLowerCase() !== BEPINEX.keepStructureFile,
    );

    let instructions: IInstruction[] = [];

    if (keepStructure) {
        instructions = filtered.map(file => ({
            type: 'copy',
            source: file,
            destination: file, // keep structure from archive
        }));
    } else {
        // Don't keep structure: only place relevant files in the proper folders
        const dllFiles = filtered.filter(file => path.extname(file).toLowerCase() === BEPINEX.modFile);

        const dllInstructions: IInstruction[] = dllFiles.map(file => ({
            type: 'copy',
            source: file,
            destination: path.join(BEPINEX.modDir, path.basename(file)),
        }));

        instructions = dllInstructions;
    }

    return Bluebird.resolve({ instructions });
};
//#endregion

// -------------------------------------
//#region Custom Functions
// -------------------------------------

/**
 * Handles the `did-install-mod` event from Vortex.
 *
 * On the old engine, attempts to locate the main VS Mod Loader mod file and
 * apply a small patch to its `getMods` implementation so that Vortex-managed
 * folders do not cause issues. On the new engine no changes are made.
 * Vortex emits the event for every game, so mods of other games are ignored.
 *
 * @param api - Vortex extension API.
 * @param gameId - ID of the game the mod was installed for.
 * @param modId - ID of the installed mod.
 */
async function onDidInstallMod(api: IExtensionApi, gameId: string, modId: string) {
    if (gameId !== GAME.id) {
        return;
    }

    const state = api.getState();
    const installPath = selectors.installPathForGame(state, gameId);
    const mod = state.persistent.mods?.[gameId]?.[modId];
    if (!installPath || !mod?.installationPath) {
        return;
    }

    const isNewEngine = await checkEngineVersionAsync(getDiscovery(api));
    if (isNewEngine) {
        return;
    }

    log('info', `[old-e] fixing old mod:"${modId}" on path:"${mod.installationPath}"`);
    const mainModPath = await findMainModFile(path.join(installPath, mod.installationPath));
    if (mainModPath) {
        const success = fixGetMods(mainModPath);
        if (success) {
            log('info', `[old-e] fixed old mod:"${modId}"`);
            api.sendNotification?.({
                id: `fix_success_${modId}`,
                type: 'info',
                title: 'Fixed Mod',
                message: `Successfully fixed Mod: "${modId}"`,
            });
        }
    }
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
async function findMainModFile(modPath: string) {
    try {
        const modsFolderPath = await findModsFolder(modPath);
        if (!modsFolderPath) {
            return;
        }
        const files = fs.readdirSync(modsFolderPath);
        let dirname;
        for (const file of files) {
            const filePath = path.join(modsFolderPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                dirname = path.basename(filePath);
                const fileName = dirname + '.js';
                const targetFilePath = path.join(filePath, fileName);
                let exists: string | undefined;
                try {
                    const stats = await fs.statAsync(targetFilePath);
                    if (stats.isFile()) {
                        exists = targetFilePath;
                    }
                } catch { }
                if (exists) {
                    return targetFilePath;
                } else {
                    return;
                }
            }
        }
    } catch {
        return;
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
        const files = await fs.readdirAsync(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = await fs.statAsync(filePath);
            if (stats.isDirectory()) {
                if (file === 'mods') {
                    return filePath;
                } else {
                    const modsFolderPath = await findModsFolder(filePath);
                    if (modsFolderPath) {
                        return modsFolderPath;
                    }
                }
            }
        }
        return;
    } catch {
        return;
    }
}

/**
 * Patches a VS Mod Loader main file to ignore Vortex-managed folders.
 *
 * Locates the `getMods()` function and augments the `readdirSync` call so
 * that it filters out the `__folder_managed_by_vortex` directory.
 *
 * @param filePath - Path to the main mod file to patch.
 * @returns True if the file was successfully patched; otherwise false.
 */
function fixGetMods(filePath: string) {
    try {
        log('info', `[fix-get-mods] filePath:"${filePath}"`);
        let data = fs.readFileSync(filePath, "utf8");

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

        fs.writeFileSync(filePath, modifiedData, "utf8");
        return true;
    } catch (err) {
        log('error', `could not fix mod:"${err}"`);
        return false;
    }
}

/**
 * Detects whether the game is running on the "new engine".
 *
 * Checks for the presence of various Unity crash handler executables
 * (`UnityCrashHandler64.exe`, `UnityCrashHandler32.exe`, `UnityCrashHandler.exe`)
 * to determine whether the new Unity-based engine is present.
 *
 * @param discovery - The game discovery result from Vortex, if the game has been discovered.
 * @returns A promise resolving to true for the new engine, false for the old engine or an undiscovered game.
 */
async function checkEngineVersionAsync(discovery?: IDiscoveryResult) {
    if (!discovery?.path) {
        return false;
    }

    const enginePath64 = path.join(discovery.path, 'UnityCrashHandler64.exe');
    const exists64 = await fileExistsAsync(enginePath64);
    if (exists64) {
        return true;
    }

    const enginePath32 = path.join(discovery.path, 'UnityCrashHandler32.exe');
    const exists32 = await fileExistsAsync(enginePath32);
    if (exists32) {
        return true;
    }

    const enginePath = path.join(discovery.path, 'UnityCrashHandler.exe');
    const exists = await fileExistsAsync(enginePath);
    if (exists) {
        return true;
    }

    return false;
}

/**
 * Helper that checks asynchronously whether a file exists.
 *
 * @param filePath - Absolute path of the file to check.
 * @returns A promise resolving to true if the file exists, false otherwise.
 */
async function fileExistsAsync(filePath: string) {
    try {
        await fs.statAsync(filePath);
        return true;
    } catch {
        return false;
    }
}
//#endregion

// -------------------------------------
//#region Utility functions
// -------------------------------------

/**
 * Ensures that a directory exists and is writable, otherwise warns the user.
 *
 * If the directory is not writable, an error is logged and a Vortex notification
 * is shown describing the problem and offering to open the folder.
 *
 * @param api - Vortex extension API.
 * @param absPath - Absolute path of the directory to check.
 * @returns A promise resolving to true if the directory is writable, false otherwise.
 */
async function ensureWritableDirOrWarn(api: IExtensionApi, absPath: string) {
    try {
        await fs.ensureDirWritableAsync(absPath);
        return true;
    } catch (err: any) {
        log('error', `Directory "${absPath}" is not writable: ${err}`);
        api.sendNotification?.({
            id: 'vs-support-writable-warning',
            type: 'warning',
            title: 'Directory Permissions Warning',
            message: `Directory "${absPath}" is not writable. Please ensure you have the necessary permissions to write to this directory.`,
            actions: [
                apiMakeOpenUrlFunction('Open folder', absPath),
            ],
        });
        return false;
    }
}

/**
 * Creates a Vortex notification action that opens a URL using `util.opn`.
 *
 * @param title - Display title of the action button.
 * @param url - URL to open when the action is invoked.
 * @returns A notification action descriptor.
 */
function apiMakeOpenUrlFunction(title: string, url: string) {
    return {
        title,
        action: () => util.opn(url).catch(() => undefined),
    };
}

/**
 * Creates a Vortex notification action that re-checks a condition and
 * dismisses a notification if the condition is now satisfied.
 *
 * Typically used to allow the user to click "Check again" after installing
 * a mod loader manually.
 *
 * @param title - Display title of the action button.
 * @param notificationId - ID of the notification to potentially dismiss.
 * @param api - Vortex extension API.
 * @param checkFunction - Function that returns true when the condition is satisfied.
 * @returns A notification action descriptor.
 */
function apiMakeCheckAndDismissFunction(title: string, notificationId: string, api: IExtensionApi, checkFunction: () => boolean) {
    return {
        title,
        action: () => apiCheckAndDismissFunction(notificationId, api, checkFunction),
    };
}

/**
 * Checks a condition and dismisses the specified notification if it holds.
 *
 * @param notificationId - ID of the notification to dismiss.
 * @param api - Vortex extension API.
 * @param checkFunction - Condition function; if it returns true, the notification is dismissed.
 */
function apiCheckAndDismissFunction(notificationId: string, api: IExtensionApi, checkFunction: () => boolean) {
    if (checkFunction()) {
        api.dismissNotification?.(notificationId);
    }
}
//#endregion

// export only for typedoc
export {
    // Register / setup
    main,
    findGame,
    getDiscovery,
    prepareForModding,
    prepareForModdingOldEngine,
    checkForVSModLoader,
    prepareForModdingNewEngine,

    // Mod loader detection
    anyModLoaderInstalled,
    isMelonLoaderInstalled,
    isBepInExInstalled,

    // Installers & helpers
    testSupportedContentOldEngine,
    testSupportedContentNewEngineMelonLoader,
    testSupportedContentNewEngineBepInEx,
    filesSignalMelonLoader,
    filesSignalBepInEx,
    installContentOldEngine,
    prepareFilesOldEngine,
    installContentNewEngineMelonLoader,
    installContentNewEngineBepInEx,

    // Post-install fixup
    onDidInstallMod,
    findMainModFile,
    findModsFolder,
    fixGetMods,

    // Engine / filesystem helpers
    checkEngineVersionAsync,
    fileExistsAsync,

    // Utility functions
    ensureWritableDirOrWarn,
    apiMakeOpenUrlFunction,
    apiMakeCheckAndDismissFunction,
    apiCheckAndDismissFunction,
};

export default main;
