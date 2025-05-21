import { c } from "../../canvas";
import { MDshell } from "../../lib/md-framework/shell";
import { $, ToggleState } from "../../lib/util";
import { editorDrag, editorPan, editorState } from "./studio";

const moveImg = $("#ui > #move-arrow") as HTMLImageElement;

export const devMoveModeState = new ToggleState(() => {
    if(!editorState.isToggled) return;
    editorDrag.changeGrab("none");
    editorDrag.changeGrabbingAndCurrentCursor("none");
    moveImg.style.display = "block";

    c.requestPointerLock()
    .catch(err => MDshell.Err(err));

    document.documentElement.addEventListener("mousemove", onMove);
}, () => {
    editorDrag.setCursorToDefault();
    moveImg.style.display = "none";

    document.exitPointerLock();
    document.documentElement.removeEventListener("mousemove", onMove);
});

function onMove({movementX, movementY}: MouseEvent) {
    editorPan(-movementX, -movementY);
}

document.addEventListener("pointerlockchange", e => {
    if(!document.pointerLockElement && devMoveModeState.isToggled) devMoveModeState.toggle(); 
});