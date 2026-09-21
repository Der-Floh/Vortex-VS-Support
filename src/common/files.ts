import { fs } from 'vortex-api';

/**
 * Checks asynchronously whether a file exists.
 *
 * @param filePath - Absolute path of the file to check.
 * @returns A promise resolving to true if the file exists, false otherwise.
 */
export async function fileExistsAsync(filePath: string): Promise<boolean> {
    try {
        await fs.statAsync(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks synchronously whether a file exists.
 *
 * @param filePath - Absolute path of the file to check.
 * @returns True if the file exists, false otherwise.
 */
export function fileExistsSync(filePath: string): boolean {
    try {
        fs.statSync(filePath);
        return true;
    } catch {
        return false;
    }
}
