import * as path from 'path';
import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { contentFiles, hasExtension, inspectArchive, isNewEngineMod } from '../archive/inspection';
import { chooseLoader } from '../archive/routing';
import { GAME, MELON_LOADER, MOD_TYPES } from '../common/constants';
import { detectLoaders } from '../detection/loaders';
import { copyInstruction, setModTypeInstruction } from './instructions';

/**
 * Test function for new-engine MelonLoader mods without marker files.
 *
 * Supports Vampire Survivors archives that contain a `.dll` file and are
 * routed to MelonLoader (see {@link chooseLoader}); MelonLoader is the default.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @param api - Vortex extension API, used to detect the installed loaders.
 * @returns A promise resolving to the support state and required files.
 */
export function testSupportedContentNewEngineMelonLoader(files: string[], gameId: string, api: types.IExtensionApi): Bluebird<types.ISupportedResult> {
    const archive = inspectArchive(files);
    const supported = gameId === GAME.id && isNewEngineMod(archive) && chooseLoader(archive, detectLoaders(api)) === 'melonloader';
    return Bluebird.resolve({ supported, requiredFiles: [] });
}

/**
 * Installer implementation for new-engine MelonLoader mods.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installContentNewEngineMelonLoader: types.InstallFunc = (files) =>
    Bluebird.resolve({ instructions: melonLoaderInstructions(files) });

/**
 * Builds the instructions for a MelonLoader mod: `.dll` files go flat into
 * `Mods/`, `.cfg` files flat into `UserData/`, everything else is skipped.
 * The mod gets the game-root mod type so Vortex doesn't assign a BepInEx type.
 *
 * @param files - Files contained in the archive.
 * @returns The installer instructions.
 */
export function melonLoaderInstructions(files: string[]): types.IInstruction[] {
    const content = contentFiles(files);
    return [
        ...content
            .filter(file => hasExtension(file, MELON_LOADER.modFile))
            .map(file => copyInstruction(file, path.join(MELON_LOADER.modDir, path.basename(file)))),
        ...content
            .filter(file => hasExtension(file, MELON_LOADER.userDataFile))
            .map(file => copyInstruction(file, path.join(MELON_LOADER.userDataDir, path.basename(file)))),
        setModTypeInstruction(MOD_TYPES.gameRoot),
    ];
}
