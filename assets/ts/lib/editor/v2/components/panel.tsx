import { createSignal, For, Show, Signal, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { MD2editorV2 } from "../editor";
import { MDCTUIblockGridContainer } from "./block-grid";
import { SelectItemDiv } from "../../../misc/el/select";
import { Iwindow } from "../../../misc/el/window";
import { MDCTUIids } from "../main-ui";

export function EditorV2panel(p: {
    editor: MD2editorV2;
    modeSettingsVisiblitySignal: Signal<boolean>;
    editorModeSettings: JSX.Element[];
    [i: string]: any;
}): JSX.Element {
    const [props, other] = splitProps(p, ["editor", "modeSettingsVisiblitySignal", "editorModeSettings"]);
    const {editor} = props;

    const s = props.editor.selection;
    const utilBtnsVisibleSignal = createSignal(true);
    const blockGridVisibleSignal = createSignal(true);
    const [getModeSettingsVisibility, setModeSettingsVisibility] = props.modeSettingsVisiblitySignal;

    return <div {...other}>
        <Iwindow id={MDCTUIids.utilBtns}
            visibilitySignal={utilBtnsVisibleSignal}
            widthPercent={40}
            shrinkToScreen={true} title="Modes" heightPercent={20}>
            
            <Show fallback={<div id="md2-editor-v2-mode-settings-c">
                <button onclick={() => setModeSettingsVisibility(false)}>Back</button>
                <div id="editor-v2-mode-settings">
                    {props.editorModeSettings}
                </div>
            </div>} when={!getModeSettingsVisibility()}>
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
            </Show>
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