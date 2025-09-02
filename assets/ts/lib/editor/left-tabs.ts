import { $$, SimpleExpander, ToggleList } from "../misc/util";
import { _MD2engine } from "../v2/engine";
import { BlockInfo, EntityInfo } from "../v2/types";
import { MDcreatorToolsUI } from "./creator-tools";

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
    ["Entities", "#a911c7ff"],
    ["Forest", "#14cc3a"],
    ["Town", "#66b7b7ff"],
    ["Ice", "#0f8ae3ff"],
    ["Desert", "#e5be0eff"],
    ["City", "#628c8eff"],
    ["End Zone", "#fc0942ff"],
]);

export function _createLeftTabs(creatorToolsUI: MDcreatorToolsUI) {
    const engine = creatorToolsUI.editor.engine;

    new ToggleList(categories, el => {
        el.classList.add("active");
        
        const type = el.getAttribute("data-type") || "Forest";

        for(const el of MDcreatorToolsUI.blockCatRecord[type] || []) {
            el.style.display = "block";
        }
    }, el => {
        el.classList.remove("active");

        const type = el.getAttribute("data-type") || "Forest";

        for(const el of MDcreatorToolsUI.blockCatRecord[type] || []) {
            el.style.display = "none";
        }
    }, catDiv);

    creatorToolsUI.blockExpander = new SimpleExpander<BlockInfo | EntityInfo, HTMLElement>((o: BlockInfo | EntityInfo) => {
        if((o as BlockInfo).texture == undefined) {
            const entityInfo = o as EntityInfo;

            const sampleName: string = entityInfo.textures[Object.keys(entityInfo.textures)[0]];

            const el = $$("button", {
                text: o.name,
                attrs: {
                    "data-name": sampleName,
                    "data-type": "entity",
                }
            });

            engine.dataManager.getTextureAsHTMLimage(sampleName, false)
            .then(img => el.appendChild(img));

            return el;
        } else {
            const blockInfo = o as BlockInfo;

            const el = $$("button", {
                text: o.name,
                attrs: {
                    "data-name": blockInfo.texture,
                    "data-type": "block"
                }
            });

            engine.dataManager.getTextureAsHTMLimage(blockInfo.texture, true)
            .then(img => el.appendChild(img));

            return el;
        }
    });
}

export const catDiv = $$("div", {
    attrs: {
        id: "categories",
    },
    children: categories,
});

