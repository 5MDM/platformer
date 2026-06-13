import { $$, Dict, SimpleExpander, ToggleList } from "../misc/util";
import { BlockInfo, EntityInfo } from "../v2/types";
import { _MD2engine } from "../v2/engine";
import { _utilBar } from "./util-bar";
import { _setEditorGridBlocks, MD2editor } from "./main";
import { _createLeftTabs, catDiv } from "./left-tabs";
import { _createToolbar, editorClickArea } from "./el";
import { render } from "solid-js/web";
import { createResource, createRoot, createSignal, For, JSX, onMount, Setter, Show, Signal } from "solid-js";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { createImageFromTexture } from "../v2/data-loaders/spritesheet-functions";

const centerBlock = $$("div", {
    attrs: {
        id: "center-block",
    }
});

function GridDiv(props: {categoriesStore: [Dict<BlockInfo[]>, set: SetStoreFunction<Dict<BlockInfo[]>>], currentCategory: Signal<string>}) {
    let el!: HTMLDivElement;

    onMount(() => {
        el;

        // setTimeout(() => {
        //     props.categoriesStore[1]("test", []);
        //     //props.currentCategory[1]("Ice");
        //     console.log(1, console.log(props.categoriesStore[0]))
        // }, 1000);
    });

    return <div id="block-grid" ref={el}
    on:wheel={{handleEvent(e) {
        e.target.scrollTop += e.deltaY;
        e.target.scrollLeft += e.deltaX;
    }, passive: true}}>
        <For each={Object.entries(props.categoriesStore[0])}>{([categoryName, blocks]) => {
            const el = <Show when={props.currentCategory[0]() == categoryName}>
                <For each={blocks}>{block => {
                    const r = createResource(async () => await createImageFromTexture(
                        MDcreatorToolsUI.editor.engine.dataManager,
                        block.texture
                    ));

                    const el = <button data-name={block.name} onclick={e => {
                        const {texture, type} = block;
                        MDcreatorToolsUI.editor.selectedBlock = texture;
                        MDcreatorToolsUI.editor.selectedBlockType = type || "fg";
                    }}>
                        {r[0]()}
                        <p>{block.name}</p>
                    </button>;

                    return el;
                }}</For>
            </Show>;

            return el;
        }}</For>
    </div>;

}

export class MDcreatorToolsUI {
    static readonly currentCategorySignal = createSignal("Forest");

    static categoriesStore = createStore<Dict<BlockInfo[]>>({});

    static blockCatRecord: Record<string, HTMLElement[]> = {};
    static entities: HTMLElement[] = [];

    static readonly gridDiv = createRoot(dispose => <GridDiv 
        currentCategory={this.currentCategorySignal}
        categoriesStore={this.categoriesStore} />);

    static editor: MD2editor;

    static setCenterBlockEl(el: HTMLElement) {
        centerBlock.appendChild(el);
        centerBlock.style.display = "grid";
    }

    static removeCenterBlockEl(el: HTMLElement) {
        if(centerBlock.children.length == 0) return;
        centerBlock.removeChild(el);
        centerBlock.style.display = "none";
    }

    static visibilitySignal = createSignal(true);

    static creatorToolsEl = createRoot(dispose => <Show when={MDcreatorToolsUI.visibilitySignal[0]()}>
        <div id="creator-tools">
            {catDiv}
            <div>{centerBlock}{MDcreatorToolsUI.gridDiv}</div>
            {_utilBar}
        </div>;
    </Show>);

    static signals = {
        // buttons on the top
        toolbarArr: createSignal<HTMLElement[]>([]),
    };

    static el = createRoot(dispose => <div id="editor-v2">
        {MDcreatorToolsUI.signals.toolbarArr[0]()}
        {editorClickArea}
        {MDcreatorToolsUI.creatorToolsEl}
    </div>);
    
    static isAppended = false;

    constructor(editor: MD2editor) {
        MDcreatorToolsUI.editor = editor;
    }

    blockExpander?: SimpleExpander<BlockInfo | EntityInfo, HTMLElement>;

    bindTo(el: HTMLElement) {
        _createLeftTabs(this);

        if(!MDcreatorToolsUI.isAppended)
            //el.appendChild(MDcreatorToolsUI.el);
            render(() => MDcreatorToolsUI.el, el);

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

        // new ToggleList(arr, el => {
        //     el.classList.add("active");
        //     this.onGridButtonSelect(el.getAttribute("data-type")!, el.getAttribute("data-name")!);
        // }, el => {
        //     el.classList.remove("active");
        // }, gridDiv);

        _setEditorGridBlocks(arr);
    }

    setGridBlocks(blocks: BlockInfo[]) {
        const categories = MDcreatorToolsUI.categoriesStore[0];
        const setCategories = MDcreatorToolsUI.categoriesStore[1];

        for(const block of blocks) {
            const {category} = block;
            const currentCategories = categories;

            if(!currentCategories[category])
                setCategories(category, [block]);
            else setCategories(category, [...currentCategories[category], block])
        }
    }

    onGridButtonSelect: ((type: string, name: string) => void) = () => undefined;
}
