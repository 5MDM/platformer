import { isMobile, Particle } from "pixi.js";
import "./audio";
import { $, clamp, round } from "../lib/misc/util";
import { _MD2engine } from "../lib/v2/engine";
import { md2 } from "../constants";
import { MD2editor } from "../lib/editor/main";
import { MD2envModule } from "../lib/v2/modules/env/main";

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

    const hh = innerHeight / 2;

    md2.modules.env.addParticles({
        name: "glow",
        number: 50,
        tickerF: (o) => {
            MD2envModule.tickerPresets.float(o);
            MD2envModule.tickerPresets.stayInside(o);
        },
        genF(p: Particle, n: number, md2) {
            p.tint = Math.random() * 0xffffff;

            const scale = round(.8 - .5 * Math.abs(Math.sin(n * 5)), 100);
            p.scaleX = scale;
            p.scaleY = scale;

            const [x, y] = MD2envModule.randPresets.disperseScreen(n, md2);
            p.x = x;
            p.y = y;

            p.alpha = .9;
        },
    })
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

addEventListener("keyup", e => {
    if(e.key != "C") return;

    const level = md2.levelManager.exportCurrentLevel();

    level.blocks.push({
        x: 64,
        y: 64,
        w: 1,
        h: 1,
        type: "@",
        rotation: 0,
    });

    navigator.clipboard.writeText(JSON.stringify(level))
        .then(() => alert("Copied level json"))
        .catch(err => alert(err));
    
}, {passive: true});