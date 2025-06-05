import { ElList } from "../../lib/el";
import { MDshell } from "../../lib/md-framework/shell";
import { $, $$, ToggleState } from "../../lib/util";
import { rowEditState } from "./row-edit";
import { zoomState } from "./zoom";

const modes: Record<string, ToggleState> = {};

interface Elt {
    src: string;
    name: string;
    state: ToggleState;
    isToggled?: boolean;
}

const modeArr: Elt[] = [
    {
        name: "row-edit",
        src: "row-edit.png",
        state: rowEditState,
    },
    {
        name: "zoom",
        src: "zoom.png",
        state: zoomState,
    },
];

const list = new ElList<Elt>("selected", opts => {
    modes[opts.name] = opts.state;

    const el = $$("button", {
        attrs: {
            "data-name": opts.name,
        },
        children: [
            $$("img", {
                attrs: {
                    alt: opts.name,
                    src: "assets/images/" + opts.src,
                }
            }),
        ],
    });

    if(opts.isToggled) {
        //const name: string = el.getAttribute("data-name")!;

        opts.state.toggle();
        el.classList.add("selected");
    }

    return el;
}, (el: HTMLElement) => {
    const name: string = el.getAttribute("data-name")!;
    const toggleState = modes[name];
    if(!toggleState) return MDshell.Err("toggle state is undefined in modes.ts");

    toggleState.toggle();
    if(toggleState.isToggled) {
        el.classList.add("selected");
    } else {
        el.classList.remove("selected");
    }
});

list.parse(modeArr, $("#ui > #editor #mode"));