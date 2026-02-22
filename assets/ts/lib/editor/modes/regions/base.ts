import { Texture } from "pixi.js";
import { NameAndRotationStringGreedyMeshMap } from "../../../misc/greedy-mesh/sorter";
import { MDV } from "../../../misc/vectors/vectors";
import { _MD2levelManager } from "../../../v2/level";
import { _MD2editorDragBase } from "../dragbase";
import { MDmatrix } from "../../../misc/matrix";
import { MD2editor } from "../../main";
import { greedyMeshBooleans } from "../../../misc/greedy-mesh/greedy-mesh";
import { XYWH } from "../../../v2/types";
import { NOOP } from "../../../misc/util";

export abstract class EditorRegionBase<T> extends _MD2editorDragBase {
    textures = {
        shaded: Texture.WHITE,
    };

    // readonly m = new NameAndRotationStringGreedyMeshMap(new MDV.V2(
    //     _MD2levelManager.maxLevelSize, 
    //     _MD2levelManager.maxLevelSize,
    // ));

    readonly regionMap = new MDmatrix<true>(
        _MD2levelManager.maxLevelSize, 
        _MD2levelManager.maxLevelSize,
    );

    abstract getItemF(v2: MDV.V2): T | void;
    abstract onGreedyMesh(boxes: XYWH[]): void;

    constructor(
        editor: MD2editor, 
        el: HTMLElement, 
    ) {
        super(editor, el);
    }

    init(): void {
        super.init();

        this.scp.sprite.texture = Texture.WHITE;
        this.scp.sprite.alpha = 0.6;
    }

    protected onPlace(size: [number, number, number, number]): void {
        const sizeV = MDV.V4.fromArr(size);
        sizeV.forEachIntPoint(v => {
            const item: T | void = this.getItemF(v);
            if(!item) return;

            this.regionMap.set(v.x, v.y, true);
        });

        const boxes: XYWH[] = greedyMeshBooleans(this.regionMap.clone());

        this.onGreedyMesh(boxes);
    }
}