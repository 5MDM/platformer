import { Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2editorBase } from "./main"
import { MD2editor } from "../main";
import { AnyBlock } from "../../v2/block";
import { LCC } from "../../misc/util";
import { _md2events, BlockInfo } from "../../v2/types";
import { MDscalableSprite } from "../../misc/scale-sprite";
import { Keymap } from "../../misc/keymap";

export class _MD2editorMulti extends _MD2editorBase {
    firstPlacedDown = false;
    firstX = 0;
    firstY = 0;

    lastPlacedDown = false;
    lastX = 0;
    lastY = 0;

    scp: MDscalableSprite;

    private blockArr: AnyBlock[] = [];

    constructor(editor: MD2editor, el: HTMLElement) {
        super(editor, el);

        this.scp = new MDscalableSprite(this.editor.engine);

        this.editor.container.addChild(this.scp.sprite);

        this.el.addEventListener("pointerup", e => {
            if(!this.firstPlacedDown) return;
            this.lastPlacedDown = true;

            const [x, y] = this.fixPos(e.x, e.y);
            this.lastX = x;
            this.lastY = y;

            this.placeSelection();
        });

        this.editor.engine.events.on(_md2events.levelDeleteB, () => {
            while(this.blockArr.length > 0)
                this.blockArr.shift()?.destroy();
        });
    }

    protected dragHandler(rx: number, ry: number): void {
        const [x, y] = this.getGridPos(rx, ry);

        if(!this.firstPlacedDown) {
            this.firstPlacedDown = true;

            this.editor.engine.dataManager
            .changeTileSpriteTextureByName(this.scp.sprite, this.editor.selectedBlock, false);

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

        const block = this.editor.engine.generator.createAndReturnBlock({
            name: this.editor.selectedBlock,
            rotation: this.editor.rotation.deg,
            x: size[0],
            y: size[1],
            w: size[2],
            h: size[3],
        }, false);

        if(!block) return;

        this.blockArr.push(block);

        this.editor.container.addChild(block.sprite);

        Keymap.IterateGMrect(...size, (x, y) => {
            const matrix = this.editor.grids[this.editor.selectedBlockType];
            matrix.set(x, y, block);
        });
    }

    protected onDisable(): void {
        super.onDisable();

        this.scp.sprite.visible = false;
    }
}