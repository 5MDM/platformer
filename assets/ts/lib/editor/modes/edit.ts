import { boundsPool } from "pixi.js";
import { JSONtable } from "../../misc/el/json-table";
import { $$ } from "../../misc/util";
import { AnyBlock, FgBlock } from "../../v2/blocks/blocks";
import { MDgameGridType, XYtuple } from "../../v2/types";
import { MDcreatorToolsUI } from "../creator-tools";
import { _MD2editorBase } from "./main";

const jsonTable = new JSONtable();

const editBtn = $$("button", {
    text: "Save and Edit"
});

editBtn.addEventListener("pointerup", () => jsonTable.triggerEdit());

const editEl = $$("div", {
    children: [
        editBtn,
    ]
});

export class _MD2editMode extends _MD2editorBase {
    lastPos: XYtuple = [-1, -1];
    typeCounter = 0;
    blockType: MDgameGridType = "overlay";
    highlightedBlock?: AnyBlock;

    protected lastBlock?: AnyBlock;

    init(): void {
        super.init();
        this.el.addEventListener("pointerup", e => {
            if(!this.state.isToggled) return;

            this.onClick(...this.editor.snapToGridFromScreen(this.fixPos(e.pageX, e.pageY),
                this.editor.engine.levelManager.groups.static
            ));
        });
    }

    protected onEnable(): void {
        super.onEnable();

        MDcreatorToolsUI.setCenterBlockEl(editEl);
    }

    protected onDisable(): void {
        super.onDisable();
        if(this.highlightedBlock) this.highlightedBlock.sprite.tint = 0xffffff;

        MDcreatorToolsUI.removeCenterBlockEl(editEl);
    }

    protected onClick(rx: number, ry: number, dx?: number, dy?: number): void {
        const block = this.getBlock(...this.getGridPos(rx, ry), this.blockType);
        if(!block) return;

        if(this.lastBlock)
            if(this.lastBlock.id == block.id) return;

        if(this.highlightedBlock) this.highlightedBlock.sprite.tint = 0xffffff;
        this.highlightedBlock = block;
        block.sprite.tint = 0xfff000;

        this.lastBlock = block;

        if(editEl.childNodes[1]) editEl.removeChild(editEl.childNodes[1]);

        const components: undefined | Object = (() => {
            if(!(block instanceof FgBlock) ) return;
            if(Object.keys(block.components.components).length == 0) return;

            const o: Record<string, any> = {};
            for(const name in block.components.components) {
                o[name] = block.components.components[name].opts;
            }

            return o;
        })();

        editEl.appendChild(jsonTable.parse(components || {}));

        editBtn.onpointerup = () => {
            console.log(block.components.components.rotation);
            block.components.restartComponents();
        };
    }

    protected getBlock(x: number, y: number, type: MDgameGridType): undefined | FgBlock {
        const block = this.getRealBlock("fg", x, y) as FgBlock;
        if(block) return block;
        else return;
    }

    protected switchBlockType(): MDgameGridType {
        switch(this.blockType) {
            case "overlay": return "fg"; break;
            case "fg": return "bg"; break;
            case "bg": return "overlay"; break;
        }
    }
}