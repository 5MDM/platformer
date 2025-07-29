import { _MDcomponentParser } from "./parser";
import { MDshell } from "../shell";
import { FgBlock } from "../unit";

export interface DoorpointComponent {
    toLevel: string;
}

_MDcomponentParser.componentDefs.doorpoint = function(mdshell: MDshell, {pws}: FgBlock, component: DoorpointComponent) {
    var hasCollided = false;

    pws.onCollide.push(() => {
        if(hasCollided) return true;
        hasCollided = true;
       
        mdshell.pw.stopClock();
        mdshell.destroyCurrentLevel();
        mdshell.setCurrentLevel(component.toLevel);
        mdshell.pw.startClock();

        return true;
    });
};