import { $$ } from "../../../misc/util";
import { MD2GUI } from "./main";
import { MD2GUIpart } from "./types";

const menuBtn = $$("button", {
    text: "Inventory"
});

const el = $$("div", {
    attrs: {
        id: "topBar"
    },
    children: [
        menuBtn
    ]
});

export class MD2GUItopBarPart extends MD2GUIpart {
    el: HTMLDivElement = el;

    constructor(gui: MD2GUI) {
        super(gui);

        el.addEventListener("pointerup", () => gui.parts.inventory.state.toggle());
    }


}