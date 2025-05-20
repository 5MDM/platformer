import { c } from "../../canvas";
import { MDshell } from "../../lib/md-framework/shell";
import { $ } from "../../lib/util";
import { editorDrag, editorPan, isEditorEnabled } from "./studio";

const moveImg = $("#ui > #move-arrow") as HTMLImageElement;

var isEnabled = false;
export function toggleDevMove() {
    if(!isEditorEnabled) return;
    isEnabled = !isEnabled;
    if(isEnabled) enable();
    else disable();
}

function onMove({movementX, movementY}: MouseEvent) {
    editorPan(-movementX, -movementY);
}

function enable() {
    editorDrag.changeGrab("none");
    editorDrag.changeGrabbingAndCurrentCursor("none");
    moveImg.style.display = "block";

    c.requestPointerLock()
    .catch(err => MDshell.Err(err));

    document.documentElement.addEventListener("mousemove", onMove);
}

function disable() {
    editorDrag.setCursorToDefault();
    moveImg.style.display = "none";

    document.exitPointerLock();
    document.documentElement.removeEventListener("mousemove", onMove);
}

export function disableDevMove() {
    if(!isEnabled) return;
    isEnabled = false;
    disable();
}

document.addEventListener("pointerlockchange", e => {
    if(!document.pointerLockElement) disableDevMove();
});