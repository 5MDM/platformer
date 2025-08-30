import { MDtab } from "../misc/el/tabs";
import { $$, SimpleExpander, ToggleList } from "../misc/util";
import { _MD2engine } from "../v2/engine";
import { BlockInfo } from "../v2/types";
import { blockCatRecord } from "./creator-tools";
type CatObj = [string];

const categories: HTMLButtonElement[] = new SimpleExpander<[string, string], HTMLButtonElement>((o) => {
    const el = $$("button", {
        text: o[0],
        style: {
            "background-color": o[1]
        },
        attrs: {
            "data-type": o[0],
        }
    });

    return el;
}).parse([
    ["Forest", "#14cc3a"],
    ["Town", "#66b7b7ff"],
    ["Ice", "#0f8ae3ff"],
    ["Facility", "#a911c7ff"],
    ["Desert", "#e5be0eff"],
    ["City", "#628c8eff"],
    ["Marble", "#bed0d1ff"],
    ["End Zone", "#fc0942ff"],
]);

var engine: _MD2engine;

export function _setEngine(e: _MD2engine) {
    engine = e;
}

export const blockGridExpander = new SimpleExpander<BlockInfo, HTMLElement>((o: BlockInfo) => {
    const el = $$("button", {
        text: o.name,
        attrs: {
            "data-name": o.texture,
        }
    });

    engine.dataManager.getTextureAsHTMLimage(o.texture, true)
    .then(img => el.appendChild(img));

    return el;
});

export const catDiv = $$("div", {
    children: categories,
});


new ToggleList(categories, el => {
    el.classList.add("active");
    
    const type = el.getAttribute("data-type") || "Forest";

    for(const el of blockCatRecord[type] || []) {
        el.style.display = "block";
    }
}, el => {
    el.classList.remove("active");

    const type = el.getAttribute("data-type") || "Forest";

    for(const el of blockCatRecord[type] || []) {
        el.style.display = "none";
    }
}, catDiv);
