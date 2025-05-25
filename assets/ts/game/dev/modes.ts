import { ElList } from "../../lib/el";
import { MDshell } from "../../lib/md-framework/shell";
import { $, $$, ToggleState } from "../../lib/util";
import { rowEditState } from "./row-edit";

const modes: Record<string, ToggleState> = {
    "row-edit": rowEditState,
};

const modeArr = [
    {
        name: "row-edit",
        src: "row-edit.png",
        isToggled: true,
    }
];

const list = new ElList<{
    src: string;
    name: string;
    isToggled?: boolean;
}>("selected", opts => {
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
        const name: string = el.getAttribute("data-name")!;
        const toggleState = modes[name];
        if(!toggleState) MDshell.Err("toggle state is undefined in modes.ts");

        toggleState.toggle();
        el.classList.add("selected");
    }

    return el;
}, (el: HTMLElement) => {
    const name: string = el.getAttribute("data-name")!;
    const toggleState = modes[name];
    if(!toggleState) MDshell.Err("toggle state is undefined in modes.ts");

    toggleState.toggle();
    if(toggleState.isToggled) {
        el.classList.add("selected");
    } else {
        el.classList.remove("selected");
    }
});

list.parse(modeArr, $("#ui > #editor #mode"));