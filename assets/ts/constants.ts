import { Application, Container, SpritesheetData } from "pixi.js";
import { PW } from "./lib/physics/physics";
import { $, convertPathToObj } from "./lib/util";
import { MDmatrix } from "./lib/matrix";
import { MDshell, ModInfo } from "./lib/md-framework/shell";

export const chunkSize = 16;
export const blockSize = 2**6;
export const blockSizeHalf = blockSize / 2;
export const blockSizeQuarter = blockSizeHalf / 2;

export const maxLevelSize = 256;

export const pw = new PW({
    gx: 0,
    gy: 0,
    simSpeed: 1000 / 30,
    blockSize,
    maxLevelSize,
    smoothing: .25
});

//export const staticContainer = new Container();
export const staticChunks = new MDmatrix<Container>(64, 64);
//wc.addChild(staticContainer);

export const app: Application = new Application();

export const blocksEl = $("#ui > #editor .block-row") as HTMLDivElement;

//export const player = new Player(mdshell.game.groups.view, 30, 63);

export const mdshell = new MDshell({
    blockSize,
    gameType: "td",

    atlasData: (await (import.meta.glob<{ default: SpritesheetData; }>("../spritesheet-data/data.json"))["../spritesheet-data/data.json"]()
    ).default,

    atlasImgURL: (await (import.meta.glob<{ default: string; }>("../images/atlas.png"))["../images/atlas.png"]()
    ).default,

    mods: await convertPathToObj(import.meta.glob<{ default: ModInfo; }>("../mods/*/manifest.json")),

    pw,
    app,

    imageBlobSize: Number(getComputedStyle(blocksEl).getPropertyValue("--img-size").slice(0, -2)),

    playerWidth: 30,
    playerHeight: 63,
});

PW.OnResizeChange((x, y) => {
    mdshell.game.groups.view.x += x;
    mdshell.game.groups.view.y += y;
});

pw.addDynamic(mdshell.player);