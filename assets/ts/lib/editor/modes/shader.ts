import { boundsPool, Graphics, Matrix, Sprite, Texture } from "pixi.js";
import { _MD2editorBase } from "./main";
import { _MD2editorDragBase } from "./dragbase";
import { MDmatrix } from "../../misc/matrix";
import { Keymap } from "../../misc/keymap";
import { MDV } from "../../misc/vectors/vectors";
import { AnyBlock, FgBlock } from "../../v2/blocks/blocks";
import { Degrees, degToRad, simpleSwitch } from "../../misc/util";
import { MD2devAutomation } from "../../v2/automation";

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
        for(const block of blocks) {
            if(block.isShaded) block.sprite.tint = 0xff0000;
            else block.sprite.tint = 0xfff000;
        }
        
        for(const block of blocks) {
            if(block.isShaded) continue;
            const bounds = MDV.V4.fromBounds(block);
            const points = bounds.findAdjacencyForEachPoint(this.editor.engine.blockSize, 1);

            for(const cell of points) {
                const gridCoord = cell.point!.clone().divideS(this.editor.engine.blockSize).floor();

                const block = this.editor.engine.levelManager.levelGrids.fg
                .get(gridCoord.x, gridCoord.y);

                if(block) this.shade(block, cell);
                else {
                    const gridCoord = cell.point!.clone().divideS(this.editor.engine.blockSize).floor();
                    gridCoord.y -= 1;

                    const block = this.editor.engine.levelManager.levelGrids.fg
                    .get(gridCoord.x, gridCoord.y);

                    if(block) this.shade(block, cell);
                }
            }
        }
    }

    // debug automation
    da = new MD2devAutomation(this.editor.engine);

    private shade(block: AnyBlock | undefined, cell: MDV.V4NeighborCellType) {
        if(cell.type == "bottom") console.log(1);
        if(block) block.isShaded = true;

        const md2 = this.editor.engine;
        const l = md2.levelManager;

        const st = l.groups.static;
        const s = new Sprite({
            width: md2.blockSize,
            height: md2.blockSize,
            texture: this.shadeT,
            zIndex: 10,
            x: cell.point!.x,
            y: cell.point!.y,
        });

        const bz = md2.blockSize;

        simpleSwitch<MDV.V4cellNeighborType>(cell.type, {
            top() {
                s.rotation = degToRad(-90);
            },
            bottom() {
                s.rotation = degToRad(90);
            },
            left() {
                s.rotation = degToRad(180);
            },
        });

        st.addChild(s);
    }
}