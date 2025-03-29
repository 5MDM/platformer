import { Container, Sprite, Texture } from "pixi.js";
import { playerCollisionAmnt } from "../lib/physics";
import { $, attatchToggle, round, stopAnimLoop } from "../lib/util";
import { player } from "./main";
import { Graph } from "../lib/graph";
import { app } from "../main";

export var RDtime = 0;
export var deltaTime = 0;
var fps = 1000 / RDtime;

const studio = $("#ui > #studio") as HTMLDivElement;
const px = $("#ui > #studio .bottom #px");
const py = $("#ui > #studio .bottom #py");
const col = $("#ui > #studio .bottom #col");
const fpsEl = $("#ui > #studio .bottom #fps");

var isStudioEnabled = false;
function enableStudio() {
    studio.style.display = "block";
}

function disableStudio() {
    studio.style.display = "none";
}

addEventListener("keypress", e => {
    if(e.key == "p") {
        isStudioEnabled = !isStudioEnabled;
        if(isStudioEnabled) enableStudio(); else disableStudio();
    }
});

export function startStudioLoop() {
    setInterval(loop, 1000 / 10);
    fpsLoop();
}

function loop() {
    fps = 1000 / RDtime;
    px.textContent = round(player.x, 10).toString();
    py.textContent = round(player.y, 10).toString();
    col.textContent = playerCollisionAmnt.toString();
    fpsEl.textContent = Math.round(fps).toString();
}

const expectedFPS = 1000 / 60;
var lastTime = 0;

function fpsLoop() {
    const currentTime = performance.now();
    RDtime = currentTime - lastTime;
    deltaTime = RDtime / expectedFPS;
    lastTime = currentTime;

    requestAnimationFrame(fpsLoop);
}

const graphW = Math.min(innerWidth / 2, 500 + 500/2);
const fpsC = new Container();

const graph = new Graph(graphW, innerHeight - 155, 500, 100, 5, fpsC);
const graphLoop = stopAnimLoop(() => {
    graph.plot(fps);
}, 3);

fpsC.addChild(new Sprite({
    texture: Texture.WHITE,
    x: graphW,
    y: innerHeight - 155,
    width: 500,
    height: 100,
    tint: 0,
    alpha: .5,
    anchor: {x: 0.5, y: 0},
}))

const fpsGraphBtn = $("#ui > #studio #show-fps-graph") as HTMLButtonElement;
attatchToggle(fpsGraphBtn, 
    () => {
        app.stage.addChild(fpsC);
        fpsGraphBtn.textContent = "-";
        graphLoop.start();
    },
    disableGraph
);

function disableGraph() {
    app.stage.removeChild(fpsC);
    fpsGraphBtn.textContent = "+";
    graphLoop.stop();
}