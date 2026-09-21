import * as path from 'path';
import { BEPINEX, DLL_EXTENSION, MARKERS, MELON_LOADER, VS_MOD_LOADER } from '../common/constants';

const MARKER_FILES = Object.values(MARKERS);
const OLD_ENGINE_ROOTS = new Set(VS_MOD_LOADER.hier.flatMap(hierPath => hierPath.split('/')));

/** What an archive's file list reveals about the mod inside it. */
export interface ArchiveInfo {
    /** Contains at least one file besides marker files. */
    hasContent: boolean;
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
    /** The archive is the MelonLoader package itself. */
    melonLoaderPackage: boolean;
    /** The archive is the BepInEx package itself. */
    bepInExPackage: boolean;
}

/**
 * Inspects the file list Vortex passes to installers.
 *
 * @param files - Relative paths inside the archive; directories end with a path separator.
 * @returns What the file list reveals about the mod.
 */
export function inspectArchive(files: string[]): ArchiveInfo {
    const content = contentFiles(files);
    return {
        hasContent: content.length > 0,
        hasDll: content.some(file => hasExtension(file, DLL_EXTENSION)),
        hasJs: content.some(file => hasExtension(file, VS_MOD_LOADER.modFile)),
        markers: {
            melonLoader: hasBasename(files, MARKERS.melonLoader),
            bepInEx: hasBasename(files, MARKERS.bepInEx),
            keepStructure: hasBasename(files, MARKERS.keepStructure),
        },
        mentionsMelonLoader: mentions(content, MELON_LOADER.name),
        mentionsBepInEx: mentions(content, BEPINEX.name),
        oldEngineLayout: content.some(file => OLD_ENGINE_ROOTS.has(file.split(/[\\/]/)[0])),
        melonLoaderPackage: findPackageRoot(files, MELON_LOADER.detectionFiles) !== undefined,
        bepInExPackage: findPackageRoot(files, [...BEPINEX.detectionFiles, ...BEPINEX.legacyDetectionFiles]) !== undefined,
    };
}

/**
 * Checks whether an archive is a new-engine mod for a loader, as opposed to a
 * loader package: it contains a `.dll` file and isn't MelonLoader or BepInEx itself.
 *
 * @param archive - The inspected archive.
 * @returns True if the archive is a new-engine mod; otherwise false.
 */
export function isNewEngineMod(archive: ArchiveInfo): boolean {
    return archive.hasDll && !archive.melonLoaderPackage && !archive.bepInExPackage;
}

/**
 * Finds the folder a loader package was packed in, by locating one of the
 * loader's detection files.
 *
 * @param files - Files contained in the archive.
 * @param detectionFiles - Paths of the loader's detection files, relative to the game folder.
 * @returns The prefix to strip from the archive's paths (empty or ending with a separator), or undefined if the archive isn't the package.
 */
export function findPackageRoot(files: string[], detectionFiles: string[]): string | undefined {
    for (const file of contentFiles(files)) {
        const normalizedFile = normalizePath(file);
        for (const detectionFile of detectionFiles) {
            const normalizedDetectionFile = normalizePath(detectionFile);
            if (normalizedFile === normalizedDetectionFile || normalizedFile.endsWith(`/${normalizedDetectionFile}`)) {
                return file.slice(0, file.length - detectionFile.length);
            }
        }
    }
    return undefined;
}

/**
 * Lists the files that get installed: every entry except directories and
 * marker files.
 *
 * @param files - Files contained in the archive.
 * @returns The files to install.
 */
export function contentFiles(files: string[]): string[] {
    return files.filter(file => !isDirectory(file) && !isMarkerFile(file));
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
 * Checks a file's extension, ignoring case.
 *
 * @param file - Path of the file.
 * @param extension - Lower-case extension including the dot.
 * @returns True if the file has the extension; otherwise false.
 */
export function hasExtension(file: string, extension: string): boolean {
    return path.extname(file).toLowerCase() === extension;
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

/**
 * Normalizes a path for comparisons: forward slashes, lower case.
 *
 * @param file - Path to normalize.
 * @returns The normalized path, with the same length as the input.
 */
function normalizePath(file: string): string {
    return file.replace(/\\/g, '/').toLowerCase();
}
