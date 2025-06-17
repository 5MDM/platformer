import { Container, Sprite } from "pixi.js";
import { $, $$, degToRad, floorToMultiples, MDmatrix, radToDeg, removeContainerChildren, ToggleList } from "../../lib/util";
import { PWS } from "../../lib/pw-objects";
import { blockSize, blockSizeHalf, maxLevelSize, player, pw } from "../../constants";
import { editorDrag, selectedBlock, selectedSprite } from "./studio";
import { GMOutput, Keymap } from "../../lib/keymap";
import { mdshell } from "../../constants";
import { gameScale } from "./zoom";
import { blockRotation } from "./rotate";
import { LevelJSONoutput } from "../../lib/md-framework/shell";

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
    const blockId = selectedBlock! + "," + blockRotation;
    const rotationRad = degToRad(blockRotation);

    if(!blockRecord[blockId]) 
        blockRecord[blockId] = new MDmatrix<true>(maxLevelSize, maxLevelSize);

    const map = blockRecord[blockId];
    map.set(fx, fy, true);

    editorC.addChild(new Sprite({
        x: fx * blockSize + blockSizeHalf,
        y: fy * blockSize + blockSizeHalf,
        width: blockSize,
        height: blockSize,
        texture: selectedSprite.texture,
        pivot: selectedSprite.texture.width/2,
        rotation: rotationRad,
    }));
}

export function finalizeEdits() {
    if(!hasEdited) return;
    hasEdited = false;

    removeContainerChildren(editorC);

    for(const blockId in blockRecord) {
        const [blockName, rotationDeg] = blockId.split(",");
        const rotationRad = degToRad(Number(rotationDeg));

        const boxes: GMOutput[] = Keymap.GMBool(blockRecord[blockId].matrix, selectedBlock!);
        
        for(const {x, y, w, h} of boxes) {
            mdshell.createBlock(x, y, w, h, blockName, rotationRad);
        }

        delete blockRecord[blockId];
    } 
}


export function copyLevel() {
    const arr: LevelJSONoutput[] = [];

    for(const id in mdshell.game.pwObjects) {
        const {x, y, w, h, rotation, type} = mdshell.game.pwObjects[id];
        const rot = radToDeg(rotation);

        arr.push({x, y, w, h, rotation: rot, type});
    }

    for(const id in mdshell.game.bgObjects) {
        const {x, y, w, h, rotation, type} = mdshell.game.bgObjects[id];
        const rot = radToDeg(rotation);

        arr.push({x, y, w, h, rotation: rot, type});
    }

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
