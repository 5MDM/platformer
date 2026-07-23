import { Texture } from "pixi.js";
import { MDscalableSprite } from "../../../../misc/scale-sprite";
import { MDV } from "../../../../misc/vectors/vectors";
import { MD2editorV2 } from "../../editor";
import { BaseMode } from "./base-mode";

export abstract class SelectionMode extends BaseMode {
    readonly selection = {
        firstPlaced: new MDV.V2(),
        lastPlaced: new MDV.V2(),
        hasPlacedFirst: false,
        hasPlacedLast: false,
        reset() {
            this.hasPlacedFirst = false;
            this.hasPlacedLast = false;
            this.firstPlaced.set(0, 0);
            this.lastPlaced.set(0, 0);
        }
    };

    s: MDscalableSprite;

    constructor(editor: MD2editorV2, targetEl: HTMLElement) {
        super(editor, targetEl);

        this.s = new MDscalableSprite(this.engine);
        this.s.sprite.texture = Texture.WHITE;
        this.editor.c.addChild(this.s.sprite);

        this.targetEl.addEventListener("pointerup", this.onPointerUp.bind(this));
        this.targetEl.addEventListener("pointerleave", this.onPointerUp.bind(this));
    }

    private onPointerUp(e: PointerEvent) {
        if(!this.selection.hasPlacedFirst) return;
        this.selection.hasPlacedLast = true;

        const [x, y] = this.getWorldPos(e.x, e.y);
        this.selection.lastPlaced.set(x, y);

        this.onSelection(
            MDV.V4.fromArr(this.s.getSize())
            .floor()
        );

        this.selection.reset();
    }

    protected abstract onSelection(box: MDV.V4);

    protected onFirstPlaceDown?();
    
    onDrag(blockPos: MDV.V2, pointerPosChange: MDV.V2): void {
        const [x, y] = blockPos;

        if(!this.selection.hasPlacedFirst) {
            this.selection.hasPlacedFirst = true;

            this.onFirstPlaceDown?.();

            this.s.sprite.visible = true;
            this.selection.firstPlaced.set(x, y);
            this.s.setPos(x, y);

            return;
        }

        const rw = x - this.selection.firstPlaced.x;
        const rh = y - this.selection.firstPlaced.y;

        this.s.setSize(rw, rh);
    }
}