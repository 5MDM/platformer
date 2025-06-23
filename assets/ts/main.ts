import { startGame } from "./game/main";
import { c } from "./canvas";
import { app, mdshell, pw } from "./constants";
import { initLevels } from "./game/levels";
import { editorTools } from "./game/dev/studio";

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

    addEventListener("orientationchange", () => {
        app.renderer.resize(innerWidth, innerHeight, devicePixelRatio);
    });

    mdshell.init()
    .then(() => {
        app.stage.addChild(mdshell.game.container);

        mdshell.getBlocksAsImages()
        .then(async images => {
            editorTools.init(images);
            startGame(mdshell);
        });
    });
});