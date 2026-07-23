import { isMobile, Particle, Sprite } from "pixi.js";
import "./audio";
import { $, round } from "../lib/misc/util";
import { _MD2engine } from "../lib/v2/engine";
import { md2 } from "../constants";
import { MD2envModule } from "../lib/v2/modules/env/main";
import { MD2devAutomation } from "../lib/v2/automation";
import { MD2editorV2 } from "../lib/editor/v2/editor";
import { MDV } from "../lib/misc/vectors/vectors";
import { MD2lightFilter } from "../lib/v2/filters/lighting/lights";

const editor = new MD2editorV2(md2, $("#ui > #editor-v2-c"));

const player = md2.generator.player;

// problems with the atlas generator:
// 1. Animation names don't have dashes in them
// 2. Animation arrays have items without the ".png" ending

function loadAnimations() {  
    const walkR = md2.dataManager.getAnimation("player-side-walk");
    walkR.scale.x = -1;
    walkR.position.x = 30;

    player.animController.registerAnimationsWithSameSpeed(md2.dataManager, 0.12, [
        ["td-walk-r", walkR],
        ["td-walk-d", "player-down-walk"],
        ["td-walk-u", "player-up-walk"],
        ["td-walk-l", "player-side-walk"],
    ]);

    player.animController.registerStance("td-stand-d", md2.dataManager.getSprite("player-down-stand.png"));
    player.animController.registerStance("td-stand-u", md2.dataManager.getSprite("player-up-stand.png"));
    player.animController.setAction("td-stand-d");
}

const staticC = md2.levelManager.groups.static;

const followingLight = new MD2lightFilter({
    radius: 7,
    brightness: 1,
    pos: new MDV.V2(innerWidth / 2, innerHeight / 2)
    .add(new MDV.V2(player.halfW, player.halfH)),
    viewPos: MDV.V2.fromPoint(player),
    adjustForDPR: true,
});

staticC.filters = [followingLight];

export async function startGame(md2: _MD2engine) { 
    loadAnimations();

    md2.levelManager.loadLevel("1");
    //md2.levelManager.loadLevel("2");
    //md2.levelManager.loadLevel("test");

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
        //zIndex: -1,
    });

    // staticC.mask = glow;
    // player.container.addChild(glow);

    // new MD2devAutomation(md2)
    // .deleteCurrentLevel(self =>
    //     self.loadLevel("2")
    // );

    globalThis.MD2devAutomation = new MD2devAutomation(md2);
}

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