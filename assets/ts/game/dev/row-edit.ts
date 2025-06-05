import { blockSize, player } from "../../constants";
import { floorToMultiples, snapToGrid, ToggleState } from "../../lib/util";
import { app } from "../../constants";
import { mdshell } from "../../constants";
import { placeBlock } from "./level-editor";
import { editorDrag, placementModeState, selectedBlock, selectedBlockIsPassable, selectedSprite } from "./studio";
import { gameScale } from "./zoom";

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

    //const cursorX = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    //const cursorY = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;

    const bool = mdshell.pw.staticGrid.isOOB(cursorX, cursorY);
    if(bool) return editorDrag.CAD(true);

    //const fx = snapToGrid(x - app.stage.position.x * gameScale.x, mdshell.game.container.position.x, blockSize);
    //const fy = snapToGrid(y - app.stage.position.y * gameScale.y, mdshell.game.container.position.y, blockSize);
    
    const fx = 
    snapToGrid(x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x + player.x, 0, blockSize);
    const fy = 
    snapToGrid(y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y + player.y, 0, blockSize);
    

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
    x *= gameScale.x;
    y *= gameScale.y;

    //const fx = snapToGrid(x, mdshell.game.container.position.x, blockSize);
    //const fy = snapToGrid(y, mdshell.game.container.position.y, blockSize);
    const fx = 
    snapToGrid(x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x + player.x, 0, blockSize);
    const fy = 
    snapToGrid(y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y + player.y, 0, blockSize);
    

    //const cursorX = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    //const cursorY = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;
    const cursorX = floorToMultiples(player.x + x - player.halfWS - mdshell.game.groups.world.x - mdshell.game.container.x * gameScale.x, blockSize) / blockSize;
    const cursorY = floorToMultiples(player.y + y - player.halfHS - mdshell.game.groups.world.y - mdshell.game.container.y * gameScale.y, blockSize) / blockSize;

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
    floorToMultiples(selectedSprite.x - mdshell.game.container.x + gameScale.nx + player.halfW, blockSize) / blockSize;
    const y = 
    floorToMultiples(selectedSprite.y - mdshell.game.container.y + gameScale.ny + player.halfH, blockSize) / blockSize;

/*const fx = 
    snapToGrid(x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x + player.x, 0, blockSize);
    const fy = 
    snapToGrid(y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y + player.y, 0,a blockSize);
    */

    const w = Math.floor(selectedSprite.width / blockSize);
    const h = Math.floor(selectedSprite.height / blockSize);

    if(selectedBlockIsPassable) mdshell.createBlock(x, y, w, h, selectedBlock!, true);
    else mdshell.createBlock(x, y, w, h, selectedBlock!, false);
    
    selectedSprite.width = blockSize;
    selectedSprite.height = blockSize;
}