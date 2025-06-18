import { mdshell } from "../../constants";
import { InteractComponent } from "./components";

export const touchingBlocks: Record<number, InteractComponent> = {}

addEventListener("keydown", e => {
    if(e.key != "i") return;

    for(const id in touchingBlocks) {
        return mdshell.game.startPlayerDialogue(touchingBlocks[id].text);
    }
});

