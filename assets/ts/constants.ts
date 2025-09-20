import { Application, Container, SpritesheetData } from "pixi.js";
import { $, convertPathToObj } from "./lib/misc/util";
import { MDmatrix } from "./lib/misc/matrix";
import { MD2 } from "./lib/v2/main";
import { ModInfo } from "./lib/v2/types";
import { Joystick } from "./lib/misc/joystick";

export const chunkSize = 16;
export const blockSize = 2**6;
export const blockSizeHalf = blockSize / 2;
export const blockSizeQuarter = blockSizeHalf / 2;

export const maxLevelSize = 256;

export const staticChunks = new MDmatrix<Container>(64, 64);

export const app: Application = new Application();

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
        atlasData: (await (import.meta.glob<{default: SpritesheetData}>
            ("../spritesheet-data/data.json"))["../spritesheet-data/data.json"]()
        ).default,
        atlasImgURL: (await (import.meta.glob<{ default: string; }>
            ("../images/spritesheet.png"))["../images/spritesheet.png"]()
        ).default,
        mods: await convertPathToObj(import.meta.glob<{ default: ModInfo; }>("../mods/*/manifest.json")),
    },
    physics: {
        simSpeed: 1000 / 60,
        smoothing: .5,
    },
});
