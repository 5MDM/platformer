import { Container, Sprite, Texture } from "pixi.js";
import { Keymap } from "./lib/keymap";
import { iteratePaths } from "./lib/util";
import { toLoad } from "./loader";
import { blockSize } from "./main";
import { PWS } from "./lib/pw-objects";
import { PW } from "./lib/physics";

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
export const levelmap = new Keymap();

const iterate = iteratePaths<ModInfo>
(import.meta.glob<{default: ModInfo}>("../mods/*/manifest.json"), parseMod);

toLoad.push(
    iterate
);

await iterate;

function parseMod(path: string, mod: ModInfo) {
    for(const block of mod.blocks) {
        blockDefs[block.name] = block;
        console.log(block.character)
        levelmap.key(block.character, (x: number, y:number) => createBlock(createSprite(block, x, y)));
    }

    staticContainer.cacheAsTexture(true);
}

function createSprite(block: BlockInfo, x: number, y: number): Sprite {
    x *= blockSize;
    y *= blockSize;

    if(block.textureCreator) {
        return new Sprite({
            texture: Texture.WHITE,
            tint: block.textureCreator.color,
            width: blockSize,
            height: blockSize,
            position: {x, y},
            //anchor: 0.5,
        });
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
    obj.toContainer(staticContainer);
}