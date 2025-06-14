import { blockSize, blockSizeHalf, blockSizeQuarter, player } from "../../constants";
import { degToRad, floorToMultiples, rotatePoints90, snapToGrid, ToggleState } from "../../lib/util";
import { mdshell } from "../../constants";
import { placeBlock } from "./level-editor";
import { editorDrag, placementModeState, selectedBlock, selectedSprite, setSelectedSpritePos } from "./studio";
import { gameScale } from "./zoom";
import { blockRotation } from "./rotate";
import { Ticker } from "pixi.js";

export function enableRowEditMode() {
    //editorDrag.onDrag = placeRow;
    editorDrag.touchEl.addEventListener("pointerdown", down);
}

export function disableRowEditMode() {
    editorDrag.touchEl.removeEventListener("pointerdown", down);
    initialP = false;
    if(placementModeState.isToggled) editorDrag.onDrag = placeBlock;
}

export const rowEditState = new ToggleState(() => {
    if(placementModeState.isToggled) {
        enableRowEditMode();
    }
}, () => {
    disableRowEditMode();
});

var initialP = false;
var ix = 0;
var iy = 0;

function down(e: PointerEvent) {
    placeRow(0, 0, e.x, e.y);
}

export function placeRow(rx: number, ry: number, x: number, y: number) {
    x *= gameScale.x;
    y *= gameScale.y;
    const cursorX = floorToMultiples(player.x + x - player.halfWS - mdshell.game.groups.world.x - mdshell.game.container.x * gameScale.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - mdshell.game.groups.world.y - mdshell.game.container.y * gameScale.y, blockSize) / blockSize;

    const bool = mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
    if(bool) return editorDrag.CAD(true);

    const fx = 
    snapToGrid(x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x + player.x, 0, blockSize);
    const fy = 
    snapToGrid(y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y + player.y, 0, blockSize);
    
    if(!initialP) {
        initialP = true;
        ix = fx;
        iy = fy;
        setSelectedSpritePos(fx, fy);
    } else {
        // placing
        finalize();
        initialP = false;
        setSelectedSpritePos(0 , 0);
        selectedSprite.width = blockSize;
        selectedSprite.height = blockSize;
    }
}

export function rowEditHover(x: number, y: number) {
    x *= gameScale.x;
    y *= gameScale.y;

    const fx = 
    snapToGrid(x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x + player.x, 0, blockSize);
    const fy = 
    snapToGrid(y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y + player.y, 0, blockSize);
    
    const cursorX = floorToMultiples(player.x + x - player.halfWS - mdshell.game.groups.world.x - mdshell.game.container.x * gameScale.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - mdshell.game.groups.world.y - mdshell.game.container.y * gameScale.y, blockSize) / blockSize;

    const bool = mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
    editorDrag.CAD(bool);

    if(!initialP) {
        setSelectedSpritePos(fx, fy);
    } else resize(fx, fy);
}

function resize0(ix: number, iy: number, fx: number, fy: number) {
    const dx = fx - ix;
    const dy = fy - iy;

    if(dx > 0) {
        selectedSprite.x = ix + blockSizeHalf;
        selectedSprite.width = dx + blockSize;
    } else {
        selectedSprite.x = fx + blockSizeHalf;
        selectedSprite.width = -dx + blockSize;
    }

    if(dy > 0) {
        selectedSprite.height = dy + blockSize;
        selectedSprite.y = iy + blockSizeHalf;
    } else {
        selectedSprite.y = fy + blockSizeHalf;
        selectedSprite.height = -dy + blockSize;
    }
}

function resize90(ix: number, iy: number, fx: number, fy: number) {
    const right = ix - fx; // left
    const up = fy - iy; // up

    if(up > 0) {
        selectedSprite.width = up + blockSize;
        selectedSprite.y = iy + blockSizeHalf;
    } else {
        selectedSprite.width = -up + blockSize;
        selectedSprite.y = fy + blockSizeHalf;
    }

    if(right > 0) {
        selectedSprite.height = right + blockSize;
        selectedSprite.x = ix + blockSizeHalf;
    } else {
        selectedSprite.height = -right + blockSize;
        selectedSprite.x = fx + blockSizeHalf;
    }
}

function resize180(ix: number, iy: number, fx: number, fy: number) {
    const up = iy - fy;
    const left = ix - fx;

    if(left > 0) {
        selectedSprite.x = ix + blockSizeHalf;
        selectedSprite.width = left + blockSize;
    } else {
        selectedSprite.x = fx + blockSizeHalf;
        selectedSprite.width = -left + blockSize;
    }

    if(up > 0) {
        selectedSprite.height = up + blockSize;
        selectedSprite.y = iy + blockSizeHalf;
    } else {
        selectedSprite.y = fy + blockSizeHalf;
        selectedSprite.height = -up + blockSize;
    }
}

function resize270(ix: number, iy: number, fx: number, fy: number) {
    const right = fx - ix; // left
    const up = iy - fy; // up

    if(up > 0) {
        selectedSprite.width = up + blockSize;
        selectedSprite.y = iy + blockSizeHalf;
    } else {
        selectedSprite.width = -up + blockSize;
        selectedSprite.y = fy + blockSizeHalf;
    }

    if(right > 0) {
        selectedSprite.height = right + blockSize;
        selectedSprite.x = ix + blockSizeHalf;
    } else {
        selectedSprite.height = -right + blockSize;
        selectedSprite.x = fx + blockSizeHalf;
    }
}

function resize(fx: number, fy: number) {
    if(blockRotation == 0) resize0(ix, iy, fx, fy);
    else if(blockRotation == 90) resize90(ix, iy, fx, fy);
    else if(blockRotation == 180) resize180(ix, iy, fx, fy);
    else if(blockRotation == 270) resize270(ix, iy, fx, fy);
}

function finalize() {
    var xx = 0;
    var yy = 0;
    var w = 0;
    var h = 0;

    if(blockRotation == 0) {
        w = Math.round(selectedSprite.width / blockSize);
        h = Math.round(selectedSprite.height / blockSize);
        xx = selectedSprite.x;
        yy = selectedSprite.y;
    } else if(blockRotation == 90) {
        h = Math.round(selectedSprite.width / blockSize);
        w = Math.round(selectedSprite.height / blockSize);
        xx = selectedSprite.x - selectedSprite.height + blockSize;
        yy = selectedSprite.y;
    } else if(blockRotation == 180) {
        w = Math.round(selectedSprite.width / blockSize);
        h = Math.round(selectedSprite.height / blockSize);
        xx = selectedSprite.x - selectedSprite.width + blockSize;
        yy = selectedSprite.y - selectedSprite.height + blockSize;
    } else if(blockRotation == 270) {
        h = Math.round(selectedSprite.width / blockSize);
        w = Math.round(selectedSprite.height / blockSize);
        xx = selectedSprite.x;
        yy = selectedSprite.y - selectedSprite.width + blockSize;
    }

    const x = 
    floorToMultiples(xx - mdshell.game.container.x + gameScale.nx + player.halfW, blockSize) / blockSize;
    const y = 
    floorToMultiples(yy - mdshell.game.container.y + gameScale.ny + player.halfH, blockSize) / blockSize;

    const s = mdshell.createBlock(x, y, w, h, selectedBlock!, degToRad(blockRotation));

    /*if(blockRotation == 270) {
        var i = 0;
        Ticker.shared.add(() => {
            i += .1;
            s.y += 3 * Math.sin(i);
        });
    }*/
    
    selectedSprite.width = blockSize;
    selectedSprite.height = blockSize;
}