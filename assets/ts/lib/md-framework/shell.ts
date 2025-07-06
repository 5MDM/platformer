import { Application, Assets, BindableTexture, Container, Sprite, Spritesheet, SpritesheetData, Texture, TilingSprite } from "pixi.js";
import { GMOutput, Keymap } from "../keymap";
import { PWS } from "../physics/objects";
import { PW } from "../physics/physics";
import { degToRad, getRandom } from "../util";
import { MDgame, MDgameGridType, MDgameType } from "./game";
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
    name: string;
    type?: MDgameGridType;
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
    overlay: boolean;
}

export interface FgObj extends BgObj {
    pwb: PWS;
    
}

// name: the id of the block
// display: the displayed name of a block
// texture: texture url
// recode needed because the code sucks

export interface BlockCreationOpts extends XYWH {
    name: string;
    rotation?: number;
    overlay?: boolean;
}

export class MDshell {
    playerSpawnString = "@";
    levels: Record<string, LevelJSONoutput[]> = {};

    blockSize: number;
    blockSizeHalf: number;
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

    getBlockInfo(name: string): BlockInfo {
        return this.blocks[name];
    }
    
    constructor(o: MDshellOpts) {
        this.app = o.app;
        this.blockSize = o.blockSize;
        this.blockSizeHalf = this.blockSize / 2;
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

    createBlock(o: BlockCreationOpts): {isPassable: boolean, id: number} {
        o.overlay ??= false;
        o.rotation ??= 0;

        const info = this.getBlockInfo(o.name);
        info.type ??= "fg";

        const s = this.createMergedSprite(
            o.x * this.blockSize,
            o.y * this.blockSize,
            o.w, 
            o.h, 
            this.getTexture(o.name), 
            o.rotation,
        );

        this.game.groups[info.type].addChild(s);

        if(info.type == "fg") {
            const pws = 
            new PWS(o.x * this.blockSize, o.y * this.blockSize, o.w * this.blockSize, o.h * this.blockSize, info.texture);

            this.game.blocks.fg[pws.id] = {
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                type: info.texture,
                sprite: pws.sprite!,
                rotation: o.rotation,
                pwb: pws,
                overlay: false,
            };

            pws.sprite = s;

            Keymap.IterateGMrect(o.x, o.y, o.w, o.h, (x, y) => {
                this.game.grids.fg.set(x, y, {
                    name: o.name,
                    id: pws.id,
                    type: this.blocks[o.name].texture,
                });

                this.pw.addStatic(x, y, pws);
            });

            const components = this.blocks[o.name].components || {};

            if(Object.keys(components).length != 0) {
                parseBlockComponents(this, this.game, this.blocks[o.name].components!, pws.id);
            }

            return {isPassable: false, id: pws.id};
        } else if(info.type == "bg") {
            const id = this.game.getNewId();
            this.game.blocks.bg[id] = {
                sprite: s,
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                type: info.texture,
                rotation: o.rotation,
                overlay: false,
            };

            Keymap.IterateGMrect(o.x, o.y, o.w, o.h, (x, y) => {
                this.game.grids.bg.set(x, y, {
                    name: o.name,
                    id,
                    type: info.texture,
                });
            });

            return {isPassable: true, id};
        } else {
            const id = this.game.getNewId();
            this.game.blocks.overlay[id] = {
                sprite: s,
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                type: info.texture,
                rotation: o.rotation,
                overlay: true,
            };

            Keymap.IterateGMrect(o.x, o.y, o.w, o.h, (x, y) => {
                this.game.grids.bg.set(x, y, {
                    name: o.name,
                    id,
                    type: info.texture,
                });
            });

            return {isPassable: true, id};
        }
    }

    private registerBlock(name: string, block: BlockInfo) {
        var hasComponents = false;
        block.type ??= "fg";

        if(block.components) {
            hasComponents = true;
            if(block.type != "fg") return MDshell.Err(
                `block "${name}" has a component while being passive`
            );
        }

        block.components ||= {};

        this.blocks[name] = block;

        if(hasComponents) {
            this.levelGenerator.key(block.texture, (x, y, w, h, rotation) => {
                const output = this.createBlock({
                    x, y, w, h,
                    name: block.texture,
                    rotation: degToRad(rotation),
                });
            });
        } else {
            this.levelGenerator.key(block.texture, (x, y, w, h, rotation) => {
                const output = this.createBlock({
                    x, y, w, h,
                    name: block.texture,
                    rotation: degToRad(rotation),
                });
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
        const arr: LevelJSONoutput[] | undefined = this.levels[name];
        if(!arr) return MDshell.Err(`Couldn't find level "${name}"`);

        this.levelGenerator.runRaw(arr);
    }

    destroyCurrentLevel() {
        this.game.clearAndDestroyItems();
        this.pw.clear();

        this.game.groups.bg.removeChildren();
        this.game.groups.fg.removeChildren();
    }

    devCreateRandomCreate(ix: number, iy: number, n: number) {
        const nameArr = Object.keys(this.blocks);

        for(let yy = -n; yy != n; yy++) {
            for(let xx = -n; xx != n; xx++) {
                const randomBlockName = getRandom<string>(nameArr);
                this.createBlock({
                    x: xx + ix,
                    y: yy + iy,
                    w: 1,
                    h: 1,
                    name: randomBlockName
                });
            }
        }
    }
}

