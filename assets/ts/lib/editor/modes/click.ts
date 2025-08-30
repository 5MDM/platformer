import { blockDataMap } from "pixi.js";
import { _toolbarEvents } from "../el";
import { MD2editor } from "../main";
import { _MD2editorBase } from "./main";
import { AnyBlock, Block } from "../../v2/block";

export class _MD2editorClick extends _MD2editorBase {
    protected override dragHandler(rx: number, ry: number) {
        if(this.editor.selectedBlock == "") return false;
        const [x, y] = this.getGridPos(rx, ry);
        if(this.getEditorBlock(this.editor.selectedBlockType, x, y)) return;

        const generatedBlock: AnyBlock | false = this.editor.engine.generator.createAndReturnBlock({
            name: this.editor.selectedBlock,
            x,
            y,
            w: 1,
            h: 1,
            rotation: this.editor.rotation.deg,
        }, false);

        if(!generatedBlock) return;

        this.editor.container.addChild(generatedBlock.sprite);

        this.editor.grids[this.editor.selectedBlockType].set(x, y, generatedBlock);
    }
}