import { Application, Assets, BindableTexture, Spritesheet, SpritesheetData, Texture, TilingSprite } from "pixi.js";
import { GMOutput, Keymap } from "../misc/keymap";
import { PWS } from "../physics/objects";
import { PW } from "../physics/physics";
import { degToRad, getRandom } from "../misc/util";
import { MDgame, MDgameGridType, MDgameType } from "./game";
import { Player } from "../player";
import { BgBlock, FgBlock } from "./unit";
import { MDaudio } from "../misc/audio";
import { LevelData, MDlevelGenerator } from "./level-gen";
import { MDcomponentParser } from "./block-components/main";
import { ComponentList } from "./block-components/parser";

export interface XYWH {
    x: number;
    w: number;
    y: number;
    h: number;
}

export interface LevelJSONoutput extends GMOutput {
    rotation: number;
    components?: ComponentList;
}

export interface BlockInfo {
    name: string;
    type?: MDgameGridType;
    texture: string;
    components?: ComponentList;
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
    playerWidth: number;
    playerHeight: number;
}

// name: the id of the block
// display: the displayed name of a block
// texture: texture url
// recode needed because the code sucks

export interface BlockCreationOpts extends XYWH {
    name: string;
    rotation?: number;
    overlay?: boolean;
    components?: ComponentList;
}

export class MDshell {
    playerSpawnString = "@";
    levels: Record<string, LevelData> = {};
    player: Player;

    componentParser: MDcomponentParser;

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
    blocks: Record<string, BlockInfo> = {};
    imageBlobSize: number;
    audio = new MDaudio();

    backgroundTextureName?: string;

    backgroundSprite = new TilingSprite({
        width: innerWidth,
        height: innerHeight,
        texture: Texture.WHITE,
        zIndex: -1,
        visible: false,
        anchor: .5,
        x: innerWidth / 2,
        y: innerHeight / 2,
    });

    levelGen = new MDlevelGenerator(this, (o: BlockCreationOpts) => {
        if(o.name == this.playerSpawnString) 
            return this.game.setSpawn(o.x * this.blockSize, o.y * this.blockSize);

        if(o.rotation) o.rotation = degToRad(o.rotation);
        this.createBlock(o);
    }, ({name}) => {
        const t = this.getTexture(name);

        //console.log(this.atlasData.frames);
        if(!t) return MDshell.Err(`Level data error: couldn't find texture "${name}"`);
        //this.backgroundSprite.x = this.player.x;
        //this.backgroundSprite.y = this.player.y;
        this.backgroundTextureName = name;
        this.backgroundSprite.texture = t;
        this.backgroundSprite.visible = true;
    });

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

        this.componentParser = new MDcomponentParser({
            shell: this,
        });

        const ictx = this.internalCanvas.getContext("2d");
        if(!ictx) throw MDshell.Err("canvas context rejected");

        this.ictx = ictx;

        this.game = new MDgame({
            gameType: o.gameType,
            maxLevelWidth: o.pw.size,
            maxLevelHeight: o.pw.size,
            shell: this,
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

        this.player = new Player(this.game.groups.view, o.playerWidth, o.playerHeight);

        this.game.container.addChild(this.backgroundSprite);
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

            const components = o.components || this.blocks[o.name].components || {};

            const fgBlock = new FgBlock({
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                name: info.texture,
                rotation: o.rotation,
                pws: pws,
                isOverlay: false,
                shell: this,
                id: pws.id,
                components,
            });

            this.game.blocks.fg[pws.id] = fgBlock;
            pws.sprite = s;

            Keymap.IterateGMrect(o.x, o.y, o.w, o.h, (x, y) => {
                this.game.grids.fg.set(x, y, fgBlock);

                this.pw.addStatic(x, y, pws);
            });

            if(Object.keys(components).length != 0) {
                //parseBlockComponents(this, this.game, components, pws.id);
                this.componentParser.parseComponents(fgBlock);
            }

            return {isPassable: false, id: pws.id};
        } else if(info.type == "bg") {
            const id = this.game.getNewId();

            const bgBlock = new BgBlock({
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                name: info.texture,
                rotation: o.rotation,
                shell: this,
                id,
            });

            bgBlock.sprite = s;

            this.game.blocks.bg[id] = bgBlock;

            Keymap.IterateGMrect(o.x, o.y, o.w, o.h, (x, y) => {
                this.game.grids.bg.set(x, y, bgBlock);
            });

            return {isPassable: true, id};
        } else {
            const id = this.game.getNewId();

            const bgBlock = new BgBlock({
                x: o.x,
                y: o.y,
                w: o.w,
                h: o.h,
                name: info.texture,
                rotation: o.rotation,
                isOverlay: true,
                shell: this,
                id,
            });

            bgBlock.sprite = s;

            this.game.blocks.overlay[id] = bgBlock;

            Keymap.IterateGMrect(o.x, o.y, o.w, o.h, (x, y) => {
                this.game.grids.overlay.set(x, y, bgBlock);
            });

            return {isPassable: true, id};
        }
    }

    private registerBlock(name: string, block: BlockInfo) {
        //if(name == this.playerSpawnString) return;

        this.levelGen.setBlockDef(name, {
            name: block.texture,
            type: block.type || "fg",
            displayName: block.name,
            components: block.components, // default components
        });

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

        /*

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
        }*/
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

    addLevel(name: string, data: LevelData): void {
        this.levels[name] = data;
    }

    currentLevelName: string = "";

    setCurrentLevel(name: string) {
        const data: LevelData | undefined = this.levels[name];
        if(!data) return MDshell.Err(`Couldn't find level "${name}"`);

        if(this.currentLevelName == name) return MDshell.Err(
            `Tried to load same level twice. Level name: "${name}"`
        );

        this.currentLevelName = name;

        this.levelGen.generateLevelFromData(data)

        this.player.completeTweeningEarly(this.pw.lerpTime);
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

    deleteBlock(type: MDgameGridType, x: number, y: number) {
        const block = this.game.grids[type].get(x, y);
        if(!block) return;

        block.deletePart(x, y);

        if(type == "fg") this.pw.removeStatic(x, y);
    }
}

