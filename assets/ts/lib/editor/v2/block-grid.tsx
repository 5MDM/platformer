import { JSX } from "solid-js/jsx-runtime";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Dict, objToCSSstring } from "../../misc/util";
import { BlockInfo } from "../../v2/types";
import { Accessor, For, Show, Signal } from "solid-js";
import { MDCTUIclasses } from "./main-ui";
import { MovableContent } from "../../misc/el/movable-content";

function BlockGrid(props: {blocks: BlockInfo[]}): JSX.Element {
    return <div>
        <For each={props.blocks}>{(o) => <div>
            <p>{o.name}</p>
        </div>}</For>
    </div>;
}

export function MDCTUIblockGridContainer(props: {
    categoryStore: [Dict<BlockInfo[]>, SetStoreFunction<Dict<BlockInfo[]>>],
    currentCategorySignal: Signal<string>,
}): JSX.Element {

    return <div class={MDCTUIclasses.blockGridC}>
        <MovableContent shrinkToScreen={true} borderWidth={10}>
            <For each={Object.entries(props.categoryStore[0])}>{([categoryName, blocks]) => 
                <Show when={props.currentCategorySignal[0]() == categoryName}>
                    <BlockGrid blocks={blocks} />
                </Show>
            }</For>
        </MovableContent>
    </div>;
}