import { Container, Cursor, Sprite, Texture, TilingSprite } from "pixi.js";
import { $, $$, floorToMultiples, snapToGrid, ToggleList, ToggleState } from "../../lib/util";
import { app, mdshell } from "../../main";
import { DragController } from "../../lib/drag";
import { disableControls, enableControls } from "../controls";
import { c } from "../../canvas";
import { copyLevel, finalizeEdits, placeBlock } from "./level-editor";
import { blocksEl, blockSize, player, pw, wc } from "../../constants";
import { scale, startStats, studio } from "./stats";
import { devMoveModeState } from "./move";
import { disableRowEditMode, enableRowEditMode, rowEditHover, rowEditState } from "./row-edit";
import { setGameScale } from "./zoom";

export const studioState = new ToggleState(() => {
    studio.style.display = "block";
}, () => {
    studio.style.display = "none";
});

export const editorState = new ToggleState(() => {
    pw.stopClock();
    app.stage.scale = scale;
    disableControls();
    editorDrag.enable();
    editorEl.style.display = "flex";
    
    if(placementModeState.isToggled) placementModeState.toggle();
    
    editorDrag.changeDefaultandNormalGrab("grab");
    editorDrag.changeDefaultAndNormalGrabbing("grabbing");
}, () => {
    pw.startClock();
    app.stage.scale = 1;
    setGameScale(0);
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

    disableRowEditMode();

    finalizeEdits();
    list!.clear();
    bgList!.clear();

    if(devMoveModeState.isToggled) devMoveModeState.toggle();
});

addEventListener("keydown", e => {
    if(e.key == "p") {
        studioState.toggle();
    } else if(e.key == "l") {
        editorState.toggle();
    } else if(e.key == "C") {
        copyLevel();
    } else if(e.key == "m") {
        if(!devMoveModeState.isToggled) devMoveModeState.toggle();
    } else if(e.key == "Escape") {
        if(devMoveModeState.isToggled) devMoveModeState.toggle();
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

export var selectedBlock: string | undefined;
export const selectedSprite: TilingSprite = new TilingSprite({
    x: 0,
    y: 0,
    width: blockSize,
    height: blockSize,
    texture: Texture.WHITE,
    zIndex: -1,
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
        if(!placementModeState.isToggled) placementModeState.toggle();

        selectedBlock = el.getAttribute("data-name")!;
        el.classList.add("toggled");
        selectedBlockIsPassable = false;

        selectedSprite.texture = mdshell.getTexture(selectedBlock!);
        selectedSprite.tileScale = {
            x: blockSize / selectedSprite.texture.width,
            y: blockSize / selectedSprite.texture.height,
        };

    }, (el) => {
        el.classList.remove("toggled");
    }, blocksEl);

    bgList = new ToggleList(bgImages, (el) => {
        if(!placementModeState.isToggled) placementModeState.toggle();
        
        selectedBlock = el.getAttribute("data-name")!;
        el.classList.add("toggled");

        selectedBlockIsPassable = true;

        selectedSprite.texture = mdshell.getTexture(selectedBlock!);
        selectedSprite.tileScale = {
            x: blockSize / selectedSprite.texture.width,
            y: blockSize / selectedSprite.texture.height,
        };
    }, (el) => {
        el.classList.remove("toggled");
    }, bgRow);

    blocksEl.prepend($$("button", {
        text: "Pan",
        up() {
            list.clear();
            bgList.clear();
            if(placementModeState.isToggled) placementModeState.toggle();
        },
    }));

    bgRow.prepend($$("button", {
        text: "Pan",
        up() {
            list.clear();
            bgList.clear();
            if(placementModeState.isToggled) placementModeState.toggle();
        },
    }));
}

editorDrag.downElement.addEventListener("mousemove", ({x, y}) => {
    if(!placementModeState.isToggled) return;
    if(rowEditState.isToggled) rowEditHover(x, y);
    else placeHover(x, y);
});

export const placementModeState = new ToggleState(() => {
    if(rowEditState.isToggled) {
        enableRowEditMode();
    } else {
        editorDrag.onDrag = placeBlock;
    }

    editorDrag.changeDefaultAndNormalGrabbing("pointer");
    editorDrag.changeDefaultandNormalGrab("crosshair");

    app.stage.addChild(selectedSprite);
}, () => {
    editorDrag.onDrag = editorPan;
    app.stage.removeChild(selectedSprite);

    editorDrag.changeDefaultandNormalGrab("grab");
    editorDrag.changeDefaultAndNormalGrabbing("grabbing");
});

export function startStudioLoop() {
    startStats();
}
