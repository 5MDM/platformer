import { isMobile } from "pixi.js";
import "./audio";
import "./dev/menu";
import "./dev/modes";
import { $ } from "../lib/misc/util";
import { startStats } from "./dev/stats";
import { _MD2engine } from "../lib/v2/engine";
import "./editor";

export var engine: _MD2engine;

function loadAnimations(md2: _MD2engine) {    
    const walkR = md2.dataManager.getAnimation("player-side-walk");
    walkR.scale.x = -1;
    walkR.position.x = 30;

    md2.generator.player.setAnimation("walk-r", walkR);
    md2.generator.player.setAnimation("walk-ud-down", md2.dataManager.getAnimation("player-down-walk"));
    md2.generator.player.setAnimation("walk-ud-up", md2.dataManager.getAnimation("player-up-walk"));
    md2.generator.player.setAnimation("walk-l", md2.dataManager.getAnimation("player-side-walk"));

    md2.generator.player.setSprite("stand-ud-down", md2.dataManager.getSprite("player-down-stand.png"));
    md2.generator.player.setSprite("stand-ud-up", md2.dataManager.getSprite("player-up-stand.png"));

    md2.generator.player.changeStance("stand-ud-down");
}

export async function startGame(md2: _MD2engine) { 
    engine = md2;
    loadAnimations(md2);

    md2.levelManager.loadLevel("1");
    
    startStats();
}

if(isMobile.any) {
    const popup = $("#ui > #audio-popup");
    popup.style.display = "flex";

    popup.addEventListener("touchend", () => {
        popup.style.display = "none";
    }, {once: true});
}