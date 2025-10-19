import { DragController } from "../../misc/drag";
import { ToggleState } from "../../misc/util";
import { AnyBlock } from "../../v2/blocks/blocks";
import { MD2zoomModule } from "../../v2/modules/zoom";
import { MDgameGridType } from "../../v2/types";
import { MD2editor } from "../main";

export abstract class _MD2editorBase {
    editor: MD2editor;
    el: HTMLElement;
    drag: DragController;
    zoom: MD2zoomModule;

    state = new ToggleState(() => this.onEnable(), () => this.onDisable());

    buttonElement?: HTMLElement;

    protected onEnable() {
        if(this.buttonElement) this.buttonElement.style.setProperty("border-color", "red");
    }
    protected onDisable() {
        if(this.buttonElement) this.buttonElement.style.removeProperty("border-color");
    }

    constructor(editor: MD2editor, el: HTMLElement) {
        this.editor = editor;
        this.el = el;

        this.drag = new DragController({
            touchEl: this.el,
            isMultitouch: false,
        });

        this.drag.changeDefaultandNormalGrab("default");
        this.drag.changeDefaultAndNormalGrabbing("pointer");

        this.zoom = this.editor.engine.modules.zoom;
    }

    setButtonEl(el: HTMLElement) {
        this.buttonElement = el;
    }

    init() {
        this.setupListeners();
    }

    setupListeners() {
        this.drag.enable();
        this.drag.onDrag = (dx, dy, x, y) => this.onDrag(x, y, dx, dy);
    }

    protected getEditorBlock(type: MDgameGridType, x: number, y: number): AnyBlock | false {
        return this.editor.grids[type].get(x, y) ?? false;
    }

    protected getRealBlock(type: MDgameGridType, x: number, y: number): AnyBlock | false {
        return this.editor.engine.levelManager.levelGrids[type].get(x, y) ?? false;
    }

    private onDrag(rx: number, ry: number, dx: number, dy: number) {
        if(!this.state.isToggled) return;

        this.dragHandler(...this.editor.snapToGridFromScreen(this.fixPos(rx, ry),
            this.editor.engine.levelManager.groups.static
        ), dx, dy);
    }

    protected dragHandler(x: number, y: number, dx?: number, dy?: number) {}

    protected fixPos(rx: number, ry: number): [number, number] {
        rx /= this.zoom.zoomLevel;
        rx += this.editor.engine.generator.player.x - innerWidth / 2 / this.zoom.zoomLevel;
        rx -= this.editor.engine.generator.player.halfW 
        / this.zoom.zoomLevel - this.editor.engine.generator.player.halfW;
        rx -= this.editor.levelGroups.world.x;

        ry /= this.zoom.zoomLevel;
        ry += this.editor.engine.generator.player.y - innerHeight / 2 / this.zoom.zoomLevel;
        ry -= this.editor.engine.generator.player.halfH / this.zoom.zoomLevel - this.editor.engine.generator.player.halfH;
        ry -= this.editor.levelGroups.world.y;

        return [rx, ry];
    }

    protected getGridPos(x: number, y: number): [number, number] {
        return [
            Math.floor(x / this.editor.engine.blockSize),
            Math.floor(y / this.editor.engine.blockSize),
        ];
    }
}
