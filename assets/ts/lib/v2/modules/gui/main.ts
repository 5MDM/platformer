import { $$ } from "../../../misc/util";
import { _MD2dataManager } from "../../data-loaders/data";
import { _MD2engine } from "../../engine";
import { MD2module } from "../main";
import { MD2GUIinventoryPart } from "./inventory";
import { MD2GUItopBarPart } from "./topBar";

export class MD2GUI extends MD2module {
    parts = {
        inventory: new MD2GUIinventoryPart(this),
        topBar: new MD2GUItopBarPart(this),
    };

    constructor(md2: _MD2engine) {
        super(md2);
    }

    appendToTarget(target: HTMLElement) {
        for(const name in this.parts) 
            if(this.parts[name].el)
                target.appendChild(this.parts[name].el);
    }
}