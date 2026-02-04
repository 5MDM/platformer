import { AnyBlock, BgBlock, Block, FgBlock } from "../../v2/blocks/blocks";
import { _MD2levelManager } from "../../v2/level";
import { Keymap } from "../keymap";
import { MDV } from "../vectors/vectors";
import { MDregion, MDregionHolder } from "./regions";

export class MDlevelRegion extends MDregion<AnyBlock> {
    static bounds = new MDV.V4(0, 0, _MD2levelManager.maxLevelSize, _MD2levelManager.maxLevelSize);

    constructor(id: number) {
        super(MDlevelRegion.bounds, id);
    }

    greedyMesh() {
        
    }
}

export class MDlevelRegionHolder extends MDregionHolder<AnyBlock> {
    static bounds = new MDV.V4(0, 0, _MD2levelManager.maxLevelSize, _MD2levelManager.maxLevelSize);

    
}