import { Container, Sprite } from "pixi.js";
import { $, $$, floorToMultiples, MDmatrix, removeContainerChildren, ToggleList } from "../../lib/util";
import { PWS } from "../../lib/pw-objects";
import { blockSize, maxLevelSize, player, pw } from "../../constants";
import { editorDrag, selectedBlock, selectedBlockIsPassable, selectedSprite } from "./studio";
import { GMOutput, Keymap } from "../../lib/keymap";
import { mdshell } from "../../constants";
import { gameScale } from "./zoom";

var hasEdited = false;

const editedBlocks: {[id: number]: PWS} = {};
const editorC = new Container();
editorC.zIndex = 1;
mdshell.game.groups.static.addChild(editorC);

const blockRecord: Record<string, MDmatrix<true>> = {};

export function placeBlock(rx: number, ry: number, x: number, y: number) {
    x *= gameScale.x;
    y *= gameScale.y;

    const fx = floorToMultiples(player.x + x - player.halfWS - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x, blockSize) / blockSize;
    const fy = floorToMultiples(player.y + y - player.halfHS - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y, blockSize) / blockSize;

    /*const fx = 
    floorToMultiples(player.x + x - player.halfWS + blockSize - mdshell.game.container.x * gameScale.x - mdshell.game.groups.world.x, blockSize);
    const fy = 
    floorToMultiples(player.y + y - player.halfHS + blockSize - mdshell.game.container.y * gameScale.y - mdshell.game.groups.world.y, blockSize);
    */

    if(mdshell.game.editGrid.isOOB(fx, fy)) return editorDrag.CAD(true);
    if(mdshell.game.editGrid.place(fx, fy, selectedBlock!)) return;

    try {
        const got = pw.staticGrid.get(fx, fy);
        if(got) {
            if(!editedBlocks[got.id]) {
                editedBlocks[got.id] = got;
            }
        }
    } catch(err: unknown) {
        return;
    }

    hasEdited = true;

    if(!blockRecord[selectedBlock!]) blockRecord[selectedBlock!] = new MDmatrix<true>(maxLevelSize, maxLevelSize);
    const map = blockRecord[selectedBlock!];
    map.set(fx, fy, true);

    editorC.addChild(new Sprite({
        x: fx * blockSize,
        y: fy * blockSize,
        width: blockSize,
        height: blockSize,
        texture: selectedSprite.texture,
    }));
}

export function finalizeEdits() {
    if(!hasEdited) return;
    hasEdited = false;

    removeContainerChildren(editorC);

    for(const blockName in blockRecord) {
        const boxes: GMOutput[] = Keymap.GMBool(blockRecord[blockName].matrix, selectedBlock!);
        
        for(const {x, y, w, h} of boxes) {
            if(mdshell.blocks[blockName].isPassable) mdshell.createBlock(x, y, w, h, blockName, true);
            else mdshell.createBlock(x, y, w, h, blockName, false);
        }

        delete blockRecord[blockName];
    } 
}


export function copyLevel() {
    const arr: GMOutput[] = [];

    for(const id in mdshell.pwObjects) {
        const {x, y, w, h, type} = mdshell.pwObjects[id];

        arr.push({x, y, w, h, type});
    }

    for(const id in mdshell.bgObjects) {
        const {x, y, w, h, type} = mdshell.bgObjects[id];

        arr.push({x, y, w, h, type});
    }

    navigator.clipboard.writeText(JSON.stringify(arr))
    .then(() => alert("Copied level json"))
    .catch(err => alert(err));
}

const cat = $("#ui > #editor > #cat") as HTMLDivElement;

const catList = new ToggleList([
    $$("button", {
        text: "Foreground",
        attrs: {"data-type": "fg-row"},
    }),
    $$("button", {
        text: "Background",
        attrs: {"data-type": "bg-row"},
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
