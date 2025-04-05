import { Container, Sprite, squaredDistanceToLineSegment, Texture } from "pixi.js";
import { Keymap } from "./lib/keymap";
import { floorToMultiples, iteratePaths, MDmatrix } from "./lib/util";
import { PWS } from "./lib/pw-objects";
import { PW } from "./lib/physics";

export const chunkSize = 16;
export const blockSize = 32;
export const blockSizeHalf = blockSize / 2;

export const blockDefs: {[name: string]: BlockInfo} = {};

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

function parseMod(path: string, mod: ModInfo) {
    for(const block of mod.blocks) {
        blockDefs[block.name] = block;
        levelmap.key(block.character, (x: number, y:number) => createBlock(createSprite(block, x, y)));
    }

    levelmap.onEnd = function() {
        for(const container of staticContainer.children) {
            //container.cacheAsTexture(true);
        }
    };
}

Texture.WHITE.source.scaleMode = "linear";
Texture.WHITE.source.autoGenerateMipmaps = false;


function createSprite(block: BlockInfo, x: number, y: number): Sprite {
    x *= blockSize;
    y *= blockSize;

    if(block.textureCreator) {
        const s = new Sprite({
            texture: Texture.WHITE,
            tint: block.textureCreator.color,
            width: blockSize,
            height: blockSize,
            position: {x, y},
            roundPixels: true,
            //anchor: 0.5,
        });

        return s;
    } else {
        
    }

    if(!block.texture) throw new Error();

    return new Sprite({
        texture: Texture.from(block.texture),
    })
}

var pw: PW;
var wc: Container;

export function setWorldBase(w: Container, p: PW) {
    wc = w;
    pw = p;
    wc.addChild(staticContainer);
}

function createBlock(sprite: Sprite) {
    const obj = new PWS(sprite.x, sprite.y, blockSize, blockSize);
    obj.sprite = sprite;

    pw.addStatic(obj);
    
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