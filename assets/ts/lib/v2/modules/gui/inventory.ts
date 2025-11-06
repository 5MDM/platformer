import { $$, createValIfDNE, getImageFromURL, ToggleState } from "../../../misc/util";
import { MD2GUIpart } from "./types";
import { MD2GUI } from "./main";
import { _MD2errorManager } from "../../errors";

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

type ConsumeItem = boolean | void;

interface RegisterItemOpts {
    texture: string;
    useEvent: string;
    desc: string;
    img: HTMLImageElement;
}

interface ItemHolder {
    numTextEl: HTMLSpanElement;
    div: HTMLDivElement;
    n: number;
}

export class MD2GUIinventoryPart extends MD2GUIpart {
    registeredItems: Record<string, RegisterItemOpts> = {};
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
        a.desc.innerText = info.desc;

        a.img.appendChild(info.img);
    }

    logRegisteredItems() {
        console.log(this.registeredItems);
    }

    addItem(name: string, n: number = 1) {
        if(!this.registeredItems[name]) return _MD2errorManager.noItemFound(name);

        if(this.uniqueItems[name]) return this.uniqueItems[name].n += n;

        // if item DNE
        const src = this.registeredItems[name].texture;

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

        this.gui.md2.dataManager.getTextureAsHTMLimage(src)
        .then(img => {
            img.onpointerup = e => this.itemOnClick(e, name, this.registeredItems[name]);
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

    registerItem(name: string, o: RegisterItemOpts) {
        this.registeredItems[name] = o;
    }
}