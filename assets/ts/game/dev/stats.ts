import { Container, Sprite, Texture } from "pixi.js";
import { $, attatchToggle, round, stopAnimLoop } from "../../lib/util";
import { mdshell } from "../../constants";
import { Graph } from "../../lib/graph";
import { editorTools, studioState } from "./studio";

export function startStats() {
    setInterval(loop, 1000 / 10);
    fpsLoop();
}

var fps = 1;
var isFpsLoaded = false;

const ogFpsLoadCounter = 60;
var fpsLoadCounter = 60;

function loop() {
    //fps = 1000 / RDtime;

    if(!studioState.isToggled) return;
    px.textContent = round(mdshell.player.x, 10).toString();
    py.textContent = round(mdshell.player.y, 10).toString();
    if(isFpsLoaded) fpsEl.textContent = Math.round(fps).toString();
    else fpsEl.textContent = "Loading...";
}

const expectedFPS = 1000 / 60;
var lastTime = 0;

const frames: number[] = [];

function fpsLoop() {
    const currentTime = performance.now();
    RDtime = currentTime - lastTime;
    deltaTime = RDtime / expectedFPS;
    lastTime = currentTime;

    if(studioState.isToggled || isGraphEnabled) {
        if(--fpsLoadCounter <= 0) {
            isFpsLoaded = true;
            fpsLoadCounter = ogFpsLoadCounter;
        }

        frames.push(currentTime);
        while(frames.length > 0 && frames[0] < currentTime - 1000) frames.shift();


        if(isFpsLoaded) fps = Math.max(0, frames.length - 1);
    } else {
        isFpsLoaded = false;
        fps = NaN;
        fpsLoadCounter = ogFpsLoadCounter;
    }

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

var isGraphEnabled = false;
const fpsGraphBtn = $("#ui > #studio #show-fps-graph") as HTMLButtonElement;
attatchToggle(fpsGraphBtn, 
    () => {
        mdshell.app.stage.addChild(fpsC);
        fpsGraphBtn.textContent = "-";
        graphLoop.start();
        isGraphEnabled = true;
    },
    disableGraph
);

function disableGraph() {
    mdshell.app.stage.removeChild(fpsC);
    fpsGraphBtn.textContent = "+";
    graphLoop.stop();
    isGraphEnabled = false;
}

export var RDtime = 0;
export var deltaTime = 0;
export const scale = 1;
export const studio = $("#ui > #studio") as HTMLDivElement;
const px = $("#ui > #studio .bottom #px");
const py = $("#ui > #studio .bottom #py");
const fpsEl = $("#ui > #studio .bottom #fps");

