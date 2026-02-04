import { Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2editorBase } from "./main";
import { _MD2editorDragBase } from "./dragbase";
import { MDV } from "../../misc/vectors/vectors";
import { AnyBlock, BgBlock, FgBlock } from "../../v2/blocks/blocks";
import { degToRad, radToDeg, SimpleExpander, simpleSwitch } from "../../misc/util";
import { MD2devAutomation } from "../../v2/automation";
import { greedyMeshBooleans } from "../../misc/greedy-mesh/greedy-mesh";
import { MDregion } from "../../misc/regions/regions";
import { _MD2levelManager } from "../../v2/level";
import { MDmatrix } from "../../misc/matrix";
import { NameAndRotationStringGreedyMeshMap } from "../../misc/greedy-mesh/sorter";

export class _MD2shaderMode extends _MD2editorDragBase {
    shadeT!: Texture;
    shadeCorner!: Texture;

    readonly shadeMap = new NameAndRotationStringGreedyMeshMap(new MDV.V2(
        _MD2levelManager.maxLevelSize, 
        _MD2levelManager.maxLevelSize,
    ));

    static readonly shadeName = "black-fade.png";
    static readonly shadeCorner = "black-fade-corner.png";
    static readonly black = "black.png";

    init(): void {
        super.init();

        this.shadeT = this.editor.engine.dataManager.getTexture("black-fade.png");
        this.shadeCorner = this.editor.engine.dataManager.getTexture("black-fade-corner.png");

        this.scp.sprite.texture = Texture.WHITE;
        this.scp.sprite.alpha = .4;
    }

    prevBlockList: AnyBlock[] = [];

    // fires when drag ends
    protected onPlace(size: [number, number, number, number]): void {
        for(const block of this.prevBlockList) block.sprite.tint = 0xffffff;

        // change this
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

            const points = bounds.findAdjacencyForEachOutsidePoint
            (this.editor.engine.blockSize);

            for(const cell of points) {
                const gridCoord = cell.point!.clone().divideS(this.editor.engine.blockSize).floor();

                const block = this.editor.engine.levelManager.levelGrids.fg
                .get(gridCoord.x, gridCoord.y);

                if(block) {
                    this.shade(block, cell);
                }
            }

            bounds.clone().divideS(this.editor.engine.blockSize).floor()
            .forEachIntPoint(v => {
                this.shadeMap.add(
                    this.shadeMap.createNameHash(_MD2shaderMode.black, 0),
                    v,
                );
            }, 1);
        }

        const gmOutput = this.shadeMap.greedyMesh();
        
        NameAndRotationStringGreedyMeshMap.iterateRecord(gmOutput, (name, bounds) => {
            var replace = false;
            if(name == "red") {
                name = _MD2shaderMode.shadeCorner;
                replace = true;
            }

            const block = this.editor.engine.generator.createAndReturnBlock({
                name,
                ...bounds,
            }, false);

            if(!block) return;     
            block.container.x += this.editor.engine.blockSizeHalf;

            if(replace) {
                block.sprite.texture = Texture.WHITE;
                //block.sprite.tint = 0xfff000;
            }

            const foundBlock: FgBlock | undefined = 
            this.editor.engine.levelManager.levelGrids.fg.get(bounds.x, bounds.y) as (FgBlock | undefined);

            if(!foundBlock) return;

            foundBlock.shadeRecord[block.id] = block;
            this.editor.engine.levelManager.groups.static.addChild(block.container);
        });

        this.shadeMap.clear();
    }

    // debug automation
    da = new MD2devAutomation(this.editor.engine);

    private shade(block: AnyBlock | undefined, cell: MDV.V4NeighborCellType) {
        if(block) block.isShaded = true;

        const md2 = this.editor.engine;
        const th = _MD2shaderMode;
        const bz = md2.blockSize;

        var texture = th.shadeName;
        var rotation = 0;
        const pos = MDV.V2.fromPoint(cell.point!);

        simpleSwitch<MDV.V4cellNeighborType, this>(cell.type, {
            top() {
                rotation = -90;
            },
            bottom() {
                rotation = 90;
            },
            left() {
                rotation = 180;
            },
            right() {
                //console.log(0)
            },
            "top-left-corner"() {
                texture = th.shadeCorner;
                rotation = -90;
            },
            "top-right-corner"() {
                texture = th.shadeCorner;
            },
            "bottom-left-corner"() {
                texture = th.shadeCorner;
                rotation = 180;
            },
            "bottom-right-corner"() {
                texture = th.shadeCorner;
                rotation = 90;
            },
            default() {
                texture = "red";
            }
        }, this);

        const hash = this.shadeMap.createNameHash(texture, rotation);
        const finalPos = pos.divideS(bz).floor();
        this.shadeMap.add(hash, finalPos);

        //st.addChild(s);
    }
}

