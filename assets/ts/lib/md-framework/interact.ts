import { mdshell } from "../../constants";
import { InteractComponent } from "./components";

export const touchingBlocks: Record<number, InteractComponent> = {}

addEventListener("keydown", e => {
    if(e.key != ";") return;

    playerInteract();
});

export function playerInteract() {
    if(mdshell.game.endDialogue()) return;

    for(const id in touchingBlocks) {
        return mdshell.game.toggleDialogue(touchingBlocks[id].text);
    }
}