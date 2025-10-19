import { md2 } from "../../constants";
import { MixedList } from "../misc/el";
import { $$, SimpleExpander, ToggleList } from "../misc/util";

const imgGlob = import.meta.glob<{ default: string; }>("../../../images/ui/*.png");

const utilBarButtons = new SimpleExpander<[
    string,
    string,
    string,
    isMode?: boolean,
    isActive?: boolean,
], HTMLElement>(([name, url, eventName, isMode, isActive]) => {
    const el = $$("img", {
        attrs: {
            alt: name,
        },
    });

    if(isMode) el.addEventListener("pointerup", () => md2._editorEmit(eventName, el));
    else el.addEventListener("pointerup", () => md2._editorEmit(eventName, el));

    imgGlob["../../../images/ui/" + url]()
    .then(src => el.src = src.default);

    if(isActive && isMode) setTimeout(() => md2._editorEmit(eventName), 200);

    return el;
}).parse([
    ["rotate-right", "rotate-right.png", "rotate-right"],
    ["rotate-left", "rotate-left.png", "rotate-left"],
    ["delete", "trash.png", "delete", true],
    ["placement", "place-block.png", "placement", true, true],
    ["multi", "row-edit.png", "multi", true],
    ["zoom in", "zoom-in.png", "zoom-in"],
    ["zoom out", "zoom-out.png", "zoom-out"],
    ["pan", "move-arrow.png", "pan", true],
    ["recenter", "recenter.png", "recenter"],
    ["edit", "edit.png", "edit", true],
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

