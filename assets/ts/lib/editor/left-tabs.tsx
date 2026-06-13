import { createContext, createRoot, createSignal, For, runWithOwner, useContext } from "solid-js";
import { $, $$, objToCSSstring, SimpleExpander, ToggleList } from "../misc/util";
import { createImageFromTexture } from "../v2/data-loaders/spritesheet-functions";
import { _MD2engine } from "../v2/engine";
import { BlockInfo, EntityInfo } from "../v2/types";
import { MDcreatorToolsUI } from "./creator-tools";

const [getCategories] = createSignal([
    ["Forest", "#14cc3a"],
    ["Entities", "#a911c7ff"],
    ["Town", "#66b7b7ff"],
    ["Ice", "#0f8ae3ff"],
    ["Desert", "#e5be0eff"],
    ["City", "#628c8eff"],
    ["End Zone", "#fc0942ff"],
]);

const [getStyle, setStyle] = createSignal<string>("");

const categoriesNew = createRoot((dipose) => {
    return <select onchange={(e) => {
        const category = e.target.options[e.target.selectedIndex];

        const color = category
        .getAttribute("data-color") || "";
        
        setStyle(color);
        MDcreatorToolsUI.currentCategorySignal[1](category.getAttribute("data-type") || "");
    }} class="editor-select" style={getStyle()}>
        <For each={getCategories()}>{([name, color]) => {
            const colorStyle = objToCSSstring({
                background: color
            });

            return <option 
                data-type={name} 
                data-color={colorStyle}
                style={colorStyle}>{name}</option>;
        }}</For>
    </select>;
});

export function _createLeftTabs(creatorToolsUI: MDcreatorToolsUI) {
    const engine = MDcreatorToolsUI.editor.engine;

    creatorToolsUI.blockExpander = new SimpleExpander<BlockInfo | EntityInfo, HTMLElement>((o: BlockInfo | EntityInfo) => {
        //console.log(o);
        
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

            createImageFromTexture(engine.dataManager, blockInfo.texture, true)
            .then(img => {                
                el.appendChild(img);
            });

            return el;
        }
    });
}

export const catDiv = <div id="categories">
    {categoriesNew}
</div>;

