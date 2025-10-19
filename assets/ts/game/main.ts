import { isMobile, Particle, Sprite } from "pixi.js";
import "./audio";
import { $, clamp, round } from "../lib/misc/util";
import { _MD2engine } from "../lib/v2/engine";
import { md2 } from "../constants";
import { MD2editor } from "../lib/editor/main";
import { MD2envModule } from "../lib/v2/modules/env/main";

MD2editor.creatorToolsState.disableIfOn();

const player = md2.generator.player;

function loadAnimations() {   
    const walkR = md2.dataManager.getAnimation("player-side-walk");
    walkR.scale.x = -1;
    walkR.position.x = 30;

    player.animController.registerAnimationsWithSameSpeed(md2.dataManager, 0.18, [
        ["td-walk-r", walkR],
        ["td-walk-d", "player-down-walk"],
        ["td-walk-u", "player-up-walk"],
        ["td-walk-l", "player-side-walk"],
    ]);

    player.animController.registerStance("td-stand-d", md2.dataManager.getSprite("player-down-stand.png"));
    player.animController.registerStance("td-stand-u", md2.dataManager.getSprite("player-up-stand.png"));
    player.animController.setAction("td-stand-d");
}

export async function startGame(md2: _MD2engine) { 
    loadAnimations();

    md2.levelManager.loadLevel("1");

    md2.modules.env.addParticles({
        name: "glow",
        number: 16,
        tickerF: (o) => {
            MD2envModule.tickerPresets.float(o);
            MD2envModule.tickerPresets.stayInside(o);
        },
        genF(p: Particle, n: number, md2) {
            p.tint = Math.random() * 0xffffff;

            const scale = round(.8 - .5 * Math.abs(Math.sin(n * 5)), 100);
            p.scaleX = scale;
            p.scaleY = scale;

            const [x, y] = MD2envModule.randPresets.disperseScreenS1(n, md2, 16);
            p.x = x;
            p.y = y;

            p.anchorX = .5;
            p.anchorY = .5;

            p.alpha = .9;
        },
    });

    const glow = new Sprite({
        texture: md2.modules.env.getParticle("glow"),
        anchor: .5,
        scale: {x: 7, y: 7},
        position: {x: md2.generator.player.halfW, y: md2.generator.player.halfH},
    });
    
    //md2.levelManager.groups.static.addChild(glow);
    md2.generator.player.container.addChild(glow);
    md2.levelManager.groups.static.mask = glow;
}

const editor = new MD2editor({
    engine: md2,
    el: $("#ui > #editor-v2-c") as HTMLDivElement,
});

if(isMobile.any) {
    const popup = $("#ui > #audio-popup");
    popup.style.display = "flex";

    popup.addEventListener("touchend", () => {
        popup.style.display = "none";
    }, {once: true});
}

addEventListener("keyup", e => {
    if(e.key == "C") copy();
    else if(e.key == "V") paste();
}, {passive: true});

function paste() {
    navigator.clipboard.readText()
    .then(val => {
        if(!val) return;
        try {
            JSON.parse(val);
        } catch(err) {
            return;
        }

        md2.levelManager.loadLevelFromJSONstring(val);
    })
}

function copy() {
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
}