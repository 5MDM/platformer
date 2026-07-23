import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { MDV } from "../../../misc/vectors/vectors";
import { XYWH } from "../../../v2/types";
import { EditorRegionBase } from "./base";
import { _MD2levelManager } from "../../../v2/level";
import { NameAndRotationStringGreedyMeshMap } from "../../../misc/greedy-mesh/sorter";

export abstract class EditorRegionBaseShader<T> extends EditorRegionBase<T> {
    abstract mustClearPrevious: boolean;
    protected c = new Container();

    protected sprites: Sprite[] = [];
    protected fillsC = new Container();
    protected fills: (Sprite | TilingSprite)[] = [];

    readonly fillMap = 
    new NameAndRotationStringGreedyMeshMap(new MDV.V2(
        _MD2levelManager.maxLevelSize, 
        _MD2levelManager.maxLevelSize,
    ));

    init() {
        super.init();

        this.editor.engine.levelManager.groups.static.addChild(this.c);
        this.editor.engine.levelManager.groups.static.addChild(this.fillsC);
    }

    fillVoid(box: XYWH) {
        const bounds = MDV.V4.fromBounds(box);
        if(bounds.w <= 2 || bounds.h <= 2) return;

        const ib = bounds.clone();
        ib.x += 1;
        ib.y += 1;
        ib.w -= 2;
        ib.h -= 2;
        ib.multiplyS(this.editor.engine.blockSize);

        this.onVoidFill(ib);
    }

    protected clearPrevious() {
        this.c.removeChildren();
        for(const s of this.sprites) s.destroy();
        this.sprites = [];

        this.fillsC.removeChildren();
        for(const s of this.fills) s.destroy();
        this.fills = [];
    }

    onGreedyMesh(boxes: XYWH[]): void {
        if(this.mustClearPrevious) this.clearPrevious();

        for(const box of boxes) {
            // makes things red
            //this.colorBoxes(box);
            const bounds = MDV.V4.fromBounds(box);
            const points = bounds.findAdjacencyForEachOutsidePointUsingGrid(this.regionMap);

            this.generateFills(bounds.clone(), points);
            this.fillVoid(bounds.clone());
        }

        this.onGreedyMeshFinish();
    }

    abstract onGreedyMeshFinish(): void;

    generateFills(bounds: MDV.V4, points: MDV.FindAdjacencyForEachOutsidePointUsingGridOutput): void {
        const bz = this.editor.engine.blockSize;
        
        for(const i of points.removedPoints) {
            const p = i.point!.clone().multiplyS(bz);

            this.onVoidFill(new MDV.V4(p.x, p.y, bz, bz));
        }

        for(const cell of points.main) {
            const gridCoord = cell.point!.clone();

            const item: T | void = this.getItemF(gridCoord);

            if(item) {
                gridCoord.multiplyS(this.editor.engine.blockSize);
                gridCoord.x += this.editor.engine.blockSizeHalf;
                gridCoord.y += this.editor.engine.blockSizeHalf;

                this.shade(gridCoord, cell, item);
            }
        }
    }

    abstract shade(p: MDV.V2, cell: MDV.V4NeighborCellType, item: T): void;

    abstract onVoidFill(bounds: MDV.V4): void;
}