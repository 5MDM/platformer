import { Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2editorBase } from "./main"
import { MD2editor } from "../main";
import { AnyBlock } from "../../v2/blocks/blocks";
import { LCC } from "../../misc/util";
import { _md2events, BlockInfo } from "../../v2/types";
import { MDscalableSprite } from "../../misc/scale-sprite";
import { Keymap } from "../../misc/keymap";
import { _MD2editorDragBase } from "./dragbase";

export class _MD2editorMulti extends _MD2editorDragBase {
    firstPlacedDown = false;
    firstX = 0;
    firstY = 0;

    lastPlacedDown = false;
    lastX = 0;
    lastY = 0;
    
    private blockArr: AnyBlock[] = [];

    constructor(editor: MD2editor, el: HTMLElement) {
        super(editor, el);

        this.editor.engine.events.on(_md2events.levelDeleteB, () => {
            while(this.blockArr.length > 0)
                this.blockArr.shift()?.destroy();
        });
    }

    onFirstPlaceDown(): void {
        this.editor.engine.dataManager
            .changeTileSpriteTextureByName(this.scp.sprite, this.editor.selectedBlock, false);
    }

    onPlace(size: [number, number, number, number]) {
        const block = this.editor.engine.generator.createAndReturnBlock({
            name: this.editor.selectedBlock,
            rotation: this.editor.rotation.deg,
            x: size[0],
            y: size[1],
            w: size[2],
            h: size[3],
        }, false);

        if(!block) return;
        if(this.editor.checkIfOOB(block.x, block.y, block.maxX, block.maxY)) {
            console.log("OOB");
            return;
        }

        this.blockArr.push(block);

        this.editor.container.addChild(block.sprite);

        Keymap.IterateGMrect(...size, (x, y) => {
            const matrix = this.editor.grids[this.editor.selectedBlockType];
            matrix.set(x, y, block);
        });
    }
}