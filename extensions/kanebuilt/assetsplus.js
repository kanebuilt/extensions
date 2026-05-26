// Name: Assets+
// ID: kbAssetsPlus
// Description: Add, remove, and get data from various types of assets, with sprite caching, runtime injection, and browser-persistent saving!
// By: KaneBuilt <https://github.com/kanebuilt>
// Original: LilyMakesThings <https://scratch.mit.edu/users/LilyMakesThings/>
// Original: Mio <https://scratch.mit.edu/users/0znzw/>
// License: LGPL-2.1-only

// Version: 0.1.0

(function (Scratch) {
  'use strict';

  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const Cast = Scratch.Cast;

  const requireNonPackagedRuntime = (blockName) => {
    if (vm.runtime.isPackaged) {
      console.warn(
        `To use the Asset Manager ${blockName} block, the creator of the packaged project must uncheck "Remove raw asset data after loading to save RAM" under advanced settings in the packager.`,
      );
      return false;
    }
    return true;
  };

  // Persistent browser database handlers (IndexedDB)
  const dbName = 'kbAssetsStorage';
  const storeName = 'projects';

  const getDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  };

  const saveToDB = (key, data) => {
    return getDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  };

  const getFromDB = (key) => {
    return getDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  };

  const deleteFromDB = (key) => {
    return getDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  };

  class AssetsPlusExtension {
    constructor() {
      this.cachedSprites = [];
    }

    getInfo() {
      const dataURIOption = Scratch.translate({
        default: 'dataURI',
        description: 'Menu option called dataURI',
      });
      return {
        id: 'kbAssetsPlus',
        color1: '#8157ca',
        name: Scratch.translate('Assets+'),
        blocks: [
          {
            opcode: 'addSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('add sprite from URL [URL]'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
              },
            },
          },
          {
            opcode: 'addCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('add costume from URL [URL] named [NAME]'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1',
              },
            },
          },
          {
            opcode: 'addSound',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('add sound from URL [URL] named [NAME]'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1',
              },
            },
          },
          '---',
          {
            opcode: 'renameSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('rename sprite [TARGET] to [NAME]'),
            arguments: {
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                menu: 'targets',
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1',
              },
            },
          },
          {
            opcode: 'renameCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('rename costume [COSTUME] to [NAME]'),
            arguments: {
              COSTUME: {
                type: Scratch.ArgumentType.COSTUME,
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1',
              },
            },
          },
          {
            opcode: 'renameSound',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('rename sound [SOUND] to [NAME]'),
            arguments: {
              SOUND: {
                type: Scratch.ArgumentType.SOUND,
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1',
              },
            },
          },
          '---',
          {
            opcode: 'deleteSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('delete sprite [TARGET]'),
            arguments: {
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                menu: 'targets',
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1',
              },
            },
          },
          {
            opcode: 'deleteCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('delete costume [COSTUME]'),
            arguments: {
              COSTUME: {
                type: Scratch.ArgumentType.COSTUME,
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'costume1',
              },
            },
          },
          {
            opcode: 'deleteSound',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('delete sound [SOUND]'),
            arguments: {
              SOUND: {
                type: Scratch.ArgumentType.SOUND,
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'sound1',
              },
            },
          },
          '---',
          {
            opcode: 'getAllSprites',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('all sprites'),
          },
          {
            opcode: 'getAllCostumes',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('all costumes'),
          },
          {
            opcode: 'getAllSounds',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('all sounds'),
          },
          {
            // Legacy block
            hideFromPalette: true,
            opcode: 'getSpriteName',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('sprite name'),
          },
          {
            disableMonitor: true,
            opcode: 'getSpriteValue',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('sprite [EXPORT]'),
            arguments: {
              EXPORT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'sprite',
              },
            },
          },
          '---',
          {
            opcode: 'reorderCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('reorder costume # [INDEX1] to index [INDEX2]'),
            arguments: {
              INDEX1: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '1',
              },
              INDEX2: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '2',
              },
            },
          },
          {
            opcode: 'reorderSound',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('reorder sound # [INDEX1] to index [INDEX2]'),
            arguments: {
              INDEX1: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '1',
              },
              INDEX2: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '2',
              },
            },
          },
          '---',
          {
            opcode: 'getSoundData',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('[ATTRIBUTE] of [SOUND]'),
            arguments: {
              ATTRIBUTE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'attribute',
              },
              SOUND: {
                type: Scratch.ArgumentType.SOUND,
              },
            },
          },
          {
            opcode: 'getCostumeData',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('[ATTRIBUTE] of [COSTUME]'),
            arguments: {
              ATTRIBUTE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'attribute',
              },
              COSTUME: {
                type: Scratch.ArgumentType.COSTUME,
              },
            },
          },
          '---',
          {
            opcode: 'getCostumeAtIndex',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('name of costume # [INDEX]'),
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '1',
              },
            },
          },
          {
            opcode: 'getSoundAtIndex',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('name of sound # [INDEX]'),
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: '1',
              },
            },
          },
          '---',
          {
            opcode: 'openProject',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('open project from URL [URL]'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
              },
            },
          },
          // SPRITE CACHING AND RUNTIME INJECTION BLOCKS
          {
            opcode: 'cacheSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('cache sprite [TARGET] to memory'),
            arguments: {
              TARGET: {
                type: Scratch.ArgumentType.STRING,
                menu: 'targets',
              },
            },
          },
          {
            opcode: 'clearSpriteCache',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('clear sprite cache'),
          },
          {
            opcode: 'openProjectWithCache',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('open project from URL [URL] and restore cache'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
              },
            },
          },
          {
            opcode: 'injectAllCachedSprites',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('inject all cached sprites'),
          },
          {
            opcode: 'injectCachedSpriteAtIndex',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('inject cached sprite # [INDEX]'),
            arguments: {
              INDEX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
            },
          },
          '---',
          {
            opcode: 'saveProjectToStorage',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('save current project to browser storage as [KEY]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my-distro-save',
              },
            },
          },
          {
            opcode: 'loadProjectFromStorage',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('load project from browser storage key [KEY]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my-distro-save',
              },
            },
          },
          {
            opcode: 'hasProjectInStorage',
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate('browser storage has project [KEY]?'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my-distro-save',
              },
            },
          },
          {
            opcode: 'deleteProjectFromStorage',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('delete project [KEY] from browser storage'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my-distro-save',
              },
            },
          },
          // LEGACY BLOCKS
          {
            // Legacy block
            hideFromPalette: true,
            opcode: 'getProjectJSON',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('project JSON'),
          },
          {
            disableMonitor: true,
            opcode: 'getProjectValue',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('project [EXPORT]'),
            arguments: {
              EXPORT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'project',
              },
            },
          },
          '---',
          {
            opcode: 'loadExtension',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('load extension from URL [URL]'),
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://extensions.turbowarp.org/Skyhigh173/json.js',
              },
            },
          },
          {
            opcode: 'getLoadedExtensions',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('loaded extensions'),
          },
        ],
        menus: {
          targets: {
            acceptReporters: true,
            items: '_getTargets',
          },
          attribute: {
            acceptReporters: false,
            items: [
              {
                text: Scratch.translate('index'),
                value: 'index',
              },
              {
                text: dataURIOption,
                value: 'dataURI',
              },
              {
                text: Scratch.translate('format'),
                value: 'format',
              },
              {
                text: Scratch.translate('header'),
                value: 'header',
              },
              {
                text: Scratch.translate('asset ID'),
                value: 'asset ID',
              },
            ],
          },
          project: {
            acceptReporters: false,
            items: [
              {
                text: Scratch.translate('JSON'),
                value: 'JSON',
              },
              {
                text: dataURIOption,
                value: 'dataURI',
              },
            ],
          },
          sprite: {
            acceptReporters: false,
            items: [
              {
                text: Scratch.translate('name'),
                value: 'name',
              },
              {
                text: dataURIOption,
                value: 'dataURI',
              },
            ],
          },
        },
      };
    }

    async cacheSprite(args, util) {
      const target = this._getTargetFromMenu(args.TARGET, util);
      if (!target || target.isStage) return;

      try {
        const blob = await Scratch.vm.exportSprite(target.id);
        const buffer = await blob.arrayBuffer();
        this.cachedSprites.push(buffer);
      } catch (e) {
        console.error('Failed to cache sprite', e);
      }
    }

    clearSpriteCache() {
      this.cachedSprites = [];
    }

    async openProjectWithCache(args) {
      const url = Cast.toString(args.URL);
      try {
        const response = await Scratch.fetch(url);
        const buffer = await response.arrayBuffer();
        await vm.loadProject(buffer);

        await this.injectAllCachedSprites();
      } catch (e) {
        console.error('Failed to load project or restore cached sprites', e);
      }
    }

    async injectAllCachedSprites() {
      for (const spriteBuffer of this.cachedSprites) {
        try {
          await vm.addSprite(spriteBuffer);
        } catch (e) {
          console.error('Failed to inject cached sprite:', e);
        }
      }
    }

    async injectCachedSpriteAtIndex(args) {
      const index = Math.round(Cast.toNumber(args.INDEX)) - 1;
      if (index >= 0 && index < this.cachedSprites.length) {
        try {
          await vm.addSprite(this.cachedSprites[index]);
        } catch (e) {
          console.error('Failed to inject cached sprite at index ' + index, e);
        }
      }
    }

    async saveProjectToStorage(args) {
      const key = Cast.toString(args.KEY);
      try {
        const blob = await vm.saveProjectSb3();
        const buffer = await blob.arrayBuffer();
        await saveToDB(key, buffer);
      } catch (e) {
        console.error('Failed to save project state to browser persistent storage:', e);
      }
    }

    async loadProjectFromStorage(args) {
      const key = Cast.toString(args.KEY);
      try {
        const buffer = await getFromDB(key);
        if (buffer) {
          await vm.loadProject(buffer);
        } else {
          console.warn('No persistent project state found for key: ' + key);
        }
      } catch (e) {
        console.error('Failed to load project state from browser persistent storage:', e);
      }
    }

    async hasProjectInStorage(args) {
      const key = Cast.toString(args.KEY);
      try {
        const data = await getFromDB(key);
        return !!data;
      } catch (_e) {
        return false;
      }
    }

    async deleteProjectFromStorage(args) {
      const key = Cast.toString(args.KEY);
      try {
        await deleteFromDB(key);
      } catch (e) {
        console.error('Failed to delete project state from browser persistent storage:', e);
      }
    }

    async addSprite(args) {
      const url = Cast.toString(args.URL);

      const response = await Scratch.fetch(url);
      const json = await response.arrayBuffer();

      try {
        await vm.addSprite(json);
      } catch (e) {
        console.error(e);
      }
    }

    // Thank you PenguinMod for providing this code.
    async addCostume(args, util) {
      const targetId = util.target.id;
      const assetName = Cast.toString(args.NAME);

      const res = await Scratch.fetch(args.URL);
      const blob = await res.blob();

      if (!(this._typeIsBitmap(blob.type) || blob.type === 'image/svg+xml')) {
        console.error(`Invalid MIME type: ${blob.type}`);
        return;
      }
      const assetType = this._typeIsBitmap(blob.type)
        ? runtime.storage.AssetType.ImageBitmap
        : runtime.storage.AssetType.ImageVector;

      const dataType =
        blob.type === 'image/svg+xml'
          ? runtime.storage.DataFormat.SVG
          : runtime.storage.DataFormat.PNG;

      const arrayBuffer = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(new Error(`Failed to read as array buffer: ${fr.error}`));
        fr.readAsArrayBuffer(blob);
      });

      const asset = runtime.storage.createAsset(
        assetType,
        dataType,
        new Uint8Array(arrayBuffer),
        null,
        true,
      );
      const md5ext = `${asset.assetId}.${asset.dataFormat}`;

      try {
        await vm.addCostume(
          md5ext,
          {
            asset,
            md5ext,
            name: assetName,
          },
          targetId,
        );
      } catch (e) {
        console.error(e);
      }
    }

    async addSound(args, util) {
      const targetId = util.target.id;
      const assetName = Cast.toString(args.NAME);

      const res = await Scratch.fetch(args.URL);
      const buffer = await res.arrayBuffer();

      const storage = runtime.storage;
      const asset = storage.createAsset(
        storage.AssetType.Sound,
        storage.DataFormat.MP3,
        new Uint8Array(buffer),
        null,
        true,
      );

      try {
        await vm.addSound(
          {
            asset,
            md5: asset.assetId + '.' + asset.dataFormat,
            name: assetName,
          },
          targetId,
        );
      } catch (e) {
        console.error(e);
      }
    }
    // End of PenguinMod

    renameSprite(args, util) {
      const target = this._getTargetFromMenu(args.TARGET, util);
      if (!target || target.isStage) return;

      const name = Cast.toString(args.NAME);
      target.sprite.name = name;
    }

    renameCostume(args, util) {
      const target = util.target;
      const costumeName = Cast.toString(args.COSTUME);
      const costumeIndex = target.getCostumeIndexByName(costumeName);
      if (costumeIndex < 0) return;

      const name = Cast.toString(args.NAME);
      target.renameCostume(costumeIndex, name);
    }

    renameSound(args, util) {
      const target = util.target;
      const soundName = Cast.toString(args.SOUND);
      const soundIndex = this._getSoundIndexByName(soundName, util);
      if (soundIndex < 0) return;

      const name = Cast.toString(args.NAME);
      target.renameSound(soundIndex, name);
    }

    deleteSprite(args) {
      const target = this._getTargetFromMenu(args.TARGET);
      if (!target || target.isStage) return;

      Scratch.vm.deleteSprite(target.id);
    }

    deleteCostume(args, util) {
      const target = util.target;
      const costumeName = Cast.toString(args.COSTUME);
      const costumeIndex = target.getCostumeIndexByName(costumeName);
      if (costumeIndex < 0) return;

      if (target.sprite.costumes.length > 0) {
        target.deleteCostume(costumeIndex);
      }
    }

    deleteSound(args, util) {
      const target = util.target;
      const soundName = Cast.toString(args.SOUND);
      const soundIndex = this._getSoundIndexByName(soundName, util);
      if (soundIndex < 0) return;

      if (target.sprite.sounds.length > 0) {
        target.deleteSound(soundIndex);
      }
    }

    getAllSprites() {
      const spriteNames = [];
      const targets = Scratch.vm.runtime.targets;
      for (const target of targets) {
        if (target.isOriginal && !target.isStage) {
          spriteNames.push(target.sprite.name);
        }
      }
      return JSON.stringify(spriteNames);
    }

    getAllCostumes(args, util) {
      const costumeNames = [];
      const costumes = util.target.sprite.costumes;
      for (const costume of costumes) {
        costumeNames.push(costume.name);
      }
      return JSON.stringify(costumeNames);
    }

    getAllSounds(args, util) {
      const soundNames = [];
      const sounds = util.target.sprite.sounds;
      for (const sound of sounds) {
        soundNames.push(sound.name);
      }
      return JSON.stringify(soundNames);
    }

    getSpriteName(args, util) {
      return util.target.sprite.name ?? '';
    }

    getSpriteValue(args, util) {
      const option = Cast.toString(args.EXPORT);
      if (option === 'name') {
        return util.target.sprite.name ?? '';
      } else if (option === 'dataURI') {
        try {
          return new Promise((resolve) => {
            Scratch.vm.exportSprite(util.target.id).then((blob) => {
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result);
              fr.onabort = () => {
                throw new Error('Read aborted');
              };
              fr.readAsDataURL(blob);
            });
          });
        } catch (e) {
          console.error('Failed to export the sprite', e);
          return '';
        }
      }
    }

    reorderCostume(args, util) {
      const target = util.target;
      const index1 = Cast.toNumber(args.INDEX1) - 1;
      const index2 = Cast.toNumber(args.INDEX2) - 1;
      const costumes = target.sprite.costumes;

      if (index1 < 0 || index1 >= costumes.length) return;
      if (index2 < 0 || index2 >= costumes.length) return;

      target.reorderCostume(index1, index2);
    }

    reorderSound(args, util) {
      const target = util.target;
      const index1 = Cast.toNumber(args.INDEX1) - 1;
      const index2 = Cast.toNumber(args.INDEX2) - 1;
      const sounds = target.sprite.sounds;

      if (index1 < 0 || index1 >= sounds.length) return;
      if (index2 < 0 || index2 >= sounds.length) return;

      target.reorderSound(index1, index2);
    }

    getCostumeData(args, util) {
      const target = util.target;
      const attribute = Cast.toString(args.ATTRIBUTE);
      const costumeName = Cast.toString(args.COSTUME);
      const costumeIndex = target.getCostumeIndexByName(costumeName);
      if (costumeIndex < 0) return '';

      const costume = target.sprite.costumes[costumeIndex];
      switch (attribute) {
        case 'dataURI':
          if (!requireNonPackagedRuntime('dataURI of costume')) return '';
          return costume.asset.encodeDataURI();
        case 'index':
          return costumeIndex + 1;
        case 'format':
          if (!requireNonPackagedRuntime('format of costume')) return '';
          return costume.asset.assetType.runtimeFormat;
        case 'header':
          if (!requireNonPackagedRuntime('header of costume')) return '';
          return costume.asset.assetType.contentType;
        case 'asset ID':
          if (!requireNonPackagedRuntime('asset ID of costume')) return '';
          return costume.asset.assetId;
        default:
          return '';
      }
    }

    getSoundData(args, util) {
      const target = util.target;
      const attribute = Cast.toString(args.ATTRIBUTE);
      const soundName = Cast.toString(args.SOUND);
      const soundIndex = this._getSoundIndexByName(soundName, util);
      if (soundIndex < 0) return '';

      const sound = target.sprite.sounds[soundIndex];
      switch (attribute) {
        case 'dataURI':
          if (!requireNonPackagedRuntime('dataURI of sound')) return '';
          return sound.asset.encodeDataURI();
        case 'index':
          return soundIndex + 1;
        case 'format':
          if (!requireNonPackagedRuntime('format of sound')) return '';
          return sound.asset.assetType.runtimeFormat;
        case 'header':
          if (!requireNonPackagedRuntime('header of sound')) return '';
          return sound.asset.assetType.contentType;
        case 'asset ID':
          if (!requireNonPackagedRuntime('asset ID of sound')) return '';
          return sound.asset.assetId;
        default:
          return '';
      }
    }

    getCostumeAtIndex(args, util) {
      const target = util.target;
      const index = Math.round(Cast.toNumber(args.INDEX - 1));
      const costumes = target.sprite.costumes;
      if (index < 0 || index >= costumes.length) return '';

      return costumes[index].name;
    }

    getSoundAtIndex(args, util) {
      const target = util.target;
      const index = Math.round(Cast.toNumber(args.INDEX - 1));
      const sounds = target.sprite.sounds;
      if (index < 0 || index >= sounds.length) return '';

      return sounds[index].name;
    }

    openProject(args) {
      const url = Cast.toString(args.URL);
      Scratch.fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buffer) => vm.loadProject(buffer));
    }

    getProjectJSON() {
      return Scratch.vm.toJSON();
    }

    getProjectValue(args) {
      const option = Cast.toString(args.EXPORT);
      if (option === 'JSON') {
        return Scratch.vm.toJSON();
      } else if (option === 'dataURI') {
        try {
          return new Promise((resolve) => {
            vm.saveProjectSb3().then((blob) => {
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result);
              fr.onabort = () => {
                throw new Error('Read aborted');
              };
              fr.readAsDataURL(blob);
            });
          });
        } catch (e) {
          console.error('Failed to export the project', e);
          return '';
        }
      }
    }

    async loadExtension(args) {
      const url = Cast.toString(args.URL);
      if (!(await vm.securityManager.canLoadExtensionFromProject(url))) return;
      await vm.extensionManager.loadExtensionURL(url);
    }

    getLoadedExtensions() {
      return JSON.stringify(Array.from(vm.extensionManager._loadedExtensions.keys()));
    }

    _getSoundIndexByName(soundName, util) {
      const sounds = util.target.sprite.sounds;
      for (let i = 0; i < sounds.length; i++) {
        if (sounds[i].name === soundName) {
          return i;
        }
      }
      return -1;
    }

    _typeIsBitmap(type) {
      return (
        type === 'image/png' ||
        type === 'image/bmp' ||
        type === 'image/jpg' ||
        type === 'image/jpeg' ||
        type === 'image/jfif' ||
        type === 'image/webp' ||
        type === 'image/gif'
      );
    }

    _getTargetFromMenu(targetName, util) {
      let target = Scratch.vm.runtime.getSpriteTargetByName(targetName);
      if (targetName === '_myself_') target = util.target.sprite.clones[0];
      return target;
    }

    _getTargets() {
      const spriteNames = [];
      if (Scratch.vm.editingTarget && !Scratch.vm.editingTarget.isStage) {
        spriteNames.push({
          text: 'myself',
          value: '_myself_',
        });
      }
      const targets = Scratch.vm.runtime.targets;
      for (let index = 1; index < targets.length; index++) {
        const target = targets[index];
        if (target.isOriginal) {
          spriteNames.push(target.getName());
        }
      }
      if (spriteNames.length > 0) {
        return spriteNames;
      } else {
        return [''];
      }
    }
  }
  Scratch.extensions.register(new AssetsPlusExtension());
})(Scratch);
