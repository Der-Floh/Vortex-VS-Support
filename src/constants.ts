import * as path from 'path';

/** Extension of new-engine mod files, for both MelonLoader and BepInEx. */
export const DLL_EXTENSION = '.dll';

/** Vampire Survivors as registered with Vortex. */
export const GAME = {
    id: 'vampiresurvivors',
    name: 'Vampire Survivors',
    exe: 'VampireSurvivors.exe',
    logo: 'gameart.jpg',
    steamAppId: '1794680',
    requiredFiles: [
        'VampireSurvivors.exe',
    ],
};

/** MelonLoader, a mod loader for the new (Unity) engine. */
export const MELON_LOADER = {
    name: 'MelonLoader',
    modFile: DLL_EXTENSION,
    userDataFile: '.cfg',
    detectorFile: '_melonloader',
    keepStructureFile: '_keepstructure',
    modDir: 'Mods',
    userDataDir: 'UserData',
    requiredFiles: [
        path.join('MelonLoader', 'net6', 'MelonLoader.dll'),
    ],
    downloadPage: 'https://github.com/LavaGang/MelonLoader/releases/latest',
};

/** BepInEx, a mod loader for the new (Unity) engine. */
export const BEPINEX = {
    name: 'BepInEx',
    modFile: DLL_EXTENSION,
    modDir: path.join('BepInEx', 'plugins'),
    detectorFile: '_bepinex',
    keepStructureFile: '_keepstructure',
    requiredFiles: [
        'BepInEx/core/BepInEx.dll',
    ],
};

/** VS Mod Loader by Kekos, the mod loader for the old (Electron) engine. */
export const VS_MOD_LOADER = {
    name: 'VS Mod Loader',
    modFile: '.js',
    modDir: path.join('resources', 'app', '.webpack', 'renderer', 'mod_loader', 'mods'),
    requiredFiles: [
        path.join('resources', 'app', '.webpack', 'renderer', 'mod_loader', 'index.js'),
    ],
    downloadPage: 'https://www.nexusmods.com/vampiresurvivors/mods/64?tab=files',
    hier: [
        'resources/app/.webpack/renderer/mod_loader/mods',
        'resources/app/.webpack/renderer/assets',
        'resources/app/.webpack/renderer/main.bundle.js',
    ],
};

/** Installer ids and priorities; Vortex queries lower priorities first. */
export const INSTALLERS = {
    oldEngine: { id: 'vs-oldengine-mod', priority: 10 },
    bepInEx: { id: 'vs-newengine-bepinex-mod', priority: 20 },
    melonLoader: { id: 'vs-newengine-melonloader-mod', priority: 30 },
};

/** Ids of the notifications this extension sends. */
export const NOTIFICATION_IDS = {
    vsModLoaderMissing: 'vs-modloader-missing',
    modLoaderMissing: 'ml-or-bix-missing',
    bothModLoaders: 'ml-and-bix-both',
    directoryNotWritable: 'vs-support-writable-warning',
    fixedModPrefix: 'fix_success_',
    oldModOnNewEngine: 'vs-engine-mismatch-old-on-new',
    newModOnOldEngine: 'vs-engine-mismatch-new-on-old',
};
