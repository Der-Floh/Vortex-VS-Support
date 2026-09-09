const winapi = require('winapi-bindings');
const { fs, util, log } = require('vortex-api');
const vortex_api = require('vortex-api');
const path = require('path');

const GAME = {
  id: 'vampiresurvivors',
  name: 'Vampire Survivors',
  logo: 'gameart.jpg',
  exe: 'VampireSurvivors.exe',
  steamId: '1794680'
};

const VS_MOD_LOADER = {
  name: 'VS Mod Loader',
  url: 'https://www.nexusmods.com/vampiresurvivors/mods/64',
  path: 'resources/app/.webpack/renderer/mod_loader',
  mainFile: 'index.js'
};
const MELON_LOADER = {
  name: 'MelonLoader',
  url: 'https://github.com/LavaGang/MelonLoader/releases/latest',
  path: 'MelonLoader',
  mainFile: 'MelonLoader.xml'
};

const NEW_EXTS = [
  { extension: '.dll', destination: 'Mods' },
  { extension: '.ttf', destination: 'UserData' },
  { extension: '.json', destination: 'UserData' },
  { extension: '.xml', destination: 'UserData' },
  { extension: '.cfg', destination: 'UserData' }
];
const OLD_EXTS = [
  { extension: '.js', destination: '' }
];
const OLD_HIER = [
  'resources/app/.webpack/renderer/mod_loader/mods',
  'resources/app/.webpack/renderer/assets',
  'resources/app/.webpack/renderer/main.bundle.js'
];

let CONTEXT_API;

/**
 * Registers the game with the provided context.
 * @param {Object} context - The modding context object.
 */
function registerGame(context) {
  CONTEXT_API = context.api;
  context.registerGame({
    id: GAME.id,
    name: GAME.name,
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '',
    logo: GAME.logo,
    executable: () => GAME.exe,
    requiredFiles: [GAME.exe],
    setup: prepareForModding,
    environment: { SteamAPPId: GAME.steamId },
    details: { steamAppId: GAME.steamId },
  });
}

/**
 * Registers the installers for the module.
 * @param {Object} context - The modding context object.
 */
function registerInstallers(context) {
  context.registerInstaller('vampiresurvivors-oldengine-mod', 25, testSupportedContentOldEngine, installContentOldEngine);
  context.registerInstaller('vampiresurvivors-newengine-mod', 25, testSupportedContentNewEngine, installContentNewEngine);
}

/**
 * Sets up event listeners for the module.
 * @param {Object} context - The modding context object.
 */
function setupEventListeners(context) {
  context.api.events.on('did-install-mod', async (gameId, archiveId, modId) => await onDidInstallMod(gameId, archiveId, modId, context));
}

/**
 * The main function of the module.
 * @param {Object} context - The modding context object.
 * @returns {boolean} - Returns true if the function executed successfully.
 */
function main(context) {
  registerGame(context);
  registerInstallers(context);
  setupEventListeners(context);
  return true;
}

/**
 * Finds the game path for the specified Steam app ID.
 * @returns {Promise<string>} The game path.
 * @throws {Error} If the game installation path is not found.
 */
async function findGame() {
  try {
    const game = await util.steam.findByAppId([GAME.steamId]);
    return game.gamePath;
  } catch {
    const registryKey = 'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App ' + GAME.steamId;
    const instPath = winapi.RegGetValue('HKEY_LOCAL_MACHINE', registryKey, 'InstallLocation');
    if (!instPath) {
      log('error', `[find-game] game path not found`);
      throw new Error('Game installation path not found.');
    }
    return instPath.value;
  }
}

/**
 * Gets the current game discovery object from the Vortex state.
 * @returns {Object|undefined} The game discovery object, or undefined if the game is not discovered.
 */
function getDiscovery() {
  return vortex_api.selectors.discoveryByGame(CONTEXT_API.getState(), GAME.id);
}

/**
 * Prepares for modding by checking the engine version and the mod loader.
 * @param {Object} discovery - The game discovery object.
 * @returns {Promise<boolean>} A promise that resolves true if the modding setup is ensured successfully.
 */
async function prepareForModding(discovery) {
  const isNewEngine = await checkEngineVersion(discovery);
  return await ensureModdingSetup(discovery, isNewEngine);
}

/**
 * Checks the engine version by verifying the existence of UnityCrashHandler64.exe file.
 * @param {Object} discovery - The game discovery object containing the path to check.
 * @returns {Promise<boolean>} - A promise that resolves true if the engine version is valid, false otherwise.
 */
async function checkEngineVersion(discovery) {
  if (!discovery?.path)
    return false;
  const enginePath = path.join(discovery.path, 'UnityCrashHandler64.exe');
  try {
    await fs.statAsync(enginePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the modding setup by checking for the existence of the correct mod loader.
 * It checks for either MelonLoader or ModLoader based on the engine version.
 * @param {Object} discovery - The game discovery object containing the path to check.
 * @param {boolean} isNewEngine - Indicates whether the engine version is new or not.
 * @returns {Promise} - A promise that resolves true if the mod loader check was successful.
 * @throws {Error} - If there is an error during the modding setup.
 */
async function ensureModdingSetup(discovery, isNewEngine) {
  try {
    return isNewEngine ? checkForMelonLoader(discovery) : checkForVSModLoader(discovery);
  } catch (error) {
    log('error', '[mod-setup] failed to ensure modding setup:', error);
    throw error;
  }
}

/**
 * Checks for the existence of VS Mod Loader.
 * @param {Object} discovery - The game discovery object containing the path to check.
 * @returns {boolean} - Returns true if VS Mod Loader exists, false otherwise.
 */
async function checkForVSModLoader(discovery) {
  try {
    await fs.ensureDirWritableAsync(path.join(discovery.path, VS_MOD_LOADER.path));
    await fs.statAsync(path.join(discovery.path, VS_MOD_LOADER.path, VS_MOD_LOADER.mainFile));
    return true;
  } catch {
    const vsModLoaderNameId = VS_MOD_LOADER.name.replaceAll(' ', '').toLowerCase();
    log('info', `[check-loader] ${vsModLoaderNameId}-missing`);
    CONTEXT_API.sendNotification({
      id: `${vsModLoaderNameId}-missing`,
      type: 'warning',
      title: `${VS_MOD_LOADER.name} not found`,
      message: `${VS_MOD_LOADER.name} is recommended for modding. When not installed only one Mod at a time can be loaded.`,
      actions: [{ title: `Get ${VS_MOD_LOADER.name}`, action: () => util.opn(VS_MOD_LOADER.url).catch(() => undefined) }],
    });
    return false;
  }
}

/**
 * Checks for the existence of MelonLoader.
 * @param {Object} discovery - The game discovery object containing the path to check.
 * @returns {boolean} - Returns true if MelonLoader exists, false otherwise.
 */
async function checkForMelonLoader(discovery) {
  try {
    await fs.ensureDirWritableAsync(path.join(discovery.path, MELON_LOADER.path));
    await fs.statAsync(path.join(discovery.path, MELON_LOADER.path, MELON_LOADER.mainFile));
    return true;
  } catch {
    const melonLoaderNameId = MELON_LOADER.name.replaceAll(' ', '').toLowerCase();
    log('info', `[check-loader] ${melonLoaderNameId}-missing`);
    CONTEXT_API.sendNotification({
      id: `${melonLoaderNameId}-missing`,
      type: 'warning',
      title: `${MELON_LOADER.name} not found`,
      message: `${MELON_LOADER.name} is necessary for modding. Please install it.`,
      actions: [{ title: `Get ${MELON_LOADER.name}`, action: () => util.opn(MELON_LOADER.url).catch(() => undefined) }],
    });
    return false;
  }
}

/**
 * Checks if the provided files are supported by the old game engine.
 * @param {string[]} files - An array of file paths.
 * @param {string} gameId - The ID of the game.
 * @param {string} modPath - The path of where the mod is being installed.
 * @returns {Promise<{ supported: boolean, requiredFiles: string[] }>} - An object containing the supported state and required files.
 */
async function testSupportedContentOldEngine(files, gameId, modPath) {
  if (gameId !== GAME.id)
    return { supported: false, requiredFiles: [] };
  const isNewEngine = await checkEngineVersion(getDiscovery());
  let supported = files.some(file => OLD_EXTS.some(ext => path.extname(file).toLowerCase() === ext.extension));
  if (supported === false && files.some(file => file.replaceAll('\\', '/').includes('renderer/') || file.replaceAll('\\', '/').includes('assets/')))
    supported = true;
  if (supported && isNewEngine) {
    CONTEXT_API.sendNotification({
      id: `is_new_engine_${(path.parse(path.basename(modPath)).name).toLowerCase()}`,
      type: 'warning',
      title: `Old Mod but New Engine [${path.parse(path.basename(modPath)).name}]`,
      message: 'You are trying to install a Mod for the Old Engine on the New Engine',
    });
  }
  log('info', `[old-e] supported state: ${supported}`);
  return { supported, requiredFiles: [] };
}

/**
 * Checks if the provided files are supported by the new game engine.
 * @param {string[]} files - An array of file paths.
 * @param {string} gameId - The ID of the game.
 * @param {string} modPath - The path of where the mod is being installed.
 * @returns {Promise<{ supported: boolean, requiredFiles: string[] }>} - An object containing the supported state and required files.
 */
async function testSupportedContentNewEngine(files, gameId, modPath) {
  if (gameId !== GAME.id)
    return { supported: false, requiredFiles: [] };
  const isNewEngine = await checkEngineVersion(getDiscovery());
  const supported = files.some(file => NEW_EXTS.some(ext => path.extname(file).toLowerCase() === ext.extension));
  if (supported && !isNewEngine) {
    CONTEXT_API.sendNotification({
      id: `is_old_engine${(path.parse(path.basename(modPath)).name).toLowerCase()}`,
      type: 'warning',
      title: `New Mod but Old Engine [${path.parse(path.basename(modPath)).name}]`,
      message: 'You are trying to install a Mod for the new Engine on the Old Engine',
    });
  }
  log('info', `[new-e] supported state: ${supported}`);
  return { supported, requiredFiles: [] };
}

/**
 * Installs the mod files for the old engine.
 * @param {string[]} files - The files to be installed.
 * @returns {Promise<Object[]>} - An array of objects containing the instructions for copying the files.
 */
async function installContentOldEngine(files) {
  files = prepareFilesOldEngine(files);
  return installContent(files);
}

/**
 * Prepares files for the old engine.
 * @param {string[]} files - The array of files to be prepared.
 * @returns {Object[]} - The array of prepared files, each containing a source and destination path.
 */
function prepareFilesOldEngine(files) {
  const preparedFiles = [];
  log('info', `[old-e] prepare files:"${files}"`);

  let modPathPre = '';
  for (let file of files) {
    file = file.replaceAll('\\', '/');
    const fileComponents = file.split('/');

    for (const hierPath of OLD_HIER) {
      const hierComponents = hierPath.split('/');
      const hierIndex = hierComponents.indexOf(fileComponents[0]);

      if (hierIndex !== -1) {
        modPathPre = hierComponents.slice(0, hierIndex).join('/');
        break;
      }
    }

    if (modPathPre && modPathPre.length !== 0) {
      modPathPre += '/';
      break;
    }
  }

  for (let file of files) {
    file = file.replaceAll('\\', '/');
    if (file.endsWith('/')) continue;
    // const extension = path.extname(file).toLowerCase();
    // const matchingConfig = OLD_EXTS.find(config => config.extension === extension);
    // if (matchingConfig) {
    preparedFiles.push({ source: file, destination: `${modPathPre}${file}` });
    // }
  }

  let logString = '';
  for (const file of preparedFiles) {
    logString += `(source:${file.source}|destination:${file.destination})`;
  }
  log('info', `[old-e] prepared files:"${logString}"`);

  return preparedFiles;
}

/**
 * Installs the mod files for the new engine.
 * @param {string[]} files - The files to be installed.
 * @returns {Promise<Object[]>} - An array of objects containing the instructions for copying the files.
 */
async function installContentNewEngine(files) {
  files = prepareFilesNewEngine(files);
  return installContent(files);
}

/**
 * Prepares files for the new engine.
 * @param {string[]} files - An array of files to be prepared.
 * @returns {Object[]} - An array of prepared files, each containing a source and destination path.
 */
function prepareFilesNewEngine(files) {
  const preparedFiles = [];
  log('info', `[new-e] prepare files:"${files}"`);

  let hasFolder = false;
  for (let file of files) {
    file = file.replace(/\\/g, "/");
    const dirName = path.dirname(file);
    if (dirName !== '.' && dirName !== '') {
      hasFolder = true;
      break;
    }
  }

  for (let file of files) {
    file = file.replace(/\\/g, '/');
    if (file.endsWith('/'))
      continue;
    const dirName = path.dirname(file);
    const extension = path.extname(file).toLowerCase();
    const matchingConfig = NEW_EXTS.find(config => config.extension === extension);
    if (matchingConfig) {
      if (hasFolder === false && (dirName === '.' || dirName === '')) {
        const newFilePath = path.join(matchingConfig.destination, path.basename(file));
        preparedFiles.push({ source: file, destination: newFilePath });
        continue;
      } else {
        preparedFiles.push({ source: file, destination: file });
      }
    }
  }

  let logString = '';
  for (const file of preparedFiles) {
    logString += `{source:${file.source},destination:${file.destination}}`;
  }
  log('info', `[new-e] prepared files:"${logString}"`);

  return preparedFiles;
}

/**
 * Installs mod files by copying files from source to destination.
 * @param {Object[]} files - An array of file objects containing source and destination paths.
 * @returns {Object[]} - An object containing the instructions for copying the files.
 */
async function installContent(files) {
  log('info', `[install] files:"${files.map(file => file.source)}"`);
  const instructions = [];

  for (const file of files) {
    instructions.push({
      type: "copy",
      source: file.source,
      destination: file.destination
    });
  }

  for (const file of instructions) {
    log('info', `[instructions] source:"${file.source}" | destination:"${file.destination}"`);
  }
  return { instructions };
}

/**
 * Handles the event when a mod is installed.
 * When on old engine, it fixes the mod by editing the main mod file, if necessary.
 * @param {string} gameId - The ID of the game.
 * @param {string} archiveId - The ID of the mod archive (unused).
 * @param {string} modId - The ID of the mod.
 * @param {Object} context - The modding context object containing the API and state.
 * @returns {Promise} - A promise that resolves when the function completes.
 */
async function onDidInstallMod(gameId, archiveId, modId, context) {
  if (gameId !== GAME.id)
    return;
  const state = context.api.getState();
  const installPath = vortex_api.selectors.installPathForGame(state, gameId);
  const mod = state.persistent.mods?.[gameId]?.[modId];
  if (!installPath || !mod?.installationPath)
    return;

  const isNewEngine = await checkEngineVersion(getDiscovery());
  if (isNewEngine === true)
    return;

  log('info', `[old-e] fixing old mod:"${modId}" on path:"${mod.installationPath}"`);
  const mainModPath = findMainModFile(path.join(installPath, mod.installationPath));
  if (mainModPath) {
    const success = fixGetMods(mainModPath);
    if (success) {
      log('info', `[old-e] fixed old mod:"${modId}"`);
      context.api.sendNotification({
        id: `fix_success_${modId}`,
        type: 'info',
        title: 'Fixed Mod',
        message: `Successfully fixed Mod: "${modId}"`,
      });
    }
  }
}

/**
 * Fixes a mods getMods function by removing the line that makes it fail (old engine only).
 * @param {string} filePath - The path to the mods main file.
 * @returns {boolean} - Whether the fix was successful or not.
 */
function fixGetMods(filePath) {
  try {
    log('info', `[fix-get-mods] filePath:"${filePath}"`);
    let data = fs.readFileSync(filePath, "utf8");

    const getModsRegex = /getMods\s*\(\)\s*{([\s\S]*?)}/;
    const readdirSyncRegex = /"mods\/"\),\s*{\s*withFileTypes:\s*true\s*}/;

    const getModsMatch = data.match(getModsRegex);
    if (!getModsMatch) return false;

    const readdirSyncMatch = getModsMatch[0].match(readdirSyncRegex);
    if (!readdirSyncMatch) return false;

    const modifiedData = data.replace(readdirSyncRegex, `${readdirSyncMatch[0]}).filter((dir) => dir.name !== "__folder_managed_by_vortex"`);

    fs.writeFileSync(filePath, modifiedData, "utf8");
    return true;
  } catch (err) {
    log('error', `could not fix mod:"${err}"`);
    return false;
  }
}

/**
 * Finds the main mod file in the specified mod path (old engine only).
 * @param {string} modPath - The path to the mod.
 * @returns {string|undefined} - The path to the main mod file, or undefined if not found.
 */
function findMainModFile(modPath) {
  try {
    const modsFolderPath = findModsFolder(modPath);
    const files = fs.readdirSync(modsFolderPath);
    let dirname;
    for (const file of files) {
      const filePath = path.join(modsFolderPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        dirname = path.basename(filePath);
        const fileName = dirname + '.js';
        const targetFilePath = path.join(filePath, fileName);
        const exists = fs.statSync(targetFilePath, (err, stats) => {
          if (!err && stats.isFile()) {
            return targetFilePath;
          } else {
            return;
          }
        });
        if (exists) {
          return targetFilePath;
        } else {
          return;
        }
      }
    }
  } catch {
    return;
  }
}

/**
 * Recursively searches for the "mods" folder within the given folder path (old engine only).
 * @param {string} folderPath - The path of the folder to search in.
 * @returns {string|undefined} - The path of the "mods" folder, or undefined if not found.
 */
function findModsFolder(folderPath) {
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        if (file === 'mods') {
          return filePath;
        } else {
          const modsFolderPath = findModsFolder(filePath);
          if (modsFolderPath) {
            return modsFolderPath;
          }
        }
      }
    }
    return;
  } catch {
    return;
  }
}

module.exports = {
  default: main,
};
