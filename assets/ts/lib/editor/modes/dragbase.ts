import { _MD2editorBase } from "./main"
import { MD2editor } from "../main";
import { _md2events, BlockInfo, XYWH } from "../../v2/types";
import { MDscalableSprite } from "../../misc/scale-sprite";

export abstract class _MD2editorDragBase extends _MD2editorBase {
    firstPlacedDown = false;
    firstX = 0;
    firstY = 0;

    lastPlacedDown = false;
    lastX = 0;
    lastY = 0;

    scp: MDscalableSprite;

    constructor(editor: MD2editor, el: HTMLElement) {
        super(editor, el);

        this.scp = new MDscalableSprite(this.editor.engine);

        this.editor.container.addChild(this.scp.sprite);

        const upF = (e: PointerEvent) => {
            if(!this.firstPlacedDown) return;
            this.lastPlacedDown = true;

            const [x, y] = this.fixPos(e.x, e.y);
            this.lastX = x;
            this.lastY = y;

            this.placeSelection();
        };

        this.el.addEventListener("pointerup", upF);
        this.el.addEventListener("pointerleave", upF);
    }

    onFirstPlaceDown() {

    }

    protected dragHandler(rx: number, ry: number): void {
        const [x, y] = this.getGridPos(rx, ry);

        if(!this.firstPlacedDown) {
            this.firstPlacedDown = true;

            this.onFirstPlaceDown();

            this.scp.sprite.visible = true;
            
            this.firstX = x;
            this.firstY = y;

            this.scp.setPos(x, y);

            return;
        }

        const rw = x - this.firstX;
        const rh = y - this.firstY;

        this.scp.setSize(rw, rh);
    }

    private placeSelection() {
        this.firstPlacedDown = false;
        this.lastPlacedDown = false;

        const size = this.scp.getSize();

        this.onPlace(size);
    }

    protected onPlace(size: [number, number, number, number]) {

    }

    protected onDisable(): void {
        super.onDisable();

        this.scp.sprite.visible = false;
    }
}