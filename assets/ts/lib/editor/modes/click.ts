import { blockDataMap } from "pixi.js";
import { MD2editor } from "../main";
import { _MD2editorBase } from "./main";
import { AnyBlock, Block } from "../../v2/block";

export class _MD2editorClick extends _MD2editorBase {
    protected override dragHandler(rx: number, ry: number) {
        const [x, y] = this.getGridPos(rx, ry);

        if(this.getEditorBlock(this.editor.selectedBlockType, x, y)) return;

        if(!this.editor.isEntitySelected) this.genBlock(x, y);
        else this.genEntity(x, y);
    }

    private genEntity(x: number, y: number) {
        if(this.editor.selectedEntity == "") return false;
        const s = this.editor.engine.generator.createEntitySprite(this.editor.selectedEntity);
        s.position.set(x * this.editor.engine.blockSize, y * this.editor.engine.blockSize);

        this.editor.container.addChild(s);

        //this.editor.grids[this.editor.selectedBlockType].set(x, y, generatedBlock);
    }

    private genBlock(x: number, y: number) {
        if(this.editor.selectedBlock == "") return false;

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

    protected onEnable(): void {
        super.onEnable();

        this.editor.testSprite.visible = true;
    }
}