import { MD2editor } from "../main";
import { _MD2editorBase } from "./main";

export class _MD2editorPan extends _MD2editorBase {
    scrollListener = (e: WheelEvent) => {
        this.dragHandler(0, 0, e.deltaX, e.deltaY);
    }

    protected onEnable(): void {
        super.onEnable();
        //this.editor.testSprite.visible = false;
        this.el.addEventListener("wheel", this.scrollListener, {passive: true});
    }

    protected onDisable(): void {
        super.onDisable();
        this.editor.testSprite.visible = true;
        this.el.removeEventListener("wheel", this.scrollListener);
    }

    protected dragHandler(x: number, y: number, dx: number, dy: number): void {
        this.editor.engine.levelManager.groups.world.x -= dx;
        this.editor.engine.levelManager.groups.world.y -= dy;
    }
}