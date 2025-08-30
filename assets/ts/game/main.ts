import { isMobile } from "pixi.js";
import "./audio";
import "./dev/menu";
import "./dev/modes";
import { $ } from "../lib/misc/util";
import { _MD2engine } from "../lib/v2/engine";
import { md2 } from "../constants";
import { MD2editor } from "../lib/editor/main";

function loadAnimations() {    
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
    loadAnimations();

    md2.levelManager.loadLevel("1");
    
    // startStats();
}

const editor = new MD2editor({
    engine: md2,
    el: $("#ui > #editor-v2-c") as HTMLDivElement,
})

if(isMobile.any) {
    const popup = $("#ui > #audio-popup");
    popup.style.display = "flex";

    popup.addEventListener("touchend", () => {
        popup.style.display = "none";
    }, {once: true});
}