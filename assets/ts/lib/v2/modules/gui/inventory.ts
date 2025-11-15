import { $$, createValIfDNE, getImageFromURL, ToggleState } from "../../../misc/util";
import { MD2GUIpart } from "./types";
import { MD2GUI } from "./main";
import { _MD2errorManager } from "../../errors";
import { _md2events, RegisterItemOpts } from "../../types";
import { createImageFromTexture } from "../../data-loaders/spritesheet-functions";

const itemsEl = $$("div", {
    attrs: {
        id: "item-grid"
    }
});

const bgEl = $$("div", {
    attrs: {
        id: "item-grid-bg"
    }
});

const sidebar = $$("div", {
    attrs: {
        id: "sidebar"
    },
});

const itemDiv = $$("div", {
    attrs: {
        id: "item-div"
    },
    children: [
        bgEl,
        itemsEl
    ]
});

const el = $$("div", {
    attrs: {
        id: "md2-inventory"
    },
    children: [
        itemDiv,
        sidebar
    ]
});

interface ItemHolder {
    numTextEl: HTMLSpanElement;
    div: HTMLDivElement;
    n: number;
}

export class MD2GUIinventoryPart extends MD2GUIpart {
    uniqueItems: Record<string, ItemHolder> = {};

    state = new ToggleState(() => {
        this.el.style.display = "flex";
    }, () => {
        this.el.style.display = "none";
    }, true);

    el: HTMLDivElement = el;

    constructor(gui: MD2GUI) {
        super(gui);
        this.state.disableIfOn();

        this.setupItemInfo();
    }

    itemInfo = {
        name: $$("h1"),
        img: $$("div"),
        desc: $$("p"),
    };

    setupItemInfo() {
        const itemInfoEl = $$("div", {
            attrs: {

            },
            children: [
                this.itemInfo.name,
                $$("br"),
                this.itemInfo.img,
                $$("br"),
                this.itemInfo.desc
            ]
        });

        sidebar.appendChild(itemInfoEl);
    }

    itemOnClick(e: PointerEvent, name: string, info: RegisterItemOpts) {
        const a = this.itemInfo;

        a.name.textContent = name;
        a.img.firstElementChild?.remove();
        a.desc.textContent = info.desc;

        a.img.appendChild(info.img);
    }

    updateSlot(name: string, n: number = 1) {
        if(!this.dataManager.registeredItems[name]) return _MD2errorManager.noItemFound(name);

        if(this.uniqueItems[name]) {
            this.uniqueItems[name].n += n;
            this.uniqueItems[name].numTextEl.textContent = n.toString();

            return;
        }

        // if item DNE
        const src = this.dataManager.registeredItems[name].texture;

        const numTextEl = $$("span", {
            text: n.toString(),
        });

        const text = $$("p", {
            text: name,
            children: [numTextEl]
        });

        const div = $$("div", {
            attrs: {
                id: "slot"
            },
            children: [
                text
            ]
        });

        itemsEl.appendChild(div);

        this.uniqueItems[name] = {
            n,
            div,
            numTextEl,
        };

        createImageFromTexture(this.gui.md2.dataManager, src)
        .then(img => {
            img.onpointerup = e => this.itemOnClick(e, name, this.dataManager.registeredItems[name]);
            div.prepend(img);
        });

        this.events.emit("item-add");
    }

    removeItem(name: string, n: number = 1) {
        this.uniqueItems[name].n -= n;

        if(this.uniqueItems[name].n <= 0)
            this.uniqueItems[name].div.remove();

        this.events.emit("item-remove");
    }
}