import { Assets, Container, Sprite, Spritesheet, SpritesheetData, squaredDistanceToLineSegment, Texture, TilingSprite } from "pixi.js";
import { Keymap } from "./lib/keymap";
import { floorToMultiples, iteratePaths, MDmatrix } from "./lib/util";
import { PWS } from "./lib/pw-objects";
import { blockSize, PW } from "./lib/physics";

export const chunkSize = 16;
export const blockSizeHalf = blockSize / 2;

export const blockDefs: {[name: string]: BlockInfo} = {};

const data = (await (import.meta.glob<{default: SpritesheetData}>("../spritesheet-data/data.json"))["../spritesheet-data/data.json"]()).default;
const atlasImg = (await (import.meta.glob<{default: string}>("../images/atlas.png"))["../images/atlas.png"]()).default;
    
const spritesheet = new Spritesheet(
    await Assets.load(atlasImg),
    data
);

await spritesheet.parse();

export {spritesheet};

interface BlockInfo {
    name: "string";
    character: "#";
    textureCreator?: {
        color: string;
    };
    texture: string;
}

interface ModInfo {
    name: string;
    blocks: BlockInfo[];
    version: [number, number, number];
}

const staticContainer = new Container();
const staticChunks = new MDmatrix<Container>(64, 64);

export const levelmap = new Keymap();

const iterate = await iteratePaths<ModInfo>
(import.meta.glob<{default: ModInfo}>("../mods/*/manifest.json"), parseMod);

export var playerStartX = 0;
export var playerStartY = 0;

function parseMod(path: string, mod: ModInfo) {
    for(const block of mod.blocks) {
        blockDefs[block.name] = block;
        levelmap.key(block.character, 
            (x, y, w, h) => createBlock(createSprite(block, x, y, w, h), x, y, w, h)
        );
    }

    levelmap.key("@", (x, y, w, h) => {
        playerStartX = x * blockSize;
        playerStartY = y * blockSize;
    });
}

Texture.WHITE.source.scaleMode = "linear";
Texture.WHITE.source.autoGenerateMipmaps = false;


function createSprite(block: BlockInfo, x: number, y: number, w: number, h: number): TilingSprite {
    x *= blockSize;
    y *= blockSize;

    if(block.textureCreator) {
        const s = new TilingSprite({
            texture: Texture.WHITE,
            tint: block.textureCreator.color,
            width: blockSize * w,
            height: blockSize * h,
            position: {x, y},
            roundPixels: true,
            //anchor: 0.5,
        });

        return s;
    } else {
        
    }

    if(!block.texture) throw new Error();

    return new TilingSprite({
        texture: spritesheet.textures[block.texture],
        width: blockSize * w,
        height: blockSize * h,
        position: {x, y},
        roundPixels: true,
    });
}

var pw: PW;
var wc: Container;

export function setWorldBase(c: Container, p: PW) {
    wc = c;
    pw = p;
    wc.addChild(staticContainer);
}

function createBlock(sprite: TilingSprite, x: number, y: number, w: number, h: number) {
    const obj = new PWS(sprite.x, sprite.y, w * blockSize, h * blockSize);
    obj.sprite = sprite;

    Keymap.IterateGMrect(x, y, w, h, (x, y) => {
        pw.addStatic(x, y, obj);
    });
    
    const chunkX =  Math.floor(obj.x / blockSize / chunkSize);
    const chunkY = Math.floor(obj.y / blockSize / chunkSize);

    const got = staticChunks.get(chunkX, chunkX);
    if(!got) {
        const c = new Container();
        staticChunks.set(chunkX, chunkY, c);
        obj.toContainer(c);
        staticContainer.addChild(c);
    } else {
        obj.toContainer(got);
    }
}