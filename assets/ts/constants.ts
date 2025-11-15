import { Application, Container, SpritesheetData, WebGLRenderer } from "pixi.js";
import { $, convertPathToObj } from "./lib/misc/util";
import { MDmatrix } from "./lib/misc/matrix";
import { MD2 } from "./lib/v2/main";
import { Mod, ModInfo } from "./lib/v2/types";
import { Joystick } from "./lib/misc/joystick";
import { c } from "./canvas";

export const chunkSize = 16;
export const blockSize = 2**6;
export const blockSizeHalf = blockSize / 2;
export const blockSizeQuarter = blockSizeHalf / 2;

export const maxLevelSize = 256;

export const staticChunks = new MDmatrix<Container>(64, 64);

export const webglC: WebGL2RenderingContext = c.getContext("webgl2", {
    alpha: true,
    stencil: true,
    antialias: false,
    powerPreference: "high-performance",
} as WebGLContextAttributes)!;

if(!webglC) {
    alert("WebGL2 is not supported in this browser. Use a new device or browser");
    throw new Error("WebGL2 is not supported in this browser. Use a new device or browser");
}

export const app: Application = new Application<WebGLRenderer<HTMLCanvasElement>>();

export const md2 = new MD2.Engine({
    engine: {
        blockSize: 32,
        app,
        joystick: new Joystick({
            target: $("#ui > #joystick") as HTMLDivElement,
            size: 40,
            innerColor: "cyan",
            outerColor: "rgba(100, 100, 255, .5)",
            max: 80,

        }),
    },
    dataManager: {
        // atlasData: (await (import.meta.glob<{default: SpritesheetData}>
        //     ("../spritesheet-data/data.json"))["../spritesheet-data/data.json"]()
        // ).default,
        // atlasImgURL: (await (import.meta.glob<{ default: string; }>
        //     ("../images/spritesheet.png"))["../images/spritesheet.png"]()
        // ).default,
        mods: await convertPathToObj(import.meta.glob<{ default: ModInfo; }>("../mods/*/manifest.json")),
        manifestFiles: await convertPathToObj(import.meta.glob<{default: Mod.ManifestV0_1_x}>("../mods/*/manifestv2.json"))
    },
    physics: {
        simSpeed: 1000 / 60,
        smoothing: .5,
    },
    gui: {
        target: $("#ui > #md2-gui-target") as HTMLDivElement,
    }
});
