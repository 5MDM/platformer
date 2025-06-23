import { Texture, TilingSprite } from "pixi.js";
import { $, $$, ToggleList, ToggleState } from "../../lib/util";
import { app, blockSizeHalf, maxLevelSize } from "../../constants";
import { mdshell } from "../../constants";
import { DragController } from "../../lib/drag";
import { c } from "../../canvas";
import { blocksEl, blockSize, player, pw } from "../../constants";
import { scale, startStats, studio } from "./stats";
import { gameScale, setGameScale } from "./zoom";
import { devRotate } from "./rotate";
import { promptLevelInput } from "./level-inserter";
import { EditorTools } from "../../lib/md-framework/editor-tools";
import { LevelJSONoutput } from "../../lib/md-framework/shell";

export var areControlsEnabled = true;

export const controlState = new ToggleState(
    () => areControlsEnabled = true,
    () => areControlsEnabled = false,
    true,
);

const bgRow = $("#ui > #editor > #bg-row") as HTMLDivElement;
export const editorEl = $("#ui > #editor") as HTMLElement;

export const editorTools = new EditorTools({
    shell: mdshell,
    keybinds: {
        z: "multi placement",
        l: "level editor",
        m: "movement",
        x: "edit",
        r: "rotate left",
        R: "rotate right",
        P: "pan",
    },
    dragController: new DragController({
        touchEl: c,
        isMultitouch: false,
        enabled: false,
    }),
    controlState,
    editorEl,
    devSprite: new TilingSprite({
        x: 0,
        y: 0,
        width: blockSize,
        height: blockSize,
        texture: Texture.WHITE,
        zIndex: 3,
        visible: false,
        pivot: blockSizeHalf,
    }),
    gameScaleF: setGameScale,
    onRotate: devRotate,
    fgListEl: blocksEl,
    bgListEl: bgRow,
    gameScale,
    maxLevelSize,
    moveStateImg:  $("#ui > #move-arrow") as HTMLImageElement,
});

export const studioState = new ToggleState(() => {
    studio.style.display = "block";
}, () => {
    studio.style.display = "none";
});

addEventListener("keydown", e => {
    if(e.key == "p") {
        studioState.toggle();
    } else if(e.key == "C") {
        copyLevel();
    } else if(e.key == "m") {
        editorTools.movementState.enableIfOff();
    } else if(e.key == "Escape") {
        editorTools.movementState.disableIfOn();
    } else if(e.key == "L") {
        promptLevelInput();
    }
});

export function startStudioLoop() {
    startStats();
}

export function copyLevel() {
    const arr: LevelJSONoutput[] = mdshell.game.getBlocksAsArray();

    arr.push({
        x: 64,
        y: 64,
        w: 1,
        h: 1,
        type: "@",
        rotation: 0,
    });

    navigator.clipboard.writeText(JSON.stringify(arr))
        .then(() => alert("Copied level json"))
        .catch(err => alert(err));
}

const cat = $("#ui > #editor > #cat") as HTMLDivElement;
const catList = new ToggleList([
    $$("button", {
        text: "Foreground",
        attrs: { "data-type": "fg-row" },
    }),
    $$("button", {
        text: "Background",
        attrs: { "data-type": "bg-row" },
    }),
], el => {
    const type = el.getAttribute("data-type")!;
    const row = $("#ui > #editor > #" + type) as HTMLDivElement;
    row.style.display = "flex";

    el.classList.add("toggled");
}, el => {
    const type = el.getAttribute("data-type")!;
    const row = $("#ui > #editor > #" + type) as HTMLDivElement;
    row.style.display = "none";

    el.classList.remove("toggled");
}, cat);
