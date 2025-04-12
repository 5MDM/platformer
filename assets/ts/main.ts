import "./levels/main";
import "./mods";
import { startGame } from "./game/main";

import { Application, Assets, Spritesheet, SpritesheetData } from "pixi.js";
import { $ } from "./lib/util";
import "./canvas";
import { iterate, levelPromises } from "./levels/main";
import { spritesheet } from "./mods";

export const app: Application = new Application();

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
    canvas: $("#c") as HTMLCanvasElement,
    roundPixels: true,
}).then(async () => {
    await iterate;
    
    spritesheet.textureSource.scaleMode = "nearest";

    Promise.all(levelPromises).then(() => startGame(app));
})

