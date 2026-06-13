import { createStore } from "solid-js/store";
import { Dict } from "../../misc/util";
import { BlockInfo } from "../../v2/types";
import { MD2editor } from "../main";
import { MDCTUItoolbar } from "./toolbar";
import { JSX } from "solid-js/jsx-runtime";
import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { MDCTUIblockGridContainer } from "./block-grid";

export const MDCTUIids = {
    centerContainer: "center-block",
    toolbar: "toolbar",
    editor: "editor-v2"
};

export const MDCTUIclasses = {
    blockGridC: "block-grid-c"
};

export class MDCTUI {
    currentCategory = createSignal("Forest");
    categoryStore = createStore<Dict<BlockInfo[]>>({});

    visibilitySignal = createSignal(true);

    editor: MD2editor;
    constructor(editor: MD2editor) {
        this.editor = editor;
    }

    renderTo(el: HTMLElement) {
        render(() =>
            <div id={MDCTUIids.editor}>
                <MDCTUItoolbar editor={this.editor} />
                <MDCTUIblockGridContainer 
                    categoryStore={this.categoryStore} 
                    currentCategorySignal={this.currentCategory} />
            </div>
        , el);
    }

    addBlocksByArray(blocks: BlockInfo[]) {
        for(const block of blocks) this.addBlock(block);
    }

    addBlock(block: BlockInfo) {
        const [get, set] = this.categoryStore;
        const oldArr = get[block.category];
        if(!oldArr) set(block.category, [block]);
        else {
            set(block.category, [...oldArr, block]); 
        }
    }
}