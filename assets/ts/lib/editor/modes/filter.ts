import { Filter } from "pixi.js";
import { _MD2editorBase } from "./main";

export class _MD2filterMode extends _MD2editorBase {
    get staticC() {
        return this.editor.engine.levelManager.groups.static;
    }

    protected onEnable(): void {
        super.onEnable();

        for(const filter of this.staticC.filters)
            filter.enabled = false;
    }

    protected onDisable(): void {
        super.onDisable();

        for(const filter of this.staticC.filters) {
            filter.enabled = true;
        }
    }
}