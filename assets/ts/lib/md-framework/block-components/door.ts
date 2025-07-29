import { _MDcomponentParser } from "./parser";
import { MDshell } from "../shell";
import { FgBlock } from "../unit";

export interface DoorComponent {
    onOpen: string;
}

_MDcomponentParser.componentDefs.door = function(mdshell: MDshell, {pws}: FgBlock, component: DoorComponent) {
    const ogTextureName = pws.type;
    const {onOpen} = component;

    pws.hasCollisionLeaveEvents = true;
    var isOpen = false;

    pws.onCollide.push(o => {
        if(o.isDeleted) return true;
        if(!isOpen) {
            isOpen = true;
            o.sprite!.texture = mdshell.getTexture(onOpen);
        }

        return true;
    });

    pws.onCollisionLeave.push(o => {
        if(isOpen) {
            isOpen = false;
            o.sprite!.texture = mdshell.getTexture(ogTextureName);
        }
    });
};