import { DragController } from "../../misc/drag";
import { ToggleState } from "../../misc/util";
import { AnyBlock } from "../../v2/block";
import { MDgameGridType } from "../../v2/types";
import { MD2editor } from "../main";

export abstract class _MD2editorBase {
    editor: MD2editor;
    el: HTMLElement;
    drag: DragController;

    state = new ToggleState(() => this.onEnable(), () => this.onDisable());

    protected onEnable() {}
    protected onDisable() {}

    constructor(editor: MD2editor, el: HTMLElement) {
        this.editor = editor;
        this.el = el;

        this.drag = new DragController({
            touchEl: this.el,
            isMultitouch: false,
        });

        this.drag.changeDefaultandNormalGrab("default");
        this.drag.changeDefaultAndNormalGrabbing("pointer");
    }

    init() {
        this.setupListeners();
    }

    setupListeners() {
        this.drag.enable();
        this.drag.onDrag = (aa, aaa, x, y) => this.onDrag(x, y);
    }

    protected getEditorBlock(type: MDgameGridType, x: number, y: number): AnyBlock | false {
        return this.editor.grids[type].get(x, y) ?? false;
    }

    protected getRealBlock(type: MDgameGridType, x: number, y: number): AnyBlock | false {
        return this.editor.engine.levelManager.levelGrids[type].get(x, y) ?? false;
    }

    private onDrag(rx: number, ry: number) {
        //console.log(this.state.isToggled)
        if(!this.state.isToggled) return;
        this.dragHandler(...this.editor.snapToGridFromScreen(...this.fixPos(rx, ry),
            this.editor.engine.levelManager.groups.static
        ));
    }

    protected dragHandler(x: number, y: number) {}

    protected fixPos(rx: number, ry: number): [number, number] {
        rx += this.editor.engine.generator.player.x - innerWidth / 2;
        ry += this.editor.engine.generator.player.y - innerHeight / 2;
        return [rx, ry];
    }

    protected getGridPos(x: number, y: number): [number, number] {
        return [
            Math.floor(x / this.editor.engine.blockSize),
            Math.floor(y / this.editor.engine.blockSize),
        ];
    }
}
