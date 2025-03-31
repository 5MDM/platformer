import { AnimatedSprite, Application, Assets, Container, Spritesheet, SpritesheetData, Texture } from "pixi.js";
import { PW } from "../lib/physics";
import { PWD, PWS } from "../lib/pw-objects";
import { Player } from "../lib/player";
import { startControlLoop } from "./controls";
import { startStudioLoop } from "./studio";
import { levelTextMap, setCurrentLevel } from "../levels/main";

import { levelmap, setWorldBase } from "../mods";

const objSize = 25;
const im = import.meta.glob<{default: SpritesheetData}>("../../spritesheet-data/*.json");
const te = import.meta.glob<{default: string}>("../../images/entities/*.png");
const teName = (await te["../../images/entities/walk-td.png"]()).default;

const playerTexture = new Spritesheet(
    await Assets.load(teName),
    (await im["../../spritesheet-data/walk-td.json"]()).default
);

await playerTexture.parse();

export const wc = new Container();
export const player = new Player(30, 63);
player.setAnimation("walk", new AnimatedSprite(playerTexture.animations.walk));

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