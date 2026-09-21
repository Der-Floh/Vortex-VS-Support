import { types } from 'vortex-api';

/**
 * Creates an instruction that copies a file from the archive into the mod.
 *
 * @param source - Path inside the archive.
 * @param destination - Path relative to the mod type's deployment folder.
 * @returns The copy instruction.
 */
export function copyInstruction(source: string, destination: string): types.IInstruction {
    return { type: 'copy', source, destination };
}

/**
 * Creates an instruction that sets the mod's type, which decides the folder it
 * deploys to and keeps Vortex from assigning a type automatically.
 *
 * @param modType - Id of a registered mod type.
 * @returns The mod type instruction.
 */
export function setModTypeInstruction(modType: string): types.IInstruction {
    return { type: 'setmodtype', value: modType };
}

/**
 * Creates an instruction that sets an attribute on the installed mod.
 *
 * @param key - Attribute name.
 * @param value - Attribute value.
 * @returns The attribute instruction.
 */
export function attributeInstruction(key: string, value: string): types.IInstruction {
    return { type: 'attribute', key, value };
}
