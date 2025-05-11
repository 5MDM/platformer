import { Container, Cursor, Sprite, TilingSprite } from "pixi.js";
import { floorToMultiples, MDmatrix, removeContainerChildren, snapToGrid } from "../../lib/util";
import { PWS } from "../../lib/pw-objects";
import { blockSize, maxLevelSize, player, pw, staticContainer } from "../../constants";
import { createBlock, createSprite, size, spritesheet } from "../../mods";
import { editorDrag, selectedBlock, selectedSprite } from "./studio";
import { GMOutput, Keymap, Map2D } from "../../lib/keymap";
import { app } from "../../main";

var hasEdited = false;

const editedBlocks: {[id: number]: PWS} = {};
const editorC = new Container();
editorC.zIndex = 1;
staticContainer.addChild(editorC);

const map = new Map2D<true>();
const editGrid = new MDmatrix<true>(maxLevelSize, maxLevelSize);

export function placeBlock(rx: number, ry: number, x: number, y: number) {
    const fx = floorToMultiples(player.x + x - player.halfWS - app.stage.position.x, blockSize) / blockSize;
    const fy = floorToMultiples(player.y + y - player.halfHS - app.stage.position.y, blockSize) / blockSize;

    editorDrag.CAD(editGrid.isOOB(fx, fy));

    if(!map.place(Map2D.coord(fx, fy), true)) return;
    // add new block

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
    editGrid.set(fx, fy, true);

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

    const boxes: GMOutput[] = Keymap.GMBool(editGrid.matrix, selectedBlock!);

    for(const {x, y, w, h} of boxes) {
        const s = createSprite(selectedBlock!, x, y, w, h);
        createBlock(s, x, y, w, h);
    }
    
    editGrid.clear();
}