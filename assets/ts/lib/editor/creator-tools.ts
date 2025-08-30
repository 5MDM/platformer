import { $$, SimpleExpander, ToggleList } from "../misc/util";
import { BlockInfo } from "../v2/types";
import { _MD2engine } from "../v2/engine";
import { _utilBar } from "./util-bar";
import { _setEditorGridBlocks } from "./main";
import { blockGridExpander, catDiv } from "./left-tabs";

const gridDiv = $$("div", {
    attrs: {
        id: "block-grid"
    }
});

gridDiv.addEventListener("wheel", e => {
    gridDiv.scrollTop += e.deltaY;
    gridDiv.scrollLeft += e.deltaX;
}, {passive: true});

var gridF: (name: string) => void = () => undefined;

export const blockCatRecord: Record<string, HTMLElement[]> = {};

export function _setGridBlocks(blocks: BlockInfo[]) {
    const arr = blockGridExpander.parse(blocks);
    
    for(const i in arr) {
        const cat = blocks[i].category;
        if(!blockCatRecord[cat]) blockCatRecord[cat] = [];

        blockCatRecord[cat].push(arr[i]);

        arr[i].style.display = "none";
    }

    _setEditorGridBlocks(arr);

    new ToggleList(arr, el => {
        el.classList.add("active");
        gridF(el.getAttribute("data-name")!);
    }, el => {
        el.classList.remove("active");
    }, gridDiv);
}

export function _setGridF(f: (name: string) => void) {
    gridF = f;
}

export const _creatorTools = $$("div", {
    attrs: {id: "creator-tools"},
    children: [
        catDiv,
        gridDiv,
        _utilBar,
    ]
});
