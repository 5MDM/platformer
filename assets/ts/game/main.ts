import { AnimatedSprite, Application, Assets, Container, Sprite, Spritesheet, SpritesheetData, Texture } from "pixi.js";
import { PW } from "../lib/physics";
import { PWD, PWS } from "../lib/pw-objects";
import { Player } from "../lib/player";
import { startControlLoop } from "./controls";
import { startStudioLoop } from "./studio";
import { levelTextMap, setCurrentLevel } from "../levels/main";

import { levelmap, setWorldBase } from "../mods";

const objSize = 25;
const im = import.meta.glob<{default: SpritesheetData}>("../../spritesheet-data/data.json");
const te = import.meta.glob<{default: string}>("../../images/atlas.png");
const teName = (await te["../../images/atlas.png"]()).default;

const playerTexture = new Spritesheet(
    await Assets.load(teName),
    (await im["../../spritesheet-data/data.json"]()).default
);

await playerTexture.parse();

playerTexture.textureSource.scaleMode = "nearest";

export const wc = new Container();
export const player = new Player(30, 63);
const walkR = new AnimatedSprite(playerTexture.animations["player-side-walk"]);
walkR.scale.x = -1;
walkR.position.x = 30;

player.setAnimation("walk-ud", new AnimatedSprite(playerTexture.animations["player-down-walk"]));
player.setAnimation("walk-l", new AnimatedSprite(playerTexture.animations["player-side-walk"]));
player.setAnimation("walk-r", walkR);
player.setSprite("stand-ud", new Sprite(playerTexture.textures["player-down-stand.png"]));

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