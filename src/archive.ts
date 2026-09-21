import * as path from 'path';
import { BEPINEX, MELON_LOADER } from './constants';

/**
 * Detects whether an archive appears to target MelonLoader: it contains the
 * `_melonloader` marker file, or a path that mentions MelonLoader.
 *
 * @param files - Files contained in the archive.
 * @returns True if the archive signals MelonLoader; otherwise false.
 */
export function filesSignalMelonLoader(files: string[]): boolean {
    return filesSignalLoader(files, MELON_LOADER.detectorFile, MELON_LOADER.name);
}

/**
 * Detects whether an archive appears to target BepInEx: it contains the
 * `_bepinex` marker file, or a path that mentions BepInEx.
 *
 * @param files - Files contained in the archive.
 * @returns True if the archive signals BepInEx; otherwise false.
 */
export function filesSignalBepInEx(files: string[]): boolean {
    return filesSignalLoader(files, BEPINEX.detectorFile, BEPINEX.name);
}

/**
 * Checks an archive for a loader's marker file (case-insensitive basename) or
 * for the loader's name anywhere in a path (case-insensitive).
 *
 * @param files - Files contained in the archive.
 * @param markerFile - Lower-case name of the loader's marker file.
 * @param loaderName - Name of the loader.
 * @returns True if the archive signals the loader; otherwise false.
 */
function filesSignalLoader(files: string[], markerFile: string, loaderName: string): boolean {
    const lowerCaseName = loaderName.toLowerCase();
    return files.some(file => path.basename(file).toLowerCase() === markerFile || file.toLowerCase().includes(lowerCaseName));
}
