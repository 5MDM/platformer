import { md2 } from "../../constants";
import { $$, SimpleExpander } from "../misc/util";
import { MDcreatorToolsUI } from "./creator-tools";
import { MD2editor } from "./main";

var lastToolbarParent = "";
const visibleElements: HTMLElement[] = [];

type ToolbarObject = [string, (ToolbarObject[] | (() => void))?];

function toolbarF(arr: ToolbarObject, isFirst = true): HTMLElement {
    const btn = $$("button", {text: arr[0]});

    const el = $$("div", {
        children: [btn],
    });

    if(!isFirst) el.style.display = "none";

    if(Array.isArray(arr[1])) {
        for(const i of arr[1]) {
            const a = toolbarF(i, false);

            el.appendChild(a);
        }

        btn.onpointerup = () => {
            if(isFirst && arr[0] != lastToolbarParent) {
                lastToolbarParent = arr[0];
                while(visibleElements.length > 0) {
                    visibleElements[0].style.display = "none";
                    visibleElements.shift();
                }
            }

            for(const i of el.children) {
                if(isFirst && (i as HTMLElement) == el.firstChild) continue;
                (i as HTMLElement).style.display = "block";
                visibleElements.push(i as HTMLElement);
            }

            lastToolbarParent = arr[0];
        };
    } else if(arr[1] instanceof Function) {
        btn.onpointerup = () => {
            (arr[1] as () => void)();

            while(visibleElements.length > 0) {
                visibleElements[0].style.display = "none";
                visibleElements.shift();
            }
        };
    } else {
        btn.onpointerup = () => {
            if(isFirst && arr[0] != lastToolbarParent) {
                lastToolbarParent = arr[0];
                while(visibleElements.length > 0) {
                    visibleElements[0].style.display = "none";
                    visibleElements.shift();
                }
            }

            lastToolbarParent = arr[0];
        };
    }

    return el;
}

export function _createToolbar(creatorToolsUI: MDcreatorToolsUI) {
    const toolbar = $$("div", {
        attrs: {
            id: "toolbar"
        },
        children: [
            ...new SimpleExpander<ToolbarObject, HTMLElement>(toolbarF)
            .parse([
                ["File",
                    [
                        ["export", () => {
                            const data = md2.levelManager.exportCurrentLevel();
                            navigator.clipboard.writeText(JSON.stringify(data))
                            .then(() => alert("Copied level json"))
                            .catch(err => alert(err));
                        }],
                        ["load", () => {
                            const txt = prompt("Paste level data");
                            if(!txt) return;

                            md2.levelManager.loadLevelFromJSONstring(txt);
                        }],
                        ["new", () => {
                            md2.levelManager.destroyCurrentLevel();
                        }],
                    ]
                ],
                ["Edit", [
                    ["Toggle creator tools", () => {
                        MD2editor.creatorToolsState.toggle();
                    }],
                    ["Save editor changes", () => md2._editorEmit("save-changes")],
                    ["Cancel editor changes", () => md2._editorEmit("cancel-changes")],
                ]],
                ["Levels", [
                    ["Nothing here yet"]
                ]],
            ])
        ]
    });

    MDcreatorToolsUI.el.prepend(toolbar);
}

export const editorClickArea = $$("div", {
    attrs: {
        id: "click-area"
    }
});