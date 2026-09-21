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

/**
 * Marker files mod authors add to an archive to control its installation.
 * They are a public contract: never rename them or change what they do.
 */
export const MARKERS = {
    /** Routes the archive to MelonLoader. */
    melonLoader: '_melonloader',
    /** Routes the archive to BepInEx. */
    bepInEx: '_bepinex',
    /** Installs the archive's folder layout as-is, relative to the game folder. */
    keepStructure: '_keepstructure',
};

/** MelonLoader, the recommended mod loader for the new (Unity IL2CPP) engine. */
export const MELON_LOADER = {
    name: 'MelonLoader',
    modFile: DLL_EXTENSION,
    userDataFile: '.cfg',
    modDir: 'Mods',
    userDataDir: 'UserData',
    detectionFiles: [
        path.join('MelonLoader', 'net6', 'MelonLoader.dll'),
        path.join('MelonLoader', 'net35', 'MelonLoader.dll'),
        path.join('MelonLoader', 'MelonLoader.dll'),
    ],
    downloadPage: 'https://github.com/LavaGang/MelonLoader/releases/latest',
};

/** BepInEx, a mod loader for the new engine; Vampire Survivors needs the IL2CPP build of BepInEx 6. */
export const BEPINEX = {
    name: 'BepInEx',
    modFile: DLL_EXTENSION,
    modDir: path.join('BepInEx', 'plugins'),
    detectionFiles: [
        path.join('BepInEx', 'core', 'BepInEx.Unity.IL2CPP.dll'),
        path.join('BepInEx', 'core', 'BepInEx.Core.dll'),
    ],
    legacyDetectionFiles: [
        path.join('BepInEx', 'core', 'BepInEx.dll'),
    ],
    downloadPage: 'https://github.com/BepInEx/BepInEx/releases',
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

/** Mod types used for Vampire Survivors mods. */
export const MOD_TYPES = {
    /** Registered by this extension: deploys to the game folder and is never assigned automatically. Public id. */
    gameRoot: 'vs-root',
    /** Registered by Vortex's BepInEx extension: deploys to `BepInEx/plugins`. */
    bepInExPlugin: 'bepinex-plugin',
    /** Registered by Vortex's BepInEx extension for the BepInEx package itself. */
    bepInExInjector: 'bepinex-injector',
};

/** Priority of the `vs-root` mod type; it never matches automatically, so it only has to come after the BepInEx types. */
export const GAME_ROOT_MOD_TYPE_PRIORITY = 100;

/** Mod attribute marking the MelonLoader package when it was installed through Vortex. */
export const LOADER_PACKAGE_ATTRIBUTE = {
    key: 'vsLoaderPackage',
    melonLoader: 'melonloader',
};

/** Installer ids and priorities; Vortex queries lower priorities first. */
export const INSTALLERS = {
    melonLoaderPackage: { id: 'vs-melonloader-pack', priority: 5 },
    marked: { id: 'vs-marker', priority: 6 },
    oldEngine: { id: 'vs-oldengine-mod', priority: 10 },
    bepInEx: { id: 'vs-newengine-bepinex-mod', priority: 20 },
    melonLoader: { id: 'vs-newengine-melonloader-mod', priority: 30 },
};

/** `info.json` name of the extension's 2.2.x version, which had no id. */
export const LEGACY_EXTENSION_NAME = 'Vampire Survivors Support';

/** Ids of the notifications this extension sends or dismisses. */
export const NOTIFICATION_IDS = {
    vsModLoaderMissing: 'vs-modloader-missing',
    modLoaderMissing: 'ml-or-bix-missing',
    bothModLoaders: 'ml-and-bix-both',
    legacyBepInEx: 'vs-bepinex5-installed',
    directoryNotWritable: 'vs-support-writable-warning',
    fixedModPrefix: 'fix_success_',
    oldModOnNewEngine: 'vs-engine-mismatch-old-on-new',
    newModOnOldEngine: 'vs-engine-mismatch-new-on-old',
    legacyExtension: 'vs-legacy-extension-installed',
    /** Sent by Vortex's BepInEx extension on every activation of a game registered with it. */
    bepInExExtensionNotice: `bepis_injector${GAME.id}`,
};
