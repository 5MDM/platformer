import { Application, Container, Texture } from "pixi.js";
import { PW } from "../lib/physics";
import { PWD, PWS } from "../lib/pw-objects";
import { Player } from "../lib/player";
import { startControlLoop } from "./controls";
import { startStudioLoop } from "./studio";
import { levelTextMap, setCurrentLevel } from "../levels/main";

import { levelmap, setWorldBase } from "../mods";

const objSize = 25;

export const wc = new Container();
export const player = new Player(objSize, objSize);

export const pw = new PW({
    gx: 0,
    gy: 0,
    simSpeed: 1000 / 60,
});

pw.addDynamic(player);

function createDynamic(x: number, y: number): PWD {
    const obj = new PWD(x, y, objSize, objSize);
    obj.setTexture(Texture.WHITE);
    obj.toContainer(wc);
    pw.addDynamic(obj);
    return obj;
}

function createStatic(x: number, y: number): PWS {
    const obj = new PWS(x, y, objSize, objSize);
    obj.setTexture(Texture.WHITE);
    obj.toContainer(wc);
    pw.addStatic(obj);
    return obj;
}

setWorldBase(wc, pw);

export function startGame(app: Application) {    
    app.stage.addChild(wc);
    player.display(app);

    setCurrentLevel("3");
    
    pw.startClock();
    startControlLoop();
    startStudioLoop();
}