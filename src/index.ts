import Bluebird from 'bluebird';
import { log, types } from 'vortex-api';
import { installContentNewEngineBepInEx, testSupportedContentNewEngineBepInEx } from './bepinex';
import { GAME, INSTALLERS } from './constants';
import { findGame, prepareForModding } from './game';
import { installContentNewEngineMelonLoader, testSupportedContentNewEngineMelonLoader } from './melonLoader';
import { installContentOldEngine, testSupportedContentOldEngine } from './oldEngine';
import { onDidInstallMod } from './postInstall';

/**
 * Vortex extension entry point for Vampire Survivors.
 *
 * Registers the game, sets up mod installers for the different engines / mod
 * loaders (VS Mod Loader, MelonLoader, BepInEx), and hooks into relevant
 * events such as `did-install-mod`.
 *
 * Vortex also calls this with a stub context while it installs or updates the
 * extension, so `context.api` may only be used inside callbacks and `once`.
 *
 * @param context - Vortex extension context supplied by the host.
 * @returns True if the extension initialized successfully.
 */
function main(context: types.IExtensionContext): boolean {
    context.registerGame({
        id: GAME.id,
        name: GAME.name,
        mergeMods: true,
        queryPath: () => Bluebird.resolve(findGame()),
        supportedTools: [],
        queryModPath: () => '.',
        logo: GAME.logo,
        executable: () => GAME.exe,
        requiredFiles: GAME.requiredFiles,
        setup: (discovery) => Bluebird.resolve(prepareForModding(discovery, context.api)),
        environment: { SteamAPPId: GAME.steamAppId },
        details: { steamAppId: GAME.steamAppId },
    });

    context.registerInstaller(INSTALLERS.melonLoader.id, INSTALLERS.melonLoader.priority,
        (files, gameId) => testSupportedContentNewEngineMelonLoader(files, gameId, context.api), installContentNewEngineMelonLoader);
    context.registerInstaller(INSTALLERS.bepInEx.id, INSTALLERS.bepInEx.priority,
        (files, gameId) => testSupportedContentNewEngineBepInEx(files, gameId, context.api), installContentNewEngineBepInEx);
    context.registerInstaller(INSTALLERS.oldEngine.id, INSTALLERS.oldEngine.priority,
        testSupportedContentOldEngine, installContentOldEngine);

    context.once(() => {
        context.api.events.on('did-install-mod', (gameId: string, _archiveId: string, modId: string) =>
            onDidInstallMod(context.api, gameId, modId).catch(err => log('error', `[did-install-mod] ${err}`)));
    });

    return true;
}

export default main;
