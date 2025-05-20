import { Container, Cursor, Sprite, Texture } from "pixi.js";
import { playerCollisionAmnt } from "../../lib/physics";
import { $, $$, attatchToggle, floorToMultiples, round, snapToGrid, ToggleList } from "../../lib/util";
import { Graph } from "../../lib/graph";
import { app, mdshell } from "../../main";
import { DragController } from "../../lib/drag";
import { disableControls, enableControls } from "../controls";
import { c } from "../../canvas";
import { copyLevel, finalizeEdits, placeBlock } from "./level-editor";
import { blocksEl, blockSize, player, pw, wc } from "../../constants";
import { scale, startStats, studio } from "./stats";
import { disableDevMove, toggleDevMove } from "./move";

var isStudioEnabled = false;
export var isEditorEnabled = false;
function enableStudio() {
    studio.style.display = "block";
}

function disableStudio() {
    studio.style.display = "none";
}

export function toggleStudio() {
    isStudioEnabled = !isStudioEnabled;
    if(isStudioEnabled) enableStudio(); else disableStudio();
}

export function toggleLevelEditor() {
    isEditorEnabled = !isEditorEnabled;
    if(isEditorEnabled) enableEditor(); else disableEditor();
}

addEventListener("keydown", e => {
    if(e.key == "p") {
        toggleStudio();
    } else if(e.key == "l") {
        toggleLevelEditor();
    } else if(e.key == "C") {
        copyLevel();
    } else if(e.key == "m") {
        toggleDevMove();
    } else if(e.key == "Escape") {
        disableDevMove();
    }
});

export const editorDrag = new DragController({
    touchEl: c,
    isMultitouch: false,
    enabled: false,
});

editorDrag.defaultGrab = "grab";
editorDrag.defaultGrabbing = "grabbing";
editorDrag.onDrag = editorPan;

export function editorPan(x: number, y: number) {
    app.stage.position.x -= x;
    app.stage.position.y -= y;
}

function placeHover(x: number, y: number) {
    const fx = snapToGrid(x - app.stage.position.x, wc.position.x, blockSize);
    const fy = snapToGrid(y - app.stage.position.y, wc.position.y, blockSize);

    const cursorX = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;

    const bool = pw.staticGrid.isOOB(cursorX, cursorY);
    editorDrag.CAD(bool);

    selectedSprite.position.set(fx, fy);
}

export var selectedBlockIsPassable = false;

const bgRow = $("#ui > #editor > #bg-row") as HTMLDivElement;
export const editorEl = $("#ui > #editor") as HTMLElement;

var isOnPlacementMode = false;
export var selectedBlock: string | undefined;
export const selectedSprite: Sprite = new Sprite({
    width: blockSize,
    height: blockSize,
    scale,
    texture: Texture.WHITE,
    alpha: .6,
});

var list: ToggleList;
var bgList: ToggleList;

export function initStudio(images: HTMLImageElement[]) {
    const fgImages: HTMLImageElement[] = [];
    const bgImages: HTMLImageElement[] = [];

    for(const image of images) {
        const name = image.getAttribute("data-name")!;
        const {isPassable} = mdshell.getBlockInfo(name);

        if(isPassable) bgImages.push(image);
        else fgImages.push(image);
    }

    list = new ToggleList(fgImages, (el) => {
        enablePlacementMode();
        selectedBlock = el.getAttribute("data-name")!;
        el.classList.add("toggled");
        selectedBlockIsPassable = false;

        selectedSprite.texture = mdshell.getTexture(selectedBlock!);
    }, (el) => {
        el.classList.remove("toggled");
    }, blocksEl);

    bgList = new ToggleList(bgImages, (el) => {
        enablePlacementMode();
        selectedBlock = el.getAttribute("data-name")!;
        el.classList.add("toggled");

        selectedBlockIsPassable = true;

        selectedSprite.texture = mdshell.getTexture(selectedBlock!);
    }, (el) => {
        el.classList.remove("toggled");
    }, bgRow);

    blocksEl.prepend($$("button", {
        text: "editorPan",
        up() {
            list.clear();
            bgList.clear();
            disablePlacementMode();
        },
    }));

    bgRow.prepend($$("button", {
        text: "editorPan",
        up() {
            list.clear();
            bgList.clear();
            disablePlacementMode();
        },
    }));
}

editorDrag.downElement.addEventListener("mousemove", ({x, y}) => {
    if(!isOnPlacementMode) return;
    placeHover(x, y);
});

export function enablePlacementMode() {
    if(isOnPlacementMode) return;
    isOnPlacementMode = true;
    editorDrag.onDrag = placeBlock;

    editorDrag.changeDefaultAndNormalGrabbing("pointer");
    editorDrag.changeDefaultandNormalGrab("crosshair");

    app.stage.addChild(selectedSprite);
}

function disablePlacementMode() {
    if(!isOnPlacementMode) return;
    isOnPlacementMode = false;

    editorDrag.onDrag = editorPan;
    app.stage.removeChild(selectedSprite);

    editorDrag.changeDefaultandNormalGrab("grab");
    editorDrag.changeDefaultAndNormalGrabbing("grabbing");
}

function enableEditor() {
    pw.stopClock();
    app.stage.scale = scale;
    disableControls();
    editorDrag.enable();
    editorEl.style.display = "flex";
    
    disablePlacementMode();

    editorDrag.changeDefaultandNormalGrab("grab");
    editorDrag.changeDefaultAndNormalGrabbing("grabbing");
}

function disableEditor() {
    pw.startClock();
    app.stage.scale = 1;
    editorDrag.disable();
    app.stage.position.x = 0;
    app.stage.position.y = 0;
    enableControls();
    editorEl.style.display = "none";

    if(!selectedSprite) throw new Error("What did you do");
    app.stage.removeChild(selectedSprite);

    editorDrag.changeDefaultAndNormalGrabbing("default");
    editorDrag.changeDefaultandNormalGrab("default");
    editorDrag.setCursorToDefault();

    finalizeEdits();
    list!.clear();

    disableDevMove();
}

export function startStudioLoop() {
    startStats();
}
