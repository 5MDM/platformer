import { MDgameGridType } from "../../v2/types";
import { _MD2editorBase } from "./main";

export class _MD2deleteClick extends _MD2editorBase {
    protected override dragHandler(rx: number, ry: number) {
        const [x, y] = this.getGridPos(rx, ry);

        const blocks = 
        [this.getRealBlock("fg", x, y), this.getRealBlock("bg", x, y), this.getRealBlock("overlay", x, y)];        

        for(const block of blocks) {
            if(!block) continue;

            //console.log(0, block);
            
            this.editor.engine.deletor.deleteBlockByBlockAndWorldPos(block, x, y);

            break;
        }

        for(const type in this.editor.grids) {
            const editorBlock = this.editor.grids[type as MDgameGridType].get(x, y);
            if(!editorBlock) break;

            editorBlock.destroy();
            this.editor.grids[type as MDgameGridType].delete(x, y);
        }
    }

    protected onEnable(): void {
        super.onEnable();
        this.editor.testSprite.visible = false;
    }
}