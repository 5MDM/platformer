import { Graphics, Matrix, Sprite, Texture } from "pixi.js";
import { _MD2editorBase } from "./main";
import { _MD2editorDragBase } from "./dragbase";
import { MDmatrix } from "../../misc/matrix";
import { Keymap } from "../../misc/keymap";
import { MDV } from "../../misc/vectors";
import { AnyBlock, FgBlock } from "../../v2/blocks/blocks";
import { Degrees } from "../../misc/util";

export class _MD2shaderMode extends _MD2editorDragBase {
    shadeT!: Texture;

    init(): void {
        super.init();

        this.shadeT = this.editor.engine.dataManager.getTexture("black-fade.png");

        this.scp.sprite.texture = Texture.WHITE;
        this.scp.sprite.alpha = .4;
    }

    prevBlockList: AnyBlock[] = [];

    protected onPlace(size: [number, number, number, number]): void {
        for(const block of this.prevBlockList) block.sprite.tint = 0xffffff;

        const blocks = this.editor.engine.levelManager.sampleFgBlocks(MDV.V4.fromArr(size));
        if(!blocks) return;

        this.prevBlockList = blocks;
        for(const block of blocks)
            block.sprite.tint = 0xfff000;
        
        for(const block of blocks) {
            const bounds = MDV.V4.fromBounds(block);
            const points = bounds.getOutsideIntPoints(this.editor.engine.blockSize);

            for(const point of points) {
                const coord = this.editor.engine.utils.dbz2Floor(point.x, point.y);
                const block = this.editor.engine.levelManager.levelGrids.fg.get
                (...coord);

                if(block) this.shade(MDV.V2.fromArray(coord));
            }
        }
    }

    private shade(v2: MDV.V2) {
        
    }
}