import { Application, Assets, BindableTexture, Container, Sprite, Spritesheet, SpritesheetData, Texture, TilingSprite } from "pixi.js";
import { MDgame, MDgameOpts, MDgameType } from "./game";
import { GMOutput, Keymap } from "../keymap";
import { PWB, PWS } from "../pw-objects";
import { PW } from "../physics";

export interface XYWH {
    x: number;
    w: number;
    y: number;
    h: number;
}

export interface BlockInfo {
    isPassable?: boolean;
    name: string;
    character: string;
    texture: string;
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

export class MDshell {
    levels: Record<string, GMOutput[]> = {};

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

    pwObjects: Record<number, PWS> = {};
    bgObjects: Record<number, Container> = {};

    internalCanvas = new OffscreenCanvas(256, 256);
    ictx: OffscreenCanvasRenderingContext2D;

    static Err(msg: Event | string): void {
        document.title = "ERROR DETECTED";
        if(typeof msg == "string") console.error(new Error("MD shell: " + msg));
        else console.error(msg);
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
            c: o.pw.wc,
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

        this.levelGenerator.key("@", (x, y) => this.game.setSpawn(x * this.blockSize, y * this.blockSize));
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

    createMergedSprite(x: number, y: number, w: number, h: number, t: Texture): TilingSprite {
        const s = new TilingSprite({
            texture: t,
            width: this.blockSize * w + .1,
            height: this.blockSize * h + .1,
            position: {x, y},
            roundPixels: true,
            tileScale: {x: this.blockSize / t.width, y: this.blockSize / t.height},
        });
        
        s.clampMargin = 0;

        return s;
    }

    createBlock(x: number, y: number, w: number, h: number, name: string, isPassable: boolean = false) {
        const t = this.getTexture(name);
        const s = this.createMergedSprite(x * this.blockSize, y * this.blockSize, w, h, t);

        this.game.container.addChild(s);

        if(isPassable) {
            const id = this.game.getNewId();
            this.bgObjects[id] = s;

            Keymap.IterateGMrect(x, y, w, h, (x, y) => {
                this.game.grids.bg.set(x, y, {
                    name,
                    id,
                    type: this.blocks[name].character,
                });
            });
        } else {
            const pws = new PWS(s.x, s.y, s.width, s.height);
            this.pwObjects[pws.id] = pws;

            pws.sprite = s;

            Keymap.IterateGMrect(x, y, w, h, (x, y) => {
                this.game.grids.fg.set(x, y, {
                    name,
                    id: pws.id,
                    type: this.blocks[name].character,
                });

                this.pw.addStatic(x, y, pws);
            });
        }
    }

    private registerBlock(name: string, block: BlockInfo) {
        block.isPassable ??= false;
        this.blocks[name] = block;

        this.levelGenerator.key(block.character, 
            (x, y, w, h) => {
                this.createBlock(x, y, w, h, block.texture, block.isPassable);
            }
        );
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

    addLevel(name: string, data: GMOutput[]): void {
        this.levels[name] = data;
    }

    setCurrentLevel(name: string) {
        const arr: GMOutput[] = this.levels[name];

        this.levelGenerator.runRaw(arr);
    }
}

