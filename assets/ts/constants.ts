import { Container } from "pixi.js";
import { PW } from "./lib/physics";
import { MDmatrix } from "./lib/util";
import { Player } from "./lib/player";

export const chunkSize = 16;
export const blockSize = 64;
export const blockSizeHalf = blockSize / 2;

export interface ModInfo {
    name: string;
    blocks: BlockInfo[];
    version: [number, number, number];
}

export interface BlockInfo {
    name: "string";
    character: "#";
    textureCreator?: {
        color: string;
    };
    texture: string;
}

export const blockDefs: {[name: string]: BlockInfo} = {};
export const maxLevelSize = 256;

export const wc = new Container();
export const pw = new PW({
    gx: 0,
    gy: 0,
    simSpeed: 1000 / 60,
    world: wc,
    blockSize,
    maxLevelSize,
});

export const staticContainer = new Container();
export const staticChunks = new MDmatrix<Container>(64, 64);
wc.addChild(staticContainer);

export const player = new Player(wc, 30, 63);
pw.addDynamic(player);
