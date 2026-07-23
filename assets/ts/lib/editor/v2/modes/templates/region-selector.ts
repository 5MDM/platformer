import { greedyMeshBooleans, greedyMeshBooleansFromGrid } from "../../../../misc/greedy-mesh/greedy-mesh";
import { MDboolGrid } from "../../../../misc/grids/bool-grid";
import { MDmatrix } from "../../../../misc/matrix";
import { MDV } from "../../../../misc/vectors/vectors";
import { XYWH } from "../../../../v2/types";
import { MD2editorV2 } from "../../editor";
import { SelectionMode } from "./selection-mode";

export abstract class RegionSelect extends SelectionMode {
    readonly regionMap = new MDboolGrid(
        MD2editorV2.maxLevelSize, 
        MD2editorV2.maxLevelSize,
    );

    abstract canPlace(gridPos: MDV.V2): boolean;
    abstract afterGreedyMesh(boxes: MDV.V4[]): void;

    protected onSelection(box: MDV.V4) {
        box.forEachIntPoint(p => {
            if(this.canPlace(p))
                this.regionMap.place(p);
        });

        const boxes = greedyMeshBooleansFromGrid(this.regionMap.clone());
        const vec4Arr: MDV.V4[] = [];

        for(const box of boxes) vec4Arr.push(MDV.V4.fromBounds(box));

        this.afterGreedyMesh(vec4Arr);
    }
}