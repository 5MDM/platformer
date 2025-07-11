import { mdshell } from "../../constants";
import { ElList } from "../../lib/el";
import { MDshell } from "../../lib/md-framework/shell";
import { $, $$, ToggleState } from "../../lib/util";
import { devRotate } from "./studio";
import { editorTools } from "./studio";
import { zoomState } from "./zoom";

const imgs = import.meta.glob<{default: string}>("/assets/images/*.png");

export const editorModes: Record<string, ToggleState> = {};
const funcs: Record<string, () => void> = {};

interface Elt {
    src: string;
    name: string;
    state?: ToggleState;
    f?: () => void;
    isToggled?: boolean;
}

const modeArr: Elt[] = [
    {
        name: "multiPlacement",
        src: "row-edit.png",
        state: editorTools.multiPlacementState,
    },
    {
        name: "zoom",
        src: "zoom.png",
        state: zoomState,
    },
    {
        name: "rotate-right",
        src: "rotate-right.png",
        f() {devRotate(90)},
    },
    {
        name: "rotate-left",
        src: "rotate-left.png",
        f() {devRotate(-90)},
    },
    {
        name: "edit",
        src: "interact-btn.png",
        state: editorTools.editState,
    },
    {
        name: "delete",
        src: "trash.png",
        state: editorTools.deleteState,
    }
];

const list = new ElList<Elt>("selected", async opts => {
    if(opts.state) editorModes[opts.name] = opts.state;

    const el = $$("button", {
        attrs: {
            "data-name": opts.name,
        },
        children: [
            $$("img", {
                attrs: {
                    alt: opts.name,
                    src: (await imgs["/assets/images/" + opts.src]()).default,
                }
            }),
        ],
    });

    if(opts.isToggled) {
        //const name: string = el.getAttribute("data-name")!;

        if(opts.state) {
            opts.state.toggle();
            el.classList.add("selected");
        }
    }

    if(opts.f) funcs[opts.name] = opts.f;

    return el;
}, (el: HTMLElement) => {
    const name: string = el.getAttribute("data-name")!;
    const toggleState = editorModes[name];
    const f = funcs[name];
    if(toggleState) {
        toggleState.toggle();
        if(toggleState.isToggled) {
            el.classList.add("selected");
        } else {
            el.classList.remove("selected");
        }
    } else if(!!f) {
        f();
    } else {
        MDshell.Err("list problem in modes.ts")
    }
});

const editorModesEl = $("#ui > #editor #mode");

list.parse(modeArr, editorModesEl);
