import { blockSize, player } from "../../constants";
import { GMOutput } from "../../lib/keymap";
import { floorToMultiples, snapToGrid, ToggleState } from "../../lib/util";
import { app, mdshell } from "../../main";
import { placeBlock } from "./level-editor";
import { editorDrag, placementModeState, selectedBlock, selectedBlockIsPassable, selectedSprite } from "./studio";

export function enableRowEditMode() {
    //editorDrag.onDrag = placeRow;
    editorDrag.touchEl.addEventListener("pointerdown", down);
}

export function disableRowEditMode() {
    editorDrag.touchEl.removeEventListener("pointerdown", down);
}

export const rowEditState = new ToggleState(() => {
    if(placementModeState.isToggled) {
        enableRowEditMode();
    }
}, () => {
    if(placementModeState.isToggled) editorDrag.onDrag = placeBlock;
    disableRowEditMode();
});

var initialP = false;
var ix = 0;
var iy = 0;

function down(e: PointerEvent) {
    placeRow(0, 0, e.x, e.y);
}

export function placeRow(rx: number, ry: number, x: number, y: number) {
    const cursorX = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;

    const bool = mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
    if(bool) return editorDrag.CAD(true);

    const fx = snapToGrid(x - app.stage.position.x, mdshell.pw.wc.position.x, blockSize);
    const fy = snapToGrid(y - app.stage.position.y, mdshell.pw.wc.position.y, blockSize);

    if(!initialP) {
        initialP = true;
        ix = fx;
        iy = fy;
        selectedSprite.position.set(fx, fy);
    } else {
        // placing
        finalize();
        initialP = false;
        selectedSprite.x = 0;
        selectedSprite.y = 0;
        selectedSprite.width = blockSize;
        selectedSprite.height = blockSize;
    }
}

export function rowEditHover(x: number, y: number) {
    const fx = snapToGrid(x - app.stage.position.x, mdshell.pw.wc.position.x, blockSize);
    const fy = snapToGrid(y - app.stage.position.y, mdshell.pw.wc.position.y, blockSize);

    const cursorX = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;

    const bool = mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
    editorDrag.CAD(bool);

    if(!initialP) {
        selectedSprite.x = fx;
        selectedSprite.y = fy;
    } else resize(fx, fy);
}

function resize(fx: number, fy: number) {
    var dx = fx - ix;
    var dy = fy - iy;

    if(dx < 0) {
        selectedSprite.x = fx;
        selectedSprite.width = ix - fx + blockSize;
    } else {
        selectedSprite.width = dx + blockSize;
        selectedSprite.x = ix;
    }

    if(dy < 0) {
        selectedSprite.y = fy;
        selectedSprite.height = iy - fy + blockSize;
    } else {
        selectedSprite.height = dy + blockSize;
        selectedSprite.y = iy;
    }
}

function finalize() {
    const x = 
    floorToMultiples(player.x + selectedSprite.x - player.halfWS, blockSize) / blockSize;
    const y = 
    floorToMultiples(player.y + selectedSprite.y - player.halfHS, blockSize) / blockSize;
    const w = Math.floor(selectedSprite.width / blockSize);
    const h = Math.floor(selectedSprite.height / blockSize);

    if(selectedBlockIsPassable) mdshell.createBlock(x, y, w, h, selectedBlock!, true);
    else mdshell.createBlock(x, y, w, h, selectedBlock!, false);
}