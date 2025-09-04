import { MixedList } from "../misc/el";
import { $$, SimpleExpander, ToggleList } from "../misc/util";


export const _utilBarEvents = {
    rotateLeft() {},
    rotateRight() {},
    activateDelete(el: HTMLElement) {},
    activatePlacement(el: HTMLElement) {},
};

const imgGlob = import.meta.glob<{ default: string; }>("../../../images/*.png");

const utilBarButtons = new SimpleExpander<[
    string,
    string,
    ((el: HTMLElement) => void) | (() => void),
    isMode?: boolean,
    isActive?: boolean,
], HTMLElement>(([name, url, up, isMode, isActive]) => {
    const el = $$("img", {
        attrs: {
            alt: name,
        },
    });

    if(isMode) el.addEventListener("pointerup", () => up(el));
    else el.addEventListener("pointerup", () => (up as () => void)());

    imgGlob["../../../images/" + url]()
    .then(src => el.src = src.default);

    //if(!isMode) MixedList.markAsNotNeedingBind(el);
    //if(!isMode) el.setAttribute("md-editor-is-button", "true");
    if(isActive && isMode) setTimeout(() => up(el), 100);

    return el;
}).parse([
    ["rotate-right", "rotate-right.png", () => _utilBarEvents.rotateRight()],
    ["rotate-left", "rotate-left.png", () => _utilBarEvents.rotateLeft()],
    ["delete", "trash.png", el => _utilBarEvents.activateDelete(el), true],
    ["placement", "row-edit.png", el => _utilBarEvents.activatePlacement(el), true, true],
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

