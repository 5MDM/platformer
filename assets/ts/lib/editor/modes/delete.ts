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
    }
}