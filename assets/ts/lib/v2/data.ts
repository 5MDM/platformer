import { AnimatedSprite, Assets, BindableTexture, Sprite, Spritesheet, SpritesheetData, Texture } from "pixi.js";
import { _MD2engine } from "./engine";
import { ModInfo } from "./types";

export interface _MD2dataManagerOpts {
    atlasData: SpritesheetData;
    atlasImgURL: string;
    mods: Record<string, any>;
}

export class _MD2dataManager {
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
            this.mods[mod.name] = mod;
        }

        var spritesheetRes: () => void;

        this.spritesheetPr = new Promise(res => spritesheetRes = res);

        this.atlasTexturePr.then(texture => {
            this.spritesheet = new Spritesheet(
                texture,
                self.atlasData,
            );

            this.spritesheet.parse()
            .then(() => {
                spritesheetRes();

                this.spritesheet!.textureSource.scaleMode = "nearest";

                this.getTexture = this.initializedGetTexture;

                this.initMods();
            });
        });
    }

    getTextureAsHTMLimage(textureName: string, isFormatted: boolean = false): Promise<HTMLImageElement> {
        const pr = this.engine.app.renderer.extract.image(this.getTexture(textureName));

        if(isFormatted) pr.then(img => {
            img.width = this.engine.blockSize;
            img.height = this.engine.blockSize;
        });

        return pr;
    }

    async init(): Promise<void> {
        await this.spritesheetPr;
    }

    private initMods() {
        for(const modName in this.mods) {
            const {blocks} = this.mods[modName];

            for(const block of blocks) {
                this.engine.generator.registerBlock(block.texture, block);
            }
        }
    }

    getSpritesheet(): Spritesheet {
        return this.spritesheet!;
    }

    private initializedGetTexture(name: string): Texture {
        const t = this.spritesheet!.textures[name];
        if(!t) {
            this.engine.errorManager.textureNotFound(t);
            return Texture.WHITE;
        } else return t;
    }

    getTexture: ((name: string) => Texture) = (name: string) => {
        this.engine.errorManager.textureUnaccess(name);

        return Texture.WHITE;
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
}