import { ArchiveInfo } from './inspection';

/** A new-engine mod loader. */
export type Loader = 'melonloader' | 'bepinex';

/** Which new-engine mod loaders are installed, on disk or as Vortex mods. */
export interface LoaderPresence {
    melonLoader: boolean;
    bepInEx: boolean;
}

/**
 * Decides which mod loader a new-engine archive is meant for. A marker file
 * wins over a path that mentions a loader, which wins over the loaders that
 * are installed. MelonLoader is the default.
 *
 * @param archive - The inspected archive.
 * @param loaders - The installed mod loaders.
 * @returns The loader to install the archive for.
 */
export function chooseLoader(archive: ArchiveInfo, loaders: LoaderPresence): Loader {
    if (archive.markers.bepInEx !== archive.markers.melonLoader) {
        return archive.markers.bepInEx ? 'bepinex' : 'melonloader';
    }
    if (archive.mentionsBepInEx !== archive.mentionsMelonLoader) {
        return archive.mentionsBepInEx ? 'bepinex' : 'melonloader';
    }
    return loaders.bepInEx && !loaders.melonLoader ? 'bepinex' : 'melonloader';
}
