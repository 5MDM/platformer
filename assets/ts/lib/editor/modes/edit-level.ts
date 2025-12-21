import { JSONtable } from "../../misc/el/json-table";
import { $$ } from "../../misc/util";
import { MDcreatorToolsUI } from "../creator-tools";
import { _MD2editorBase } from "./main";

const jsonTable = new JSONtable();

const btn = $$("button", {
    text: "Save and edit"
});

const el = $$("div", {
    children: [
        btn
    ]
});

export class _MD2editLevelMode extends _MD2editorBase {
    data = {
        levelBackground: "none"
    };

    init(): void {
        super.init();

        el.appendChild(jsonTable.parse(this.data));

        btn.onpointerup = () => this.onUp();
    }

    private onUp() {
        jsonTable.triggerEdit();
        this.editor.engine.generator.setBackground(this.data.levelBackground);
    }

    protected onEnable(): void {
        super.onEnable();

        MDcreatorToolsUI.setCenterBlockEl(el);
    }

    protected onDisable(): void {
        super.onDisable();

        MDcreatorToolsUI.removeCenterBlockEl(el);
    }
}