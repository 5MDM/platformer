import { For, splitProps } from "solid-js";
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

    return <div {...other}>
        <Iwindow id={MDCTUIids.utilBtns}
            widthPercent={50}
            shrinkToScreen={true} title="Categories" heightPercent={30}>
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
            <SelectItemDiv<string>
                itemSignal={editor.ui.currentCategory}
                onSelect={NOOP}
                id={MDCTUIids.categories}
            >{setSelectedItem => 
                <For each={["Forest", "Entities", "Town"]}>{categoryName =>
                    <button 
                        class={(editor.ui.currentCategory[0]() === categoryName) ? "selected" : undefined}
                        onclick={() => setSelectedItem(categoryName)}>{categoryName}</button>
                }</For>
            }</SelectItemDiv>
        </Iwindow>

        <MDCTUIblockGridContainer 
            onSelect={editor.ui.onBlockSelect.bind(editor)}
            md2={editor.engine}
            selectedBlockSignal={editor.ui.selectedBlockSignal}
            categoryStore={editor.ui.categoryStore} 
            currentCategorySignal={editor.ui.currentCategory} />
    </div>
}