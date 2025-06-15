import { Container, Cursor, Sprite, Texture, TilingSprite } from "pixi.js";
import { $, $$, floorToMultiples, snapToGrid, ToggleList, ToggleState } from "../../lib/util";
import { app, blockSizeHalf } from "../../constants";
import { mdshell } from "../../constants";
import { DragController } from "../../lib/drag";
import { disableControls, enableControls } from "../controls";
import { c } from "../../canvas";
import { copyLevel, finalizeEdits, placeBlock } from "./level-editor";
import { blocksEl, blockSize, player, pw } from "../../constants";
import { scale, startStats, studio } from "./stats";
import { devMoveModeState } from "./move";
import { disableRowEditMode, enableRowEditMode, rowEditHover, rowEditState } from "./row-edit";
import { gameScale, setGameScale } from "./zoom";
import { devRotate } from "./rotate";
import { promptLevelInput } from "./level-inserter";

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
    setGameScale(0);
    editorDrag.disable();
    mdshell.game.groups.world.x = 0;
    mdshell.game.groups.world.y = 0;
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

    selectedSprite.visible = false;
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
    } else if(e.key == "r") {
        if(editorState.isToggled) devRotate(90);
    } else if(e.key == "R") {
        if(editorState.isToggled) devRotate(-90);
    } else if(e.key == "L") {
        promptLevelInput();
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
    mdshell.game.groups.world.x -= x * gameScale.x;
    mdshell.game.groups.world.y -= y * gameScale.y;
}

function placeHover(x: number, y: number) {
    x *= gameScale.x;
    y *= gameScale.y;

    const fx = 
    snapToGrid(x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x + player.x, 0, blockSize);
    const fy = 
    snapToGrid(y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y + player.y, 0, blockSize);
    
    const cursorX = floorToMultiples(player.x + x - player.halfWS - mdshell.game.groups.world.x - mdshell.game.container.x * gameScale.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - mdshell.game.groups.world.y - mdshell.game.container.y * gameScale.y, blockSize) / blockSize;

    const bool = pw.staticGrid.isOOB(cursorX, cursorY);
    editorDrag.CAD(bool);

    setSelectedSpritePos(fx, fy);
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
    zIndex: 3,
    visible: false,
    pivot: blockSizeHalf,
});

export function setSelectedSpritePos(x: number, y: number) {
    selectedSprite.position.set(x + blockSizeHalf, y + blockSizeHalf);
}

mdshell.game.groups.view.addChild(selectedSprite);

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

    selectedSprite.visible = true;
}, () => {
    editorDrag.onDrag = editorPan;
    selectedSprite.visible = false;
    editorDrag.changeDefaultandNormalGrab("grab");
    editorDrag.changeDefaultAndNormalGrabbing("grabbing");
    selectedSprite.visible = false;
});

export function startStudioLoop() {
    startStats();
}