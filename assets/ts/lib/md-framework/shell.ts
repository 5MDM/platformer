import { Application, Assets, BindableTexture, Container, Sprite, Spritesheet, SpritesheetData, Texture, TilingSprite } from "pixi.js";
import { GMOutput, Keymap } from "../keymap";
import { PWS } from "../pw-objects";
import { PW } from "../physics";
import { degToRad } from "../util";
import { MDgame, MDgameType } from "./game";
import { mdshell } from "../../constants";
import { parseBlockComponents } from "./components";

export interface XYWH {
    x: number;
    w: number;
    y: number;
    h: number;
}

export interface LevelJSONoutput extends GMOutput {
    rotation: number;
}

export interface BlockInfo {
    isPassable?: boolean;
    name: string;
    texture: string;
    components?: Record<string, Record<string, any>>;
}

export interface ModInfo {
    name: string;
    blocks: BlockInfo[];
    version: [number, number, number];
}

interface MDshellOpts {
    blockSize: number;
    gameType: MDgameType,
    atlasData: SpritesheetData;
    atlasImgURL: string;
    mods: Record<string, ModInfo>;
    pw: PW;
    imageBlobSize: number;
    app: Application;
}

export interface BgObj extends XYWH {
    sprite: Container;
    type: string;
    rotation: number;
}

export interface FgObj extends BgObj {
    pwb: PWS;
}

export class MDshell {
    playerSpawnString = "@";
    levels: Record<string, LevelJSONoutput[]> = {};

    blockSize: number;
    app: Application;
    game: MDgame;
    pw: PW;
    fullAtlasImg: Promise<HTMLImageElement>;
    atlasImgURL: string;
    atlasTexture: Promise<BindableTexture>;
    atlasData: SpritesheetData;
    spritesheet: Promise<Spritesheet>;
    mods: Record<string, ModInfo> = {};
    levelGenerator = new Keymap();
    blocks: Record<string, BlockInfo> = {};
    imageBlobSize: number;

    internalCanvas = new OffscreenCanvas(256, 256);
    ictx: OffscreenCanvasRenderingContext2D;

    static Err(msg: Event | string): void {
        document.title = "ERROR DETECTED";
        if(typeof msg == "string") console.error(new Error("MD shell: " + msg));
        else console.error(msg);
    }

    getBlockInfo(texture: string): BlockInfo {
        return this.blocks[texture];
    }
    
    constructor(o: MDshellOpts) {
        this.app = o.app;
        this.blockSize = o.blockSize;
        this.imageBlobSize = o.imageBlobSize;

        const ictx = this.internalCanvas.getContext("2d");
        if(!ictx) throw MDshell.Err("canvas context rejected");

        this.ictx = ictx;

        this.game = new MDgame({
            gameType: o.gameType,
            maxLevelWidth: o.pw.size,
            maxLevelHeight: o.pw.size,
        });

        this.atlasImgURL = o.atlasImgURL;

        this.fullAtlasImg = new Promise(res => {
            const img = new Image();
            img.src = this.atlasImgURL;
            img.onerror = msg => {throw MDshell.Err(msg)};
            img.onload = () => res(img);
        });
        this.atlasTexture = Assets.load(this.atlasImgURL) as Promise<BindableTexture>;
        this.atlasData = o.atlasData;

        for(const path in o.mods) {
            const mod = o.mods[path];
            
            if(this.mods[mod.name]) {
                this.mods[mod.name + ": " + path] = mod;
                MDshell.Err(`"${mod.name}" has a name conflict`);
            } else this.mods[mod.name] = mod;
        }

        this.levelGenerator.key(this.playerSpawnString, (x, y) => this.game.setSpawn(x * this.blockSize, y * this.blockSize));
        this.pw = o.pw;

        this.spritesheet = new Promise(async res => {
            this.atlasTexture
            .then(async texture => {
                const s = new Spritesheet(
                    texture,
                    this.atlasData,
                );

                await s.parse();

                res(s);
            });
        });

        this.spritesheet.then(s => this.initSpritesheet(s));
    }

    async init(): Promise<void> {
        await this.spritesheet;
        await this.fullAtlasImg;
    }

    private initSpritesheet(s: Spritesheet) {
        this.getTexture = (name: string) => {
            const t = s.textures[name];
            if(!t) {
                MDshell.Err(`"${name}" isn't a valid texture`);
                return Texture.WHITE;
            } else return t;
        };

        this.initMods();
    }

    getTexture: (name: string) => Texture = (name) => {
        MDshell.Err(`"${name}" was accessed before it was initialized`);
        return Texture.WHITE;
    };

    getTextureFrame(name: string): XYWH  {
        return this.atlasData.frames[name].frame;
    };

    private initMods() {
        for(const modName in this.mods) {
            const {blocks} = this.mods[modName];

            for(const block of blocks) {
                this.registerBlock(block.texture, block);
            }
        }
    }

    createMergedSprite(x: number, y: number, w: number, h: number, t: Texture, rotation: number = 0): TilingSprite {
        w *= this.blockSize;
        h *= this.blockSize;
        x += w / 2;
        y += h / 2;

        const s = new TilingSprite({
            texture: t,
            width: w + .1,
            height: h + .1,
            position: {x, y},
            roundPixels: true,
            tileScale: {x: this.blockSize / t.width, y: this.blockSize / t.height},
            pivot: {
                x: w / 2,
                y: h / 2,
            },

            tileRotation: rotation,
        });

        s.clampMargin = 0;

        return s;
    }

    createBlock
    (x: number, y: number, w: number, h: number, name: string, rotation: number = 0): {isPassable: boolean, id: number} {
        const t = this.getTexture(name);
        const s = this.createMergedSprite(x * this.blockSize, y * this.blockSize, w, h, t, rotation);
        const type =  this.blocks[name].texture;
        const isPassable = this.blocks[name].isPassable;

        if(isPassable) {
            this.game.groups.bg.addChild(s);

            const id = this.game.getNewId();
            this.game.bgObjects[id] = {
                sprite: s,
                x,
                y,
                w,
                h,
                type,
                rotation,
            };

            Keymap.IterateGMrect(x, y, w, h, (x, y) => {
                this.game.grids.bg.set(x, y, {
                    name,
                    id,
                    type,
                });
            });

            return {isPassable, id};
        } else {
            this.game.groups.fg.addChild(s);

            const pws = 
            new PWS(x * this.blockSize, y * this.blockSize, w * this.blockSize, h * this.blockSize, type);

            this.game.pwObjects[pws.id] = {
                x,
                y,
                w,
                h,
                type,
                sprite: pws.sprite!,
                rotation: rotation,
                pwb: pws,
            };

            pws.sprite = s;

            Keymap.IterateGMrect(x, y, w, h, (x, y) => {
                this.game.grids.fg.set(x, y, {
                    name,
                    id: pws.id,
                    type: this.blocks[name].texture,
                });

                this.pw.addStatic(x, y, pws);
            });

            if(this.blocks[name].components) {
                parseBlockComponents(this.game, this.blocks[name].components, pws.id);
            }

            return {isPassable: false, id: pws.id};
        }
    }

    private registerBlock(name: string, block: BlockInfo) {
        var hasComponents = false;
        block.isPassable ??= false;

        if(block.components) {
            hasComponents = true;
            if(block.isPassable) return MDshell.Err(
                `block "${name}" has a component while being passive`
            );
        }

        block.components ||= {};

        this.blocks[name] = block;

        if(hasComponents) {
            this.levelGenerator.key(block.texture, (x, y, w, h, rotation) => {
                const output = this.createBlock(x, y, w, h, block.texture, degToRad(rotation)); 
                parseBlockComponents(this.game, block.components!, output.id);
            });
        } else {
            this.levelGenerator.key(block.texture, (x, y, w, h, rotation) => {
                this.createBlock(x, y, w, h, block.texture, degToRad(rotation)); 
            });
        }
    }

    async getBlocksAsImages() {    
        const images: HTMLImageElement[] = []; 
        
        for(const blockName in this.blocks) {
            const {x, y, w, h} = this.getTextureFrame(this.blocks[blockName].texture);
            this.internalCanvas.width = w;
            this.internalCanvas.height = h;
            this.ictx.drawImage(await this.fullAtlasImg, x, y, w, h, 0, 0, w, h);
        
            const blob = await this.internalCanvas.convertToBlob();
            const url = URL.createObjectURL(blob);
            const img = new Image(this.imageBlobSize, this.imageBlobSize);
        
            img.src = url;
            img.onload = () => URL.revokeObjectURL(url);
            img.setAttribute("data-name", this.blocks[blockName].texture);

            images.push(img);
        }

        return images;
    }

    addLevel(name: string, data: LevelJSONoutput[]): void {
        this.levels[name] = data;
    }

    setCurrentLevel(name: string) {
        const arr: LevelJSONoutput[] = this.levels[name];

        this.levelGenerator.runRaw(arr);
    }

    destroyCurrentLevel() {
        for(const i in this.game.bgObjects) {
            const obj = this.game.bgObjects[i];

            obj.sprite?.destroy();
            delete this.game.bgObjects[i];
        }

        for(const i in this.game.pwObjects) {
            const obj = this.game.pwObjects[i];

            obj.sprite?.destroy();
            obj.pwb.destroy();
            delete this.game.bgObjects[i];
        }

        //this.game.groups.static.removeChildren();
        this.game.groups.bg.removeChildren();
        this.game.groups.fg.removeChildren();

        this.game.grids.fg.clear();
        this.game.grids.bg.clear();
    }
}

