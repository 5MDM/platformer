import "./levels/main";
import { startGame } from "./game/main";
import { Application, SpritesheetData } from "pixi.js";
import { c } from "./canvas";
import { initStudio } from "./game/dev/studio";
import { MDshell, ModInfo } from "./lib/md-framework/shell";
import { blocksEl, blockSize, pw } from "./constants";
import { convertPathToObj } from "./lib/util";
import { initLevels } from "./levels/main";

export const mainPromises: Promise<any>[] = [];
export const app: Application = new Application();

export function addMainPromise(...pr: Promise<any>[]) {
    for(const i of pr) mainPromises.push(i);
}

export var playerStartX = 0;
export var playerStartY = 0;

export function setPlayerSpawn(x: number, y: number) {
    playerStartX = x;
    playerStartY = y;
}

export const mdshell = new MDshell({
    blockSize,
    gameType: "td",

    atlasData: (await (import.meta.glob<{default: SpritesheetData}>
        ("../spritesheet-data/data.json"))
        ["../spritesheet-data/data.json"]()
    ).default,

    atlasImgURL: (await (import.meta.glob<{default: string}>
        ("../images/atlas.png"))
        ["../images/atlas.png"]()
    ).default,

    mods: await convertPathToObj(import.meta.glob<{default: ModInfo}>("../mods/*/manifest.json")),

    pw,
    app,

    imageBlobSize: Number(getComputedStyle(blocksEl).getPropertyValue("--img-size").slice(0, -2)),
});

// using await breaks production build
// 129fff
app.init({
    background: "#000",
    resizeTo: window,
    antialias: false,
    autoDensity: true,
    height: innerWidth,
    width: innerWidth,
    powerPreference: "high-performance",
    resolution: devicePixelRatio,
    canvas: c,
    roundPixels: true,
}).then(async () => {
    initLevels(mdshell);

    mdshell.init()
    .then(() => {
        mdshell.getBlocksAsImages()
        .then(async images => {
            initStudio(images);
            startGame(mdshell);
        });
    });
});