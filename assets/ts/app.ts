import { Application } from "pixi.js";
import { $ } from "./lib/util";
import "./canvas";
import { startGame } from "./game/main";
import "./levels/main";

export const app = new Application();

await app.init({
    background: "#129fff",
    resizeTo: window,
    antialias: false,
    autoDensity: true,
    height: innerWidth,
    width: innerWidth,
    powerPreference: "high-performance",
    resolution: devicePixelRatio,
    canvas: $("#c") as HTMLCanvasElement,
});

export const LPRs: Promise<any>[] = [];
