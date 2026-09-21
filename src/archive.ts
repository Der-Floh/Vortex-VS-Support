import * as path from 'path';
import { BEPINEX, DLL_EXTENSION, MELON_LOADER, VS_MOD_LOADER } from './constants';

const MARKER_FILES = [MELON_LOADER.detectorFile, BEPINEX.detectorFile, MELON_LOADER.keepStructureFile];
const OLD_ENGINE_ROOTS = new Set(VS_MOD_LOADER.hier.flatMap(hierPath => hierPath.split('/')));

/** What an archive's file list reveals about the mod inside it. */
export interface ArchiveInfo {
    /** Contains a `.dll` file, which only new-engine mods have. */
    hasDll: boolean;
    /** Contains a `.js` file, which only old-engine mods have. */
    hasJs: boolean;
    /** The marker files the archive contains. */
    markers: {
        melonLoader: boolean;
        bepInEx: boolean;
        keepStructure: boolean;
    };
    /** A path other than a marker file mentions MelonLoader. */
    mentionsMelonLoader: boolean;
    /** A path other than a marker file mentions BepInEx. */
    mentionsBepInEx: boolean;
    /** A top-level entry is part of the old engine's folder layout, so the old-engine path repair can place it. */
    oldEngineLayout: boolean;
}

/**
 * Inspects the file list Vortex passes to installers.
 *
 * @param files - Relative paths inside the archive; directories end with a path separator.
 * @returns What the file list reveals about the mod.
 */
export function inspectArchive(files: string[]): ArchiveInfo {
    const contentFiles = files.filter(file => !isDirectory(file) && !isMarkerFile(file));
    return {
        hasDll: contentFiles.some(file => hasExtension(file, DLL_EXTENSION)),
        hasJs: contentFiles.some(file => hasExtension(file, VS_MOD_LOADER.modFile)),
        markers: {
            melonLoader: hasBasename(files, MELON_LOADER.detectorFile),
            bepInEx: hasBasename(files, BEPINEX.detectorFile),
            keepStructure: hasBasename(files, MELON_LOADER.keepStructureFile),
        },
        mentionsMelonLoader: mentions(contentFiles, MELON_LOADER.name),
        mentionsBepInEx: mentions(contentFiles, BEPINEX.name),
        oldEngineLayout: contentFiles.some(file => OLD_ENGINE_ROOTS.has(file.split(/[\\/]/)[0])),
    };
}

/**
 * Checks whether a file is one of the marker files mod authors add to control
 * the installation (`_melonloader`, `_bepinex`, `_keepstructure`). Marker files
 * are never deployed.
 *
 * @param file - Path of the file inside the archive.
 * @returns True if the file is a marker file; otherwise false.
 */
export function isMarkerFile(file: string): boolean {
    return MARKER_FILES.includes(path.basename(file).toLowerCase());
}

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
    return hasBasename(files, markerFile) || mentions(files, loaderName);
}

/**
 * Checks whether an entry of Vortex's file list is a directory.
 *
 * @param file - Path of the entry inside the archive.
 * @returns True if the entry ends with a path separator; otherwise false.
 */
function isDirectory(file: string): boolean {
    return file.endsWith('/') || file.endsWith('\\');
}

/**
 * Checks a file's extension, ignoring case.
 *
 * @param file - Path of the file.
 * @param extension - Lower-case extension including the dot.
 * @returns True if the file has the extension; otherwise false.
 */
function hasExtension(file: string, extension: string): boolean {
    return path.extname(file).toLowerCase() === extension;
}

/**
 * Checks whether any entry has the given file name, ignoring case.
 *
 * @param files - Paths to check.
 * @param name - Lower-case file name.
 * @returns True if an entry has the name; otherwise false.
 */
function hasBasename(files: string[], name: string): boolean {
    return files.some(file => path.basename(file).toLowerCase() === name);
}

/**
 * Checks whether any path contains a name, ignoring case.
 *
 * @param files - Paths to check.
 * @param name - Name to look for.
 * @returns True if a path contains the name; otherwise false.
 */
function mentions(files: string[], name: string): boolean {
    const lowerCaseName = name.toLowerCase();
    return files.some(file => file.toLowerCase().includes(lowerCaseName));
}
