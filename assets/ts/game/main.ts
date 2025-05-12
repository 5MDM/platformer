import { AnimatedSprite, Application, Sprite } from "pixi.js";
import { startControlLoop } from "./controls";
import { startStudioLoop } from "./dev/studio";
import { setCurrentLevel } from "../levels/main";

import { spritesheet } from "../mods";
import { playerStartX, playerStartY } from "../main";
import { player, pw, wc } from "../constants";

import "./dev/menu";

function loadAnimations() {
    const walkR = new AnimatedSprite(spritesheet.animations["player-side-walk"]);
    walkR.scale.x = -1;
    walkR.position.x = 30;

    player.setAnimation("walk-ud-down", new AnimatedSprite(spritesheet.animations["player-down-walk"]));
    player.setAnimation("walk-ud-up", new AnimatedSprite(spritesheet.animations["player-up-walk"]));
    player.setAnimation("walk-l", new AnimatedSprite(spritesheet.animations["player-side-walk"]));
    player.setAnimation("walk-r", walkR);
    player.setSprite("stand-ud-down", new Sprite(spritesheet.textures["player-down-stand.png"]));
    player.setSprite("stand-ud-up", new Sprite(spritesheet.textures["player-up-stand.png"]));


}

export function startGame(app: Application) {    
    spritesheet.textureSource.scaleMode = "nearest";
    loadAnimations();

    app.stage.addChild(wc);
    player.display(app);

    setCurrentLevel("3");
    player.teleport(playerStartX, playerStartY);
    
    pw.startClock();
    startControlLoop();
    startStudioLoop();
}