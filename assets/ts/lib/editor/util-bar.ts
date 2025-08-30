import { $$, SimpleExpander } from "../misc/util";


export const _utilBarEvents: Record<string, () => void> = {
    rotateLeft() {},
    rotateRight() {},
    activateDelete() {},
};

const imgGlob = import.meta.glob<{ default: string; }>("../../../images/*.png");

export const _utilBar = $$("div", {
    attrs: {
        id: "util-bar",
    },
    children: [
        ...new SimpleExpander<[
            string,
            string,
            () => void,
        ], HTMLElement>(([name, url, up]) => {
            const el = $$("img", {
                attrs: {
                    alt: name,
                },
                up,
            });

            imgGlob["../../../images/" + url]()
            .then(src => el.src = src.default);

            return el;
        }).parse([
            ["rotate-right", "rotate-right.png", () => _utilBarEvents.rotateRight()],
            ["rotate-left", "rotate-left.png", () => _utilBarEvents.rotateLeft()],
            ["delete", "trash.png", () => _utilBarEvents.activateDelete()],
        ]),
    ],
});