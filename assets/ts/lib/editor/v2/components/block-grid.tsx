import { JSX } from "solid-js/jsx-runtime";
import { SetStoreFunction, Store } from "solid-js/store";
import { Dict, NOOP } from "../../../misc/util";
import { BlockInfo } from "../../../v2/types";
import { createEffect, createSignal, For, on, Show, Signal, splitProps, Suspense } from "solid-js";
import { MDCTUI, MDCTUIclasses, MDCTUIids } from "../main-ui";
import { createImageFromTexture } from "../../../v2/data-loaders/spritesheet-functions";
import { _MD2engine } from "../../../v2/engine";
import { Iwindow } from "../../../misc/el/window";
import { SelectItemDiv } from "../../../misc/el/select";
import { MD2editor } from "../../main";
import { MD2editorV2 } from "../editor";

const [getPrArr, setPrArr] = createSignal<Promise<HTMLImageElement[]>[]>([]);

function BlockGrid(p: {
    md2: _MD2engine;
    blocks: BlockInfo[];
    onSelect: (o: BlockInfo) => void;
    selectedBlockSignal: Signal<BlockInfo | undefined>;
    [i: string]: any;
}): JSX.Element {
    const [props, other] = splitProps(p, ["blocks", "onSelect", "md2", "selectedBlockSignal"]);
    const elArr: JSX.Element[] = [];
    const localPrArr: Promise<HTMLImageElement>[] = [];

    return <SelectItemDiv<BlockInfo | undefined> {...other} 
        itemSignal={props.selectedBlockSignal} 
        onSelect={o => props.onSelect(o!)}>{setSelectedItem => {
        for(const o of props.blocks) {
            const [getSrcEl, setSrcEl] = createSignal<JSX.Element>(<p>Loading...</p>);

            const pr = createImageFromTexture(props.md2.dataManager, o.texture);
            localPrArr.push(pr);

            pr.then(img => setSrcEl(img));

            elArr.push(<button class={
                (props.selectedBlockSignal[0]()?.name === o.name) ? "selected" : undefined
            } onclick={() => setSelectedItem(o)}>
                <p class="mdctui-block-name">{o.name}</p>
                <Suspense fallback={
                    <p>Loading...</p>
                }>
                {getSrcEl()}
                </Suspense>
            </button>);
        }

        setPrArr(o => {
            o.push(Promise.all(localPrArr));
            return o;
        });

        return elArr;
    }}</SelectItemDiv>;
}

export function MDCTUIblockGridContainer(props: {
    categoryStore: [Dict<BlockInfo[]>, SetStoreFunction<Dict<BlockInfo[]>>];
    currentCategorySignal: Signal<string>;
    onSelect: (o: BlockInfo) => void;
    md2: _MD2engine;
    selectedBlockSignal: Signal<BlockInfo | undefined>;
    visibleSignal: Signal<boolean>;
    editor: MD2editorV2;
}): JSX.Element {
    const [getMoveFlag, setMoveFlag] = createSignal(false);
    Promise.all(getPrArr())
    .then(() => setMoveFlag(true));

    return <div class={MDCTUIclasses.blockGridC}>
        <Iwindow 
            visibilitySignal={props.visibleSignal}
            heightPercent={40}
            leftPercent={40}
            widthPercent={60}
            title="Blocks"
            canMove={getMoveFlag}
            shrinkToScreen={true} 
            borderWidth={10}>
            <SelectItemDiv<string>
                itemSignal={props.editor.ui.currentCategory}
                id={MDCTUIids.categories}
            >{setSelectedItem => 
                <For each={["Forest", "Entities", "Town"]}>{categoryName =>
                    <button 
                        class={(props.editor.ui.currentCategory[0]() === categoryName) ? "selected" : undefined}
                        onclick={() => setSelectedItem(categoryName)}>{categoryName}</button>
                }</For>
            }</SelectItemDiv>

            <For each={Object.entries(props.categoryStore[0])}>{([categoryName, blocks]) => 
                <Show when={props.currentCategorySignal[0]() == categoryName}>
                    <BlockGrid
                        onSelect={props.onSelect}
                        class="mdctui-block-grid" 
                        md2={props.md2} 
                        selectedBlockSignal={props.selectedBlockSignal}
                        blocks={blocks} />
                </Show>
            }</For>
        </Iwindow>
    </div>;
}