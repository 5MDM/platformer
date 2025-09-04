import { $$, SimpleExpander, ToggleList } from "../misc/util";
import { BlockInfo, EntityInfo } from "../v2/types";
import { _MD2engine } from "../v2/engine";
import { _utilBar } from "./util-bar";
import { _setEditorGridBlocks, MD2editor } from "./main";
import { _createLeftTabs, catDiv } from "./left-tabs";
import { _createToolbar, editorClickArea } from "./el";

const gridDiv = $$("div", {
    attrs: {
        id: "block-grid"
    }
});

gridDiv.addEventListener("wheel", e => {
    gridDiv.scrollTop += e.deltaY;
    gridDiv.scrollLeft += e.deltaX;
}, {passive: true});

export class MDcreatorToolsUI {
    static blockCatRecord: Record<string, HTMLElement[]> = {};
    static entities: HTMLElement[] = [];

    editor: MD2editor;

    static creatorToolsEl = $$("div", {
        attrs: {id: "creator-tools"},
        children: [
            catDiv,
            gridDiv,
            _utilBar,
        ]
    });

    static el: HTMLDivElement = $$("div", {
        attrs: {
            id: "editor-v2"
        },
        children: [
            editorClickArea,
            MDcreatorToolsUI.creatorToolsEl,
        ]
    });
    
    static isAppended = false;

    constructor(editor: MD2editor) {
        this.editor = editor;
    }

    blockExpander?: SimpleExpander<BlockInfo | EntityInfo, HTMLElement>;

    bindTo(el: HTMLElement) {
        _createLeftTabs(this);

        if(!MDcreatorToolsUI.isAppended)
            el.appendChild(MDcreatorToolsUI.el);

        MDcreatorToolsUI.isAppended = true;

        _createToolbar(this);
    }

    setGridEntities(entities: EntityInfo[]) {
        const arr = this.blockExpander!.parse(entities);
        
        MDcreatorToolsUI.entities.push(...arr);

        MDcreatorToolsUI.blockCatRecord["Entities"] = arr;

        for(const i of arr) {
            i.style.display = "none";
        }

        new ToggleList(arr, el => {
            el.classList.add("active");
            this.onGridButtonSelect(el.getAttribute("data-type")!, el.getAttribute("data-name")!);
        }, el => {
            el.classList.remove("active");
        }, gridDiv);

        _setEditorGridBlocks(arr);
    }

    setGridBlocks(blocks: BlockInfo[]) {
        const arr = this.blockExpander!.parse(blocks);
        
        for(const i in arr) {
            const cat = blocks[i].category;
            if(!MDcreatorToolsUI.blockCatRecord[cat]) MDcreatorToolsUI.blockCatRecord[cat] = [];

            MDcreatorToolsUI.blockCatRecord[cat].push(arr[i]);

            arr[i].style.display = "none";
        }

        _setEditorGridBlocks(arr);

        new ToggleList(arr, el => {
            el.classList.add("active");
            this.onGridButtonSelect(el.getAttribute("data-type")!, el.getAttribute("data-name")!);
        }, el => {
            el.classList.remove("active");
        }, gridDiv);
    }

    onGridButtonSelect: ((type: string, name: string) => void) = () => undefined;
}
