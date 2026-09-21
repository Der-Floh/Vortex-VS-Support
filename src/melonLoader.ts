import * as path from 'path';
import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { chooseLoader, contentFiles, findPackageRoot, hasExtension, inspectArchive, isNewEngineMod } from './archive';
import { GAME, LOADER_PACKAGE_ATTRIBUTE, MELON_LOADER, MOD_TYPES } from './constants';
import { detectLoaders } from './detection';
import { attributeInstruction, copyInstruction, setModTypeInstruction } from './instructions';

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

/**
 * Test function for the MelonLoader package itself.
 *
 * It runs before Vortex's BepInEx extension, whose injector installer would
 * otherwise claim MelonLoader because both bundle the same libraries.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @returns A promise resolving to the support state and required files.
 */
export const testSupportedMelonLoaderPackage: types.TestSupported = (files, gameId) =>
    Bluebird.resolve({ supported: gameId === GAME.id && inspectArchive(files).melonLoaderPackage, requiredFiles: [] });

/**
 * Installer implementation for the MelonLoader package: installs it as-is into
 * the game folder, without the folder it may have been packed in, and marks the
 * mod so that routing counts MelonLoader as installed before it is deployed.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installMelonLoaderPackage: types.InstallFunc = (files) => {
    const root = findPackageRoot(files, MELON_LOADER.detectionFiles) ?? '';
    const instructions = contentFiles(files)
        .filter(file => file.startsWith(root))
        .map(file => copyInstruction(file, file.slice(root.length)));
    return Bluebird.resolve({
        instructions: [
            ...instructions,
            setModTypeInstruction(MOD_TYPES.gameRoot),
            attributeInstruction(LOADER_PACKAGE_ATTRIBUTE.key, LOADER_PACKAGE_ATTRIBUTE.melonLoader),
        ],
    });
};
