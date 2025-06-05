import "./levels/main";
import { startGame } from "./game/main";
import { c } from "./canvas";
import { initStudio } from "./game/dev/studio";
import { app, blockSize, mdshell, pw } from "./constants";
import { initLevels } from "./levels/main";

export const mainPromises: Promise<any>[] = [];
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
        app.stage.addChild(mdshell.game.container);

        mdshell.getBlocksAsImages()
        .then(async images => {
            initStudio(images);
            startGame(mdshell);
        });
    });
});