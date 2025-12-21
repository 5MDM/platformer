import { md2 } from "../../constants";
import { MixedList } from "../misc/el";
import { $$, SimpleExpander, ToggleList } from "../misc/util";
import { EditorStates } from "./main";

const imgGlob = import.meta.glob<{ default: string; }>("../../../images/ui/*.png");

const utilBarButtons = new SimpleExpander<[
    EditorStates | string,
    string,
    isMode?: boolean,
    isActive?: boolean,
], HTMLElement>(([name, url, isMode, isActive]) => {
    const el = $$("img", {
        attrs: {
            alt: name,
        },
    });

    if(isMode) el.addEventListener("pointerup", () => md2._editorEmit(name, el));
    else el.addEventListener("pointerup", () => md2._editorEmit(name, el));

    imgGlob["../../../images/ui/" + url]()
    .then(src => el.src = src.default);

    if(isActive && isMode) setTimeout(() => md2._editorEmit(name), 200);

    return el;
}).parse([
    ["rotate-right", "rotate-right.png"],
    ["rotate-left", "rotate-left.png"],
    ["delete", "trash.png", true],
    ["click", "place-block.png", true, true],
    ["multiEdit", "row-edit.png", true],
    ["zoom in", "zoom-in.png"],
    ["zoom out", "zoom-out.png"],
    ["pan", "move-arrow.png", true],
    ["recenter", "recenter.png"],
    ["edit", "edit.png", true],
    ["filter", "graphics-filter.png", false],
    ["editLevel", "edit-level.png"],
    ["shade", "rotate-right.png"]
]);

new MixedList().bind(utilBarButtons);

export const _utilBar = $$("div", {
    attrs: {
        id: "util-bar",
    },
    children: [
        ...utilBarButtons,
    ],
});

