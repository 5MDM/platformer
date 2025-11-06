import { AnimatedSprite, Assets, BindableTexture, Sprite, Spritesheet, SpritesheetData, Texture, TilingSprite } from "pixi.js";
import { _MD2engine } from "./engine";
import { EntityFileInfo, EntityInfo, ItemFileInfo, ModInfo } from "./types";
import { convertPathToObj } from "../misc/util";

export interface _MD2dataManagerOpts {
    atlasData: SpritesheetData;
    atlasImgURL: string;
    mods: Record<string, any>;
}

export class _MD2dataManager {
    static modGlobPr: Promise<Record<string, string>> = 
    convertPathToObj(import.meta.glob<{default: string}>("../../../mods/**"));

    static versionString = JSON.stringify([0, 1, 0]);

    modDataRecord: Record<string, Record<string, string>> = {};

    private id: number = 0;
    
    engine: _MD2engine;

    atlasData: SpritesheetData;
    private atlasTexturePr: Promise<BindableTexture>;

    private spritesheet?: Spritesheet;
    private spritesheetPr: Promise<void>;

    mods: Record<string, ModInfo> = {};

    constructor(engine: _MD2engine, opts: _MD2dataManagerOpts) {
        const self = this;
        this.engine = engine;

        this.atlasData = opts.atlasData;
        this.atlasTexturePr = Assets.load(opts.atlasImgURL) as Promise<BindableTexture>;

        for(const path in opts.mods) {
            const mod = opts.mods[path];
            this.mods[path.split("../").at(-1)?.split("/").at(1) 
            || "unknown-" + Math.round(Math.random() * 10000)] = mod;
        }

        var spritesheetRes: () => void;

        this.spritesheetPr = new Promise(res => spritesheetRes = res);

        this.atlasTexturePr.then(texture => {
            this.spritesheet = new Spritesheet(
                texture,
                self.atlasData,
            );

            this.spritesheet.parse()
            .then(async () => {
                spritesheetRes();

                this.spritesheet!.textureSource.scaleMode = "nearest";

                this.getTexture = this.initializedGetTexture;
                this.getAnimationTextures = this.initializedGetAnimationTextures;
            });
        });
    }

    getTextureAsHTMLimage(textureName: string, isFormatted: boolean = false): Promise<HTMLImageElement> {
        const arr = [this.getTexture(textureName, false), this.getAnimationTextures(textureName, false)[0]];
        const t = (arr[0] == Texture.WHITE) ? arr[1] : arr[0];

        const pr = this.engine.app.renderer.extract.image(t);

        if(isFormatted) pr.then(img => {
            img.width = this.engine.blockSize;
            img.height = this.engine.blockSize;
        });

        return pr;
    }

    async init(): Promise<void> {
        await this.spritesheetPr;

        const modGlob = await _MD2dataManager.modGlobPr;

        for(const path in modGlob) {
            //const val = (_MD2dataManager.modGlob[path]());
            //_MD2dataManager.modData;
            //console.log(modGlob[path])
            const modName: string = path.split("../").at(-1)?.split("/").at(1) 
            || "unknown-" + Math.round(Math.random() * 10000);

            const filename = path.split("/").at(-1)
            || "unknown-" + Math.round(Math.random() * 10000);

            if(!this.modDataRecord[modName]) this.modDataRecord[modName] = {};

            this.modDataRecord[modName][filename]  = modGlob[path];
        }

        await this.initMods();
    }

    private async initMods() {
        for(const modName in this.mods) {
            await this.parseMod(modName, this.mods[modName]);
        }
    }

    getSpritesheet(): Spritesheet {
        return this.spritesheet!;
    }

    private initializedGetAnimationTextures(name: string, err: boolean = true): Texture[] {
        const t = this.spritesheet!.animations[name];
        if(!t) {
            if(err) this.engine.errorManager.textureNotFound(name);
            return [Texture.WHITE];
        } else return t;
    }

    private initializedGetTexture(name: string, err: boolean = true): Texture {
        const t = this.spritesheet!.textures[name];
        if(!t) {
            if(err) this.engine.errorManager.textureNotFound(name);
            return Texture.WHITE;
        } else return t;
    }

    changeTileSpriteTextureByName(s: TilingSprite, name: string, pivot: boolean = true) {
        s.texture = this.getTexture(name);
        s.tileScale.set(this.engine.blockSize / s.texture.width, this.engine.blockSize / s.texture.height);
        if(pivot) s.pivot.set(s.texture.width / 2, s.texture.height / 2);
    }

    getTexture: ((name: string, err?: boolean) => Texture) = (name: string, err = true) => {
        this.engine.errorManager.textureUnaccess(name);

        return Texture.WHITE;
    }

    getAnimationTextures: ((name: string, err?: boolean) => Texture[]) = (name: string, err = true) => {
        this.engine.errorManager.textureUnaccess(name);

        return [Texture.WHITE];
    }

    getNewId(): number {
        return ++this.id;
    }

    getAnimation(name: string): AnimatedSprite {
        return new AnimatedSprite(this.spritesheet!.animations[name]);
    }

    getSprite(name: string): Sprite {
        return new Sprite(this.spritesheet!.textures[name]);
    }

    private async parseMod(fileName: string, mod: ModInfo): Promise<void> {
        const {blocks} = mod;

        for(const block of blocks) {
            this.engine.generator.registerBlock(block.texture, block);
        }

        const modData = this.modDataRecord[fileName];
        const entities = (modData["entities.json"] || {}) as Object as EntityFileInfo;

        if(JSON.stringify(entities.version) != _MD2dataManager.versionString) {
            this.engine.errorManager
            .outdatedVersion(JSON.stringify(entities.version), _MD2dataManager.versionString);
        } else {
            for(const entityName in entities.entities) {
                this.engine.generator.registerEntity(entityName, entities.entities[entityName]);
            }
        }

        const items = modData["items.json"] as Object as ItemFileInfo;
        if(items) {
            if(JSON.stringify(items.version) != _MD2dataManager.versionString) {
                this.engine.errorManager
                .outdatedVersion(JSON.stringify(entities.version), _MD2dataManager.versionString);
            } else {
                for(const name in items.data) {
                    const o = items.data[name];

                    this.engine.modules.gui.parts.inventory.registerItem(name, {
                        texture: o.texture,
                        useEvent: o.onUse,
                        desc: o.desc,
                        img: await this.getTextureAsHTMLimage(o.texture)
                    });
                }
            }
        }
    }
}