[![Vampire Survivors Support Code Documentation](https://img.shields.io/badge/Vampire_Survivors_Support-Code_Documentation-green.svg)](https://der-floh.github.io/Vampire-Survivors-Support-for-Vortex/)

# Vampire Survivors Support for [Vortex](https://www.nexusmods.com/about/vortex/)

## Description

This extension adds support for Vampire Survivors to [Vortex Mod Manager](https://www.nexusmods.com/about/vortex/), enabling you to easily automate installation of mods for Vampire Survivors without having to worry about where the files are supposed to go, etc.

### At this time following mod types are supported

- Mods that are designed for the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) by Kekos and use the right file structure (e.g resources/app/.webpack/.../img.jpg)
- Other Old Engine mods that use the right file structure (e.g resources/app/.webpack/.../img.jpg). Archives that start further down, for example with `assets/` or `renderer/`, are placed automatically.
- New Engine mods for [MelonLoader](https://github.com/LavaGang/MelonLoader/releases) (e.g Mods/mod.dll)
- New Engine mods for the IL2CPP build of [BepInEx 6](https://github.com/BepInEx/BepInEx/releases) (e.g BepInEx/plugins/mod.dll)

Note that Old Engine mods that change the same file and **DON'T** use the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) overwrite each other, so the VS ModLoader is recommended.
Note that New Engine mods need MelonLoader (recommended) or the IL2CPP build of BepInEx 6. BepInEx 5 can't load mods for the New Engine.

Mods that only contain the changed file, without its folders, still won't work.

## Currently Supported Mods

### Old Engine Supported Mods

- [Simple Rebalance mod](https://www.nexusmods.com/vampiresurvivors/mods/1) (NO VS Mod Loader)
- [NG plus](https://www.nexusmods.com/vampiresurvivors/mods/3) (NO VS Mod Loader)
- [Equal Power-Ups and Passives (0.5.205)](https://www.nexusmods.com/vampiresurvivors/mods/5) (NO VS Mod Loader)
- [Custom Content Bundle Pack](https://www.nexusmods.com/vampiresurvivors/mods/11) (NO VS Mod Loader)
- [Chinese developer tools](https://www.nexusmods.com/vampiresurvivors/mods/16) (NO VS Mod Loader)
- [Exorcismus - Unholy Vespers Skin Mod](https://www.nexusmods.com/vampiresurvivors/mods/17) (NO VS Mod Loader)
- [Remove Cat Sounds](https://www.nexusmods.com/vampiresurvivors/mods/19) (NO VS Mod Loader)
- [Space Mod](https://www.nexusmods.com/vampiresurvivors/mods/22) (NO VS Mod Loader)
- [Cursed Poppea](https://www.nexusmods.com/vampiresurvivors/mods/28) (NO VS Mod Loader)
- [Lucky Egg](https://www.nexusmods.com/vampiresurvivors/mods/30) (NO VS Mod Loader)
- [Level Up stats growth](https://www.nexusmods.com/vampiresurvivors/mods/32) (NO VS Mod Loader)
- [Donald Duck Mod](https://www.nexusmods.com/vampiresurvivors/mods/33) (NO VS Mod Loader)
- [Free Evolutions - no item requirements](https://www.nexusmods.com/vampiresurvivors/mods/35) (NO VS Mod Loader)
- [Pokemon Survivors](https://www.nexusmods.com/vampiresurvivors/mods/36) (NO VS Mod Loader)
- [The Pokemon Survivors Bundle](https://www.nexusmods.com/vampiresurvivors/mods/37) (NO VS Mod Loader)
- [QoL tweaks and gameplay changes](https://www.nexusmods.com/vampiresurvivors/mods/39) (NO VS Mod Loader)
- [Monster Survivors](https://www.nexusmods.com/vampiresurvivors/mods/43) (NO VS Mod Loader)
- [Limit Broken Stats Data](https://www.nexusmods.com/vampiresurvivors/mods/48) (NO VS Mod Loader)
- [Re-add Debug Mode](https://www.nexusmods.com/vampiresurvivors/mods/49) (NO VS Mod Loader)
- [Tekken 3 Chicken Sound Effect](https://www.nexusmods.com/vampiresurvivors/mods/53) (NO VS Mod Loader)
- [Forest A audio to Brodyquest](https://www.nexusmods.com/vampiresurvivors/mods/58) (NO VS Mod Loader)
- [Extended Power Up Levels](https://www.nexusmods.com/vampiresurvivors/mods/60) (NO VS Mod Loader)
- [Vampire Survivors Thai Mod](https://www.nexusmods.com/vampiresurvivors/mods/69) (NO VS Mod Loader)
- [Better Lama Armor](https://www.nexusmods.com/vampiresurvivors/mods/80) (NO VS Mod Loader)
- [Chicken Good and Leeloo Dallas Multipass](https://www.nexusmods.com/vampiresurvivors/mods/81) (NO VS Mod Loader)
- [Multiperpose QoL Mod](https://www.nexusmods.com/vampiresurvivors/mods/50)
- [Extended Power Up Levels](https://www.nexusmods.com/vampiresurvivors/mods/60)
- [Castlevania Survivors](https://www.nexusmods.com/vampiresurvivors/mods/61)
- [Eggs Bulk Buy](https://www.nexusmods.com/vampiresurvivors/mods/63)
- [VS Mod Loader](https://www.nexusmods.com/vampiresurvivors/mods/64)
- [Movement Speed Cap](https://www.nexusmods.com/vampiresurvivors/mods/65)

### New Engine Supported Mods

- [VSTweaks (New Engine)](https://www.nexusmods.com/vampiresurvivors/mods/87)
- [Ultra-Wide Fix (NewEngine)](https://www.nexusmods.com/vampiresurvivors/mods/79)

#### For the full List of supported and not supported Mods see

[Full List for Old Engine](https://github.com/Der-Floh/Vampire-Survivors-Support-for-Vortex/blob/main/support-lists/support-list-old-engine.md)

[Full List for New Engine](https://github.com/Der-Floh/Vampire-Survivors-Support-for-Vortex/blob/main/support-lists/support-list-new-engine.md)

## How to install

This extension requires Vortex. To install, click the Vortex button at the top of the page to open this extension within Vortex, and then click Install. Alternatively, within Vortex, go to the Extensions tab, click "Find More" at the bottom of the tab, search for "Vampire Survivors Support" and then click Install.

You can also manually install it by downloading the main file and dragging it into the "drop zone" labelled "Drop File(s)" in the Extensions tab at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Vampire Survivors mods with Vortex.

### Upgrading from 2.2.x

Version 2.3.0 is installed into a new folder. If you update through Vortex, the old version is removed automatically. If you install 2.3.0 manually, remove the old "Vampire Survivors Support" extension in the Extensions tab and restart Vortex; the extension warns you while both are installed.

## Known Issues

### Old Engine Black Screen

If you encounter a black screen this is most likely because of 2 reasons.

1. You enabled the VS ModLoader but no other mod. If the VS ModLoader is enabled alone it causes a black screen.
2. You're using one of Kekos mods which have some issues with Vortex files because they try to load Vortex files as mods. These issues could also occur on other mods. To fix this you just need to add the following line into the main mod file (typically called `[modname].js`):

#### UPDATE: This now gets fixed automatically by the Extension uppon installing the Mod

`.filter((dir) => dir.name !== "__folder_managed_by_vortex")`

![Kekos-Mod-Error-Previous](https://staticdelivery.nexusmods.com/mods/2295/images/593/593-1716496297-2102395392.png)
![Kekos-Mod-Error-After](https://staticdelivery.nexusmods.com/mods/2295/images/593/593-1716496305-305732697.png)
For the [Multiperpose QoL Mod](https://www.nexusmods.com/vampiresurvivors/mods/50) the file would be `MultipurposeQolMod.js` and for the [Castlevania Survivors](https://www.nexusmods.com/vampiresurvivors/mods/61) Mod it would be `Castlevania.js`

### Empty BepInEx folders (New Engine)

Vortex's built-in BepInEx support creates empty `BepInEx`, `BepInEx/plugins` and `BepInEx/patchers` folders in the game folder whenever Vampire Survivors is opened in Vortex, even if you only use MelonLoader. They're harmless.

### Mods for the other engine

If you install a mod that was made for the other engine (for example an Old Engine mod while the game runs the New Engine), the extension shows a warning, because the mod won't load.

## How to make my Mod compatible with this Extension

### Old Engine

To make your mod compatible you either need to make your mod compatible with the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64), or you use the right file structure for your mod. Note though that if you do the latter, mods that try to change the same file will overwrite yours, so it is recommended to use the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64).

Vampire Survivors is structured like this (most basic representation):

```txt
/Vampire Survivors
|--> VampireSurvivors.exe
  |--> resources
    |--> app
      |--> .webpack
        |--> renderer
          |--> index.html
          |--> main.bundle.js
          |--> mod_loader (only if you installed VS ModLoader)
            |--> mods
              |--> your mod
          |--> assets
            |--> img
            |--> sfx
            |--> tilesets
```

So if you use the VS ModLoader your file structure always looks like this:

```txt
|--> resources
  |--> app
    |--> .webpack
      |--> renderer
        |--> mod_loader
          |--> mods
            |--> [your mod]
```

If you don't use the VS ModLoader your file structure can vary but should always contain every folder before your file until resources is reached. An example for the UI.png file:

```txt
|--> resources
  |--> app
    |--> .webpack
      |--> renderer
        |--> assets
          |--> img
            |--> UI.png
```

If your archive starts further down, the extension adds the missing folders: an archive that starts with `mods`, `assets`, `renderer`, `.webpack` or `app`, or only contains `main.bundle.js`, is placed correctly.

Note that the [VS ModLoader](https://www.nexusmods.com/vampiresurvivors/mods/64) only works if another mod is actually active / installed

### New Engine

Mods for the New Engine are `.dll` files for [MelonLoader](https://github.com/LavaGang/MelonLoader/releases) or for the IL2CPP build of [BepInEx 6](https://github.com/BepInEx/BepInEx/releases).

By default the extension installs only the files the mod loaders need, without their folders:

- MelonLoader: `.dll` files go into `Mods`, `.cfg` files into `UserData`.
- BepInEx: `.dll` files go into `BepInEx/plugins`. Archives whose top-level folder is `plugins`, `config` or `patchers` are placed inside `BepInEx` by Vortex's built-in BepInEx support.

Everything else in the archive is skipped. If your mod needs other files or a specific folder layout, add `_keepstructure` (see below). A typical MelonLoader mod looks like this:

```txt
|--> Mods
  |--> mod1.dll
  |--> mod2.dll
```

#### Which mod loader is used

1. A marker file: `_melonloader` or `_bepinex`.
2. A path in the archive that mentions `MelonLoader` or `BepInEx`.
3. The mod loader that's installed. BepInEx is only chosen if MelonLoader isn't installed.
4. Otherwise MelonLoader.

#### Marker files

Add an empty file with one of these names anywhere in your archive. The names are case-insensitive, and the marker files themselves are never installed.

| File | Effect |
| --- | --- |
| `_melonloader` | Installs the mod for MelonLoader. |
| `_bepinex` | Installs the mod for BepInEx. |
| `_keepstructure` | Installs the archive's folders as they are, relative to the game folder. |

If you have a file for example a font that needs to go in the UserData folder, add `_keepstructure` and use the folders of the game:

```txt
|--> _keepstructure
|--> Mods
  |--> mod1.dll
  |--> mod2.dll
|--> UserData
  |--> font.ttf
```

MelonLoader and BepInEx release zips can also be installed through Vortex like a mod.

[!["Buy me a Floppy Disk"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/der_floh)
