import { MDgame } from "./game";
import { mdshell } from "../../constants";

export interface BlockComponent {
    door?: {}
}

export function parseBlockComponents(game: MDgame, components: BlockComponent, id: number) {
    const block = game.pwObjects[id].pwb;

    if(components.door) {
        block.hasCollisionLeaveEvents = true;
        var isOpen = false;

        block.onCollide.push(pws => {
            if(!isOpen) {
                isOpen = true;
                pws.sprite!.texture = mdshell.getTexture("wood-door-open.png");
            }

            return true;
        });

        block.onCollisionLeave.push(pws => {
            if(isOpen) {
                isOpen = false;
                pws.sprite!.texture = mdshell.getTexture("wood-door.png");
            }
        });
    }
}