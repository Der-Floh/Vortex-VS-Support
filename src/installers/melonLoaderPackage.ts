import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { contentFiles, findPackageRoot, inspectArchive } from '../archive/inspection';
import { GAME, LOADER_PACKAGE_ATTRIBUTE, MELON_LOADER, MOD_TYPES } from '../common/constants';
import { attributeInstruction, copyInstruction, setModTypeInstruction } from './instructions';

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
