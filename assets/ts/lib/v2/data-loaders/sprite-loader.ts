import { SpritesheetData, BindableTexture, Spritesheet, Assets, Texture, TilingSprite, AnimatedSprite, Sprite } from "pixi.js";
import { convertPathToObj, Dict, Smap } from "../../misc/util";
import { _MD2dataManager } from "./data";
import { _MD2engine } from "../engine";
import { Mod, ModInfo } from "../types";
import { MD2errors } from "../errors";
import { mdLoadImage } from "../../misc/img-loader";
import { MDregexUtils } from "../engine-utils/regex";

export interface _MD2dataManagerOpts {
    //atlasData: SpritesheetData;
    //atlasImgURL: string;
    mods: Record<string, any>;
    manifestFiles: Record<string, Mod.ManifestV0_1_x>;
}

export abstract class MD2SpriteLoader {
    static modGlobPr: Promise<Record<string, string>> = 
    convertPathToObj(import.meta.glob<{ default: string; }>("../../../../mods/**"));

    static versionString = JSON.stringify([0, 1, 0]);

    modDataRecord: Record<string, Record<string, string>> = {};

    private id: number = 0;

    engine: _MD2engine;

    //atlasData: SpritesheetData;
    // private atlasTexturePr: Promise<BindableTexture>;

    readonly spritesheetMap: Smap<Spritesheet> = new Map();

    protected spritesheet?: Spritesheet;
    spritesheetPr: Promise<void>;
    protected spritesheetRes!: () => void;

    textureRegistry: Smap<Texture> = new Map();

    protected multiSpritesheetData: Mod.MultiSpritesheetDataHolder = {
        data: [],
        image: [],
    };

    addModSpritesheet(data: SpritesheetData, imgPath: string) {
        this.multiSpritesheetData.data.push(data);
        this.multiSpritesheetData.image.push(imgPath);      
        
        // .splice(-2) returns "${modName}/${atlasName}.png"
        const name = imgPath.split("/").splice(-2).join("/").split(".")[0];

        const pre = "../../../../mods/";
        MD2SpriteLoader.modGlobPr
        .then(async o => {
            const imgPathR = pre + name + ".png";
            const imgPath = o[imgPathR];

            const img = await mdLoadImage(imgPath);
            this.spritesheetMap.set(name, new Spritesheet({
                texture: Texture.from(img),
                data,
            }));
        });
    }

    constructor(engine: _MD2engine, opts: _MD2dataManagerOpts) {
        const self = this;
        this.engine = engine;

        //this.atlasData = opts.atlasData;
        //this.atlasTexturePr = Assets.load(opts.atlasImgURL) as Promise<BindableTexture>;

        this.manifestFiles = opts.manifestFiles;

        this.spritesheetPr = new Promise(res => this.spritesheetRes = res);

        // this.atlasTexturePr.then(texture => {
        //     this.spritesheet = new Spritesheet(
        //         texture,
        //         self.atlasData
        //     );

        //     this.spritesheet.parse()
        //         .then(async () => {
        //             spritesheetRes();

        //             this.spritesheet!.textureSource.scaleMode = "nearest";

        //             this.getTexture = this.initializedGetTexture;
        //             this.getAnimationTextures = this.initializedGetAnimationTextures;
        //         });
        // });
    }

    async init(): Promise<void> {
        const modGlob = await _MD2dataManager.modGlobPr;

        for (const path in modGlob) {
            const modName: string = path.split("../").at(-1)?.split("/").at(1)
                || "unknown-" + Math.round(Math.random() * 10000);

            const filename = path.split("/").at(-1)
                || "unknown-" + Math.round(Math.random() * 10000);

            if (!this.modDataRecord[modName]) this.modDataRecord[modName] = {};
            this.modDataRecord[modName][filename] = modGlob[path];
        }

        await this.initMods();
        await this.spritesheetPr;

        for(const [name, val] of this.spritesheetMap) await val.parse();
        this.spritesheetMap.forEach(async ss => await ss.parse());
    }

    manifestFiles: Record<string, Mod.ManifestV0_1_x> = {};

    async initMods() { };

    getSpritesheet(): Spritesheet {
        return this.spritesheet!;
    }

    protected initializedGetAnimationTextures(name: string, err: boolean = true): Texture[] {
        const t = this.spritesheet!.animations[name];
        if (!t) {
            if (err) this.engine.errorManager.textureNotFound(name);
            return [Texture.WHITE];
        } else return t;
    }

    static readonly spritesheetNameRegex = /(\w+\/){2}/;

    protected initializedGetTexture(name: string, err: boolean = true): Texture {
        // //name = "base/spritesheet/" + name;

        // //const t = this.spritesheet!.textures[name];
        // //const spritesheetName = name.match(MD2SpriteLoader.spritesheetNameRegex)?.[0];
        // //console.log(spritesheetName)
        // //const spritesheetName = name.match(MD2SpriteLoader.spritesheetNameRegex)?.[0].slice(0, -1);
        // const [ssName, name] = MDregexUtils.splitResourcePath(path);

        // var ss = this.spritesheetMap.get(ssName);
        // if(!ss) {
        //     ss = this.spritesheetMap.get("base/spritesheet");
        //     MD2errors.err("Spritesheet object not found for " + ssName);
        //     return Texture.WHITE;
        // }

        //console.log(name)
        const t = this.textureRegistry.get(name);

        if (!t) {
            if (err) this.engine.errorManager.textureNotFound(name);

            return Texture.WHITE;
        } else return t;
    }

    changeTileSpriteTextureByName(s: TilingSprite, name: string, pivot: boolean = true) {
        s.texture = this.getTexture(name);
        s.tileScale.set(this.engine.blockSize / s.texture.width, this.engine.blockSize / s.texture.height);
        if (pivot) s.pivot.set(s.texture.width / 2, s.texture.height / 2);
    }

    getTexture: ((name: string, err?: boolean) => Texture) = (name: string, err = true) => {
        this.engine.errorManager.textureUnaccess(name);

        return Texture.WHITE;
    };

    getAnimationTextures: ((name: string, err?: boolean) => Texture[]) = (name: string, err = true) => {
        this.engine.errorManager.textureUnaccess(name);

        return [Texture.WHITE];
    };

    getNewId(): number {
        return ++this.id;
    }

    getAnimation(name: string): AnimatedSprite {
        return new AnimatedSprite(this.spritesheet!.animations[name]);
    }

    getSprite(name: string): Sprite {
        return new Sprite(this.spritesheet!.textures[name]);
    }
}
