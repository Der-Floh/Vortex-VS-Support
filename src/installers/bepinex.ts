import * as path from 'path';
import Bluebird from 'bluebird';
import { types } from 'vortex-api';
import { contentFiles, hasExtension, inspectArchive, isNewEngineMod } from '../archive/inspection';
import { chooseLoader } from '../archive/routing';
import { BEPINEX, GAME, MOD_TYPES } from '../common/constants';
import { detectLoaders } from '../detection/loaders';
import { isBepInExPluginModTypeAvailable } from '../integrations/bepinexExtension';
import { copyInstruction, setModTypeInstruction } from './instructions';

/**
 * Test function for new-engine BepInEx mods without marker files.
 *
 * Supports Vampire Survivors archives that contain a `.dll` file and are
 * routed to BepInEx (see {@link chooseLoader}). The BepInEx package itself is
 * left to Vortex's BepInEx extension.
 *
 * @param files - List of files contained in the archive.
 * @param gameId - ID of the game the archive is being installed for.
 * @param api - Vortex extension API, used to detect the installed loaders.
 * @returns A promise resolving to the support state and required files.
 */
export function testSupportedContentNewEngineBepInEx(files: string[], gameId: string, api: types.IExtensionApi): Bluebird<types.ISupportedResult> {
    const archive = inspectArchive(files);
    const supported = gameId === GAME.id && isNewEngineMod(archive) && chooseLoader(archive, detectLoaders(api)) === 'bepinex';
    return Bluebird.resolve({ supported, requiredFiles: [] });
}

/**
 * Installer implementation for new-engine BepInEx mods.
 *
 * @param files - Files contained in the archive.
 * @returns A promise resolving to installer instructions.
 */
export const installContentNewEngineBepInEx: types.InstallFunc = (files) =>
    Bluebird.resolve({ instructions: bepInExInstructions(files) });

/**
 * Builds the instructions for a BepInEx plugin: `.dll` files go flat into
 * `BepInEx/plugins`, everything else is skipped. With Vortex's BepInEx
 * extension this uses its `bepinex-plugin` mod type; if that extension is
 * disabled, the files go to `BepInEx/plugins` relative to the game folder.
 *
 * @param files - Files contained in the archive.
 * @returns The installer instructions.
 */
export function bepInExInstructions(files: string[]): types.IInstruction[] {
    const dllFiles = contentFiles(files).filter(file => hasExtension(file, BEPINEX.modFile));
    if (isBepInExPluginModTypeAvailable()) {
        return [
            ...dllFiles.map(file => copyInstruction(file, path.basename(file))),
            setModTypeInstruction(MOD_TYPES.bepInExPlugin),
        ];
    }
    return [
        ...dllFiles.map(file => copyInstruction(file, path.join(BEPINEX.modDir, path.basename(file)))),
        setModTypeInstruction(MOD_TYPES.gameRoot),
    ];
}
