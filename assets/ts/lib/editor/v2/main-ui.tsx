import { createStore } from "solid-js/store";
import { Dict } from "../../misc/util";
import { BlockInfo } from "../../v2/types";
import { MDCTUItoolbar } from "./components/toolbar";
import { JSX } from "solid-js/jsx-runtime";
import { render } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import { MDCTUIblockGridContainer } from "./components/block-grid";
import { MD2editorV2 } from "./editor";
import { EditorV2panel } from "./components/panel";

export const MDCTUIids = {
    centerContainer: "center-block",
    toolbar: "toolbar",
    editor: "editor-v2",
    panel: "editor-v2-panel",
    categories: "editor-v2-categories",
    utilBtns: "editor-v2-util-btns",
    modeBtns: "editor-v2-mode-btns",
};

export const MDCTUIclasses = {
    blockGridC: "block-grid-c",
};

export class MDCTUI {
    currentCategory = createSignal("Forest");
    categoryStore = createStore<Dict<BlockInfo[]>>({});
    readonly selectedBlockSignal = createSignal<BlockInfo | undefined>();
    readonly getSelectedBlock = this.selectedBlockSignal[0];

    readonly visibilitySignal = createSignal(true);
    readonly modeSettingsVisiblitySignal = createSignal(false);
    readonly setModeSettingsVisibility = this.modeSettingsVisiblitySignal[1];
    static modeSettingsId = "#editor-v2-mode-settings";
    readonly editorModeSettingsElementArray: JSX.Element[] = [];

    editor: MD2editorV2;
    constructor(editor: MD2editorV2) {
        this.editor = editor;
    }

    onBlockSelect(o: BlockInfo) {
        
    }

    renderTo(el: HTMLElement) {
        render(() => <div id={MDCTUIids.editor}>
            <MDCTUItoolbar editor={this.editor} />
            <Show when={this.visibilitySignal[0]()}>
                <EditorV2panel 
                    modeSettingsVisiblitySignal={this.modeSettingsVisiblitySignal} 
                    id={MDCTUIids.panel} 
                    editorModeSettings={this.editorModeSettingsElementArray}
                    editor={this.editor} />
            </Show>
        </div>, el);
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