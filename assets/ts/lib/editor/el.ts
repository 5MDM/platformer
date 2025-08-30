import { md2 } from "../../constants";
import { $$, SimpleExpander } from "../misc/util";
import { _creatorTools } from "./creator-tools";
import { MD2editor } from "./main";

type ToolbarObject = [string, (ToolbarObject[] | (() => void))?];

var lastToolbarParent = "";
const visibleElements: HTMLElement[] = [];

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

export const _toolbarEvents: Record<string, Record<string, () => void>> = {
    edit: {
        saveChanges() {},
        cancelChanges() {},
        toggleCreatorTools() {},
    }
};

export var isCreatorToolsEnabled = true;

if(!isCreatorToolsEnabled) _creatorTools.style.display = "none";

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
                    isCreatorToolsEnabled = !isCreatorToolsEnabled;

                    if(isCreatorToolsEnabled) {
                        _creatorTools.style.display = "grid";
                    } else {
                        _creatorTools.style.display = "none";
                    }

                    _toolbarEvents.edit.toggleCreatorTools();
                }],
                ["Save editor changes", () => _toolbarEvents.edit.saveChanges()],
                ["Cancel editor changes", () => _toolbarEvents.edit.cancelChanges()],
            ]],
            ["Levels", [
                ["Nothing here yet"]
            ]],
        ])
    ]
});

export const editorClickArea = $$("div", {
    attrs: {
        id: "click-area"
    }
});

/**
 * @private
 */
export const _editorEl: HTMLDivElement = $$("div", {
    attrs: {
        id: "editor-v2"
    },
    children: [
        toolbar,
        editorClickArea,
        _creatorTools,
    ]
});