import { JSX } from "solid-js/jsx-runtime";
import { MD2editor } from "../../main";
import { _MD2engine } from "../../../v2/engine";
import { MDCTUI, MDCTUIids } from "../main-ui";
import { createSignal, For, Show, Signal } from "solid-js";
import { MD2editorV2 } from "../editor";

interface ToolbarObj {
    [name: string]: ToolbarObj | ((editor: MD2editorV2, md2: _MD2engine) => void) | string;
}

const toolbarObj: ToolbarObj = {
    File: {
        Export(e, md2) {
            const data = md2.levelManager.exportCurrentLevel();
            navigator.clipboard.writeText(JSON.stringify(data))
            .then(() => alert("Copied level json"))
            .catch(err => alert(err));
        },
        Load(e, md2) {
            const txt = prompt("Paste level data");
            if(!txt) return;

            md2.levelManager.loadLevelFromJSONstring(txt);
        },
        New(e, md2) {
            md2.levelManager.destroyCurrentLevel();
        }
    },
    Edit: {
        "Toggle Editor": "toggle-editor",
        "Save Changes": "save-changes",
        "Cancel editor changes": "cancel-changes",
        "Switch dimensions": "switch-dimensions",
    }
};

var lastElementVisibilitySignal: Signal<boolean>;

function onDropdownBtnClick(signal: Signal<boolean>) {
    if(lastElementVisibilitySignal != signal
    && lastElementVisibilitySignal?.[0]()) 
        lastElementVisibilitySignal[1](false);

    lastElementVisibilitySignal = signal;

    // toggles visbility
    signal[1](!signal[0]());
}

function ToolbarEl(props: {obj: ToolbarObj, editor: MD2editorV2, id?: string}): JSX.Element {
    return <div id={props.id}>
        <For each={Object.entries(props.obj)}>{([name, val]) => {
            const type = typeof val;

            // makes a dropdown
            if(type == "object") {
                const signal = createSignal(false);

                return <div>
                    <button onclick={() => onDropdownBtnClick(signal)}>{name}</button>
                    <Show when={signal[0]()}>
                        <ToolbarEl obj={val as ToolbarObj} editor={props.editor} />
                    </Show>
                </div>;
            }
            
            // event emitter
            else if(type == "string") 
                return <button onclick={() => props.editor.engine._editorEmit(val as string)}>
                    {name}
                </button>;
            
            // runs a function
            else return <button onclick={
                () => (val as ((editor: MD2editorV2, md2: _MD2engine) => void))
                (props.editor, props.editor.engine)
            }>{name}</button>;
        }}</For>
    </div>;
}

export function MDCTUItoolbar(props: {editor: MD2editorV2}): JSX.Element {
    return <ToolbarEl id={MDCTUIids.toolbar} obj={toolbarObj} editor={props.editor} />
}