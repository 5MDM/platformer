import { createSignal, For, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { MD2editorV2 } from "../editor";
import { MDCTUIblockGridContainer } from "./block-grid";
import { SelectItemDiv } from "../../../misc/el/select";
import { NOOP } from "../../../misc/util";
import { Iwindow } from "../../../misc/el/window";
import { MDCTUIclasses, MDCTUIids } from "../main-ui";

export function EditorV2panel(p: {
    editor: MD2editorV2;
    [i: string]: any;
}): JSX.Element {
    const [props, other] = splitProps(p, ["editor"]);
    const {editor} = props;

    const s = props.editor.selection;
    const utilBtnsVisibleSignal = createSignal(true);
    const blockGridVisibleSignal = createSignal(true);

    return <div {...other}>
        <Iwindow id={MDCTUIids.utilBtns}
            visibilitySignal={utilBtnsVisibleSignal}
            widthPercent={40}
            shrinkToScreen={true} title="Modes" heightPercent={20}>
            <SelectItemDiv<string | undefined> 
                id={MDCTUIids.modeBtns}
                onSelect={name => s.changeModeTo(name!)}
                itemSignal={s.modeName}>{setSelectedItem => 
                <For each={Object.entries(props.editor.modes)}>{([name, mode]) =>
                    <button 
                        class={(s.modeName[0]() === name) ? "selected" : undefined}
                        onclick={() => setSelectedItem(name)}>
                        {name}
                    </button>
                }</For>
            }</SelectItemDiv>
        </Iwindow>

        <MDCTUIblockGridContainer 
            editor={props.editor}
            visibleSignal={blockGridVisibleSignal}
            onSelect={editor.ui.onBlockSelect.bind(editor)}
            md2={editor.engine}
            selectedBlockSignal={editor.ui.selectedBlockSignal}
            categoryStore={editor.ui.categoryStore} 
            currentCategorySignal={editor.ui.currentCategory} />
    </div>
}