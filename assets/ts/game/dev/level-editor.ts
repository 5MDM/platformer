import { Container, Sprite } from "pixi.js";
import { floorToMultiples, MDmatrix, removeContainerChildren, snapToGrid } from "../../lib/util";
import { PWS } from "../../lib/pw-objects";
import { blockSize, maxLevelSize, player, pw, staticContainer } from "../../constants";
import { editorDrag, selectedBlock, selectedSprite } from "./studio";
import { GMOutput, Keymap } from "../../lib/keymap";
import { app, mdshell } from "../../main";

var hasEdited = false;

const editedBlocks: {[id: number]: PWS} = {};
const editorC = new Container();
editorC.zIndex = 1;
staticContainer.addChild(editorC);

const blockRecord: Record<string, MDmatrix<true>> = {};

export function placeBlock(rx: number, ry: number, x: number, y: number) {
    const fx = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    const fy = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;

    if(mdshell.game.editGrid.isOOB(fx, fy)) return editorDrag.CAD(true);

    if(mdshell.game.editGrid.place(fx, fy, selectedBlock!)) return;

    try {
        const got = pw.staticGrid.get(fx, fy);
        if(got) {
            if(!editedBlocks[got.id]) {
                editedBlocks[got.id] = got;
                got.sprite!.tint = 0xfff000;
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
        const t = mdshell.getTexture(blockName);

        for(const {x, y, w, h} of boxes) {
            mdshell.createBlock(x, y, w, h, blockName);
        }
    }
    
    //editGrid.clear();
}


export function copyLevel() {
    const arr: GMOutput[] = [];

    mdshell.game.grids.fg.forEach(({id, type}) => {
        const {x, y, w, h} = mdshell.pwObjects[id];
        
        arr.push({x, y, w, h, type});
    });

    navigator.clipboard.writeText(JSON.stringify(arr))
    .then(() => alert("Copied level json"))
    .catch(err => alert(err));
}

