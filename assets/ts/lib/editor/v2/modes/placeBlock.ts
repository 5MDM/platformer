import { MDV } from "../../../misc/vectors/vectors";
import { BaseMode } from "./templates/base-mode";

export class PlaceBlock extends BaseMode {
    iconPath = "";
    modeName = "place block";
    
    onDrag(gridPos: MDV.V2) {
        const block = this.editor.ui.getSelectedBlock();
        if(!block) return;

        this.blockTools.createSingleBlockAndRecordInEditor
        (block.texture, gridPos, this.editor.blockModifiers.rotation);
    }
}