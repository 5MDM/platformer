import "./levels/main";
import { startGame } from "./game/main";
import { Application, Texture, TextureSource } from "pixi.js";
import { $, MDmatrix } from "./lib/util";
import "./canvas";
import { initMods } from "./mods";
import { PW } from "./lib/physics";
import { Player } from "./lib/player";
import { c } from "./canvas";
import { initStudio } from "./game/dev/studio";

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

// using await breaks production build
app.init({
    background: "#129fff",
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
    const blockList = await initMods();
    initStudio(blockList);

    startGame(app);
});