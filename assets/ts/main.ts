import "./levels/main";
import "./mods";
import { startGame } from "./game/main";

import { Application } from "pixi.js";
import { $ } from "./lib/util";
import "./canvas";

export const app: Application = new Application();

// using await breaks production build
app.init({
    background: "#129fff",
    resizeTo: window,
    antialias: false,
    autoDensity: true,
    height: innerWidth,
    width: innerWidth,
    //powerPreference: "high-performance",
    resolution: devicePixelRatio,
    canvas: $("#c") as HTMLCanvasElement,
}).then(() => {
    startGame(app);
})

