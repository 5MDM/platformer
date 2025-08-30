import { $$ } from "../util";

export class MDtab {
    isAttached = false;

    parentEL!: HTMLElement;
    el = $$("div");
    content?: HTMLElement;
    tabArea = $$("div");

    tabs: Record<string, MDtab> = {};

    constructor() {
       this.el.appendChild(this.tabArea);
    }

    addContent(el: HTMLElement) {
        this.content = el;
        this.el.appendChild(this.content);
        return this;
    }

    getTabElAsArray(): HTMLElement[] {
        const arr1 = Object.values(this.tabs);
        const arr2: HTMLElement[] = [];

        for(const i of arr1) arr2.push(i.el);

        return arr2;
    }

    attatch(el: HTMLElement) {
        if(this.isAttached) throw new Error();
        this.parentEL = el;
        this.parentEL.appendChild(this.el);
        return this;
    }

    addTab(name: string, tab: MDtab) {
        this.tabs[name] = tab;
        this.tabArea.appendChild(tab.el);
        return this;
    }

    addTabs(arr: [string, MDtab][]) {
        for(const [name, tab] of arr) this.addTab(name, tab);
        return this;
    }
}