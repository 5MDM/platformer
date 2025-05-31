import { $$ } from "./util";

export class ElList<T> {
    selectClassName: string;

    elementCreator: (opts: T) => HTMLElement;

    flags: Record<string, boolean> = {};

    onUp: (el: HTMLElement) => void;

    constructor(
        selectClassName: string, 
        elementCreator: (opts: T) => HTMLElement, 
        onUp: (el: HTMLElement) => void
    ) {
        this.elementCreator = elementCreator;
        this.selectClassName = selectClassName;
        this.onUp = onUp;
    }

    parse(arr: T[], parent: HTMLElement) {
        const elements: HTMLElement[] = [];

        for(const i of arr)
            elements.push(this.elementCreator(i));

        for(const element of elements) {
            element.addEventListener("pointerup", () => this.onUp(element))
            parent.appendChild(element);
        }
    }
}

type InputF = ((num: number) => string) | true;

interface MDsliderOpts {
    min: number;
    max: number;
    default: number;
    step?: number;
    markers?: number[];
    id: string;
    inputF?: InputF;
}

export class MDslider {
    el: HTMLInputElement;
    defaultValue: number;
    private inputF?: (n: number) => string;

    markerEl?: HTMLDataListElement;
    inputValueEl?: HTMLParagraphElement;

    constructor(o: MDsliderOpts) {
        this.defaultValue = o.default;

        this.el = $$("input", {
            attrs: {
                type: "range",
                min: o.min.toString(),
                max: o.max.toString(),
                value: o.default.toString(),
                step: o.step?.toString() || "1",
                id: o.id,
                
            },
        });

        if(o.markers) 
            this.setupMarker(o.id + "-marker", o.markers);
        
        if(o.inputF)
            this.setupInputF(o.inputF, o.default);
    }

    private setupInputF(f: InputF, defaultVal: number) {
        if(f === true) {
            this.inputValueEl = $$("p", {
                text: defaultVal.toString(),
            });

            this.el.addEventListener("input", () => {
                this.inputValueEl!.textContent = this.el.value;
            });
        } else {
            this.inputF = f;
            this.inputValueEl = $$("p", {
                text: f(defaultVal),
            });

            this.el.addEventListener("input", () => {
                this.inputValueEl!.textContent = f(Number(this.el.value));
            });
        }
    }

    setValue(n: number) {
        this.el.value = n.toString();
        if(this.inputValueEl) this.inputValueEl.textContent = this.inputF ? this.inputF(n) : n.toString();
        //this.el.value = this.inputF ? this.inputF(n) : n.toString();
    }

    private setupMarker(markerId: string, markers: number[]) {
        const children: HTMLOptionElement[] = [];

        for(const num of markers) children.push($$("option", {
            attrs: {
                value: num.toString(),
            }
        }));

        this.markerEl = $$("datalist", {
            attrs: {
                id: markerId,
            },
            children,
        });

        this.el.setAttribute("list", markerId);

    }

    appendTo(el: HTMLElement) {
        el.appendChild(this.el);
        if(this.markerEl) el.appendChild(this.markerEl);
        if(this.inputValueEl) el.appendChild(this.inputValueEl);
    }
}