import { AnimatedSprite, Application, Sprite } from "pixi.js";
import { startControlLoop } from "./controls";
import { editorState, startStudioLoop } from "./dev/studio";
import { player, pw, wc } from "../constants";

import "./dev/menu";
import "./dev/modes";
import { MDshell } from "../lib/md-framework/shell";
import { mdshell } from "../main";

async function loadAnimations() {
    const spritesheet = await mdshell.spritesheet;
    spritesheet.textureSource.scaleMode = "nearest";

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

export async function startGame(sh: MDshell) {    
    await loadAnimations();

    sh.app.stage.addChild(wc);
    player.display(sh.app);

    sh.setCurrentLevel("2");
    player.teleport(sh.game.spawnX, sh.game.spawnY);
    
    pw.startClock();
    startControlLoop();
    startStudioLoop();

    editorState.toggle();
}