import { AnimatedSprite, isMobile, Sprite } from "pixi.js";
import { startControlLoop } from "./controls";
import { pw } from "../constants";
import "./audio";
import "./dev/menu";
import "./dev/modes";
import { MDshell } from "../lib/md-framework/shell";
import { mdshell } from "../constants";
import { $ } from "../lib/util";
import { startStats } from "./dev/stats";

async function loadAnimations() {
    const spritesheet = await mdshell.spritesheet;
    spritesheet.textureSource.scaleMode = "nearest";

    const walkR = new AnimatedSprite(spritesheet.animations["player-side-walk"]);
    walkR.scale.x = -1;
    walkR.position.x = 30;

    mdshell.player.setAnimation("walk-ud-down", new AnimatedSprite(spritesheet.animations["player-down-walk"]));
    mdshell.player.setAnimation("walk-ud-up", new AnimatedSprite(spritesheet.animations["player-up-walk"]));
    mdshell.player.setAnimation("walk-l", new AnimatedSprite(spritesheet.animations["player-side-walk"]));
    mdshell.player.setAnimation("walk-r", walkR);
    mdshell.player.setSprite("stand-ud-down", new Sprite(spritesheet.textures["player-down-stand.png"]));
    mdshell.player.setSprite("stand-ud-up", new Sprite(spritesheet.textures["player-up-stand.png"]));
}

export async function startGame(sh: MDshell) { 
    await loadAnimations();
    
    mdshell.player.displayTo(mdshell.game.groups.world);

    sh.setCurrentLevel("1");

    sh.player.teleport(sh.game.spawnX, sh.game.spawnY);
    
    pw.startClock();
    
    startControlLoop();
    
    startStats(); 
}

if(isMobile.any) {
    const popup = $("#ui > #audio-popup");
    popup.style.display = "flex";

    popup.addEventListener("touchend", () => {
        popup.style.display = "none";
    }, {once: true});
}