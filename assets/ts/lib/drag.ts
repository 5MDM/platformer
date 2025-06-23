import { Cursor } from "pixi.js";

interface DragControllerOpts {
    touchEl: HTMLElement;
    enabled?: boolean;
    isMultitouch: boolean;
    customDownElement?: HTMLElement;
}

// multitouch improvements made by DeltAndy

export class DragController {
    downElement: HTMLElement;
    canDrag: boolean = true;
    touchEl: HTMLElement;
    touchPosition: Map<number, {lastX: number, lastY: number}> = new Map();
    isMouseDown: boolean = false;
    isMultitouch: boolean;
    grab: Cursor = "grab";
    grabbing: Cursor = "grabbing";
    defaultGrab: Cursor = "grab";
    defaultGrabbing: Cursor = "grabbing";

    constructor(o: DragControllerOpts) {
        this.downElement = o.customDownElement || o.touchEl;
        this.isMultitouch = o.isMultitouch;
        this.touchEl = o.touchEl;
        if(o.enabled ?? true) this.enable();
    }

    enable() {
        this.downElement.onpointerdown = e => this.touchDown(e);
        this.touchEl.onpointerup = e => this.touchUp(e);

        if(this.isMultitouch) {
            this.touchEl.ontouchmove = e => Array.from(e.targetTouches).forEach(t => this.touchMove(t));
        } else {
            this.touchEl.ontouchmove = e => this.touchMove(e.targetTouches[e.targetTouches.length-1]);
        }

        this.touchEl.onmouseleave = e => this.mouseUp(e);
        this.downElement.onmousedown = e => this.mouseDown(e);
        this.touchEl.onmouseup = e => this.mouseUp(e);
        this.touchEl.onmousemove = e => this.mouseMove(e);

        this.canDrag = true;
        this.downElement.style.cursor = this.grab;
    }

    disable() {
        this.touchEl.onpointerdown = null;
        this.touchEl.onpointerup = null;
        this.touchEl.ontouchmove = null;

        this.touchEl.onmousedown = null;
        this.touchEl.onmouseup = null;
        this.touchEl.onmousemove = null;

        this.canDrag = false;
        this.touchEl.style.cursor = "default";
    }

    private mouseMove(e: MouseEvent) {
        if (!this.canDrag) return;
        if (!this.isMouseDown) return;
        
        const x = -e.movementX;
        const y = -e.movementY;

        this.onDrag(x, y, e.pageX, e.pageY);
    }

    private touchMove(e: Touch) {
        if(!this.canDrag) return;

        const touch = this.touchPosition.get(e.identifier);
        if(!touch) return;
        
        const x = touch.lastX - e.pageX;
        const y = touch.lastY - e.pageY;
        this.touchPosition.set(e.identifier, {lastX: e.pageX, lastY: e.pageY});
        this.onDrag(x, y, e.pageX, e.pageY);
    }
    
    onDrag: (x: number, y: number, px: number, py: number) => void = () => undefined;

    private touchDown(e: PointerEvent) {
        this.touchPosition.set(e.pointerId, {lastX: e.pageX, lastY: e.pageY});
        this.onDrag(0, 0, e.pageX, e.pageY);
    }

    private touchUp(e: PointerEvent) {
        this.touchPosition.delete(e.pointerId);
    }

    private mouseDown(e: MouseEvent) {
        this.isMouseDown = true;
        this.downElement.style.cursor = this.grabbing;
        this.onDrag(0, 0, e.pageX, e.pageY);
    }

    private mouseUp(e: MouseEvent) {
        this.isMouseDown = false;
        this.downElement.style.cursor = this.grab;
    }

    changeGrab(val: Cursor) {
        this.downElement.style.cursor = val;
        this.grab = val;
    }

    changeGrabbingAndCurrentCursor(val: Cursor) {
        this.grabbing = val;
        this.downElement.style.cursor = val;
    }

    changeDefaultandNormalGrab(val: Cursor): void {
        this.changeGrab(val);
        this.defaultGrab = val;
    }

    changeDefaultAndNormalGrabbing(val: Cursor) {
        this.defaultGrabbing = this.grabbing = val;
    }

    setCursorToDefault() {
        this.grab = this.defaultGrab;
        this.changeGrab(this.grab);
        this.grabbing = this.defaultGrabbing;
        this.cursorDisabled = false;
    }

    cursorDisabled: boolean = false;

    // check and disable cursor
    CAD(bool: boolean) {
        if(bool && !this.cursorDisabled) {
            this.cursorDisabled = true;
            this.changeGrab("not-allowed");
            this.changeGrabbingAndCurrentCursor("not-allowed");
        } else if(!bool && this.cursorDisabled) {
            this.cursorDisabled = false;
            this.setCursorToDefault();
        }
    }
}