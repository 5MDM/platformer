import { $$, NOOP } from "./util";

export class ElList<T> {
    selectClassName: string;

    elementCreator: (opts: T) => Promise<HTMLElement>;

    flags: Record<string, boolean> = {};

    onUp: (el: HTMLElement) => void;

    constructor(
        selectClassName: string, 
        elementCreator: (opts: T) => Promise<HTMLElement>, 
        onUp: (el: HTMLElement) => void
    ) {
        this.elementCreator = elementCreator;
        this.selectClassName = selectClassName;
        this.onUp = onUp;
    }

    async parse(arr: T[], parent: HTMLElement) {
        const elements: HTMLElement[] = [];

        for(const i of arr)
            elements.push(await this.elementCreator(i));

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

export function tr(...args: HTMLElement[]): HTMLTableRowElement {
    return $$("tr", {children: args});
}

export class MD2Columntable {
    el: HTMLTableElement = $$("table");
    tables: Record<string, MD2Columntable> = {};

    constructor() {}

    getTable(arr: string[]): MD2Columntable | void {
        if(arr.length <= 0) return;
        var current: MD2Columntable;

        for(const prop of arr) {
            current = this.tables[prop];
            if(!current) throw new Error(
                `el.ts: can't find property "${arr.join(".")}"`
            );
        }
    }

    addTable(name: string) {
        const table = new MD2Columntable();
        this.tables[name] = table;
    }

    createRow(name: string, val: string): HTMLTableRowElement {
        return tr(
            $$("td", {
                text: name,
            }),
            $$("td", {
                text: val,
            }),
        );
    }

    static TDstyle = {
        border: "1px solid black",
        padding: "5px",
        "background-color": "#bbbbbb",
    };

    static TRstyle = {
        width: "100%",
        border: "2px solid red",
        "border-collapse": "seperate",
    };

    static HRstyle = {
        width: "100%",
        margin: "0 auto",
        border: "3px solid darkblue",
    };

    static TableStyle = {
        "border-bottom": "2px solid darkblue",
    };

    private td(text: string, style: Record<string, any>): HTMLTableCellElement {
        return $$("td", {text, style});
    }

    private editObj(ref: string[], val: string) {
        var og = this.currentObj;
        var current: any = og;

        const nowRef = [...ref];
        nowRef.pop();

        for(const i of nowRef) {
            if(!current) throw new Error(
                `el.ts: deep object editing error. Reference "${ref.join(".")}" is invalid with "${i}" or before`
            );
            current = current[i];
        }

        current[ref[ref.length-1]] = val;
        this.currentObj = og;
    }

    private tdInput<T>(text: string, ref: string[]): HTMLTableCellElement {
        const input = $$("input", {
            attrs: {
                value: text,
            }
        });

        const el = $$("td", {
            style: MD2Columntable.TDstyle,
            children: [
                input,
            ],
        });

        console.log(ref);

        el.addEventListener("input", () => this.editObj(ref, input.value));

        return el;
    }

    currentObj: Record<string, any> = {};

    private parseInnerJSON<T extends Object>(obj: T, parentRef?: string[]): [HTMLTableElement, string[]] {
        const ref: string[] = [];
        
        const el = $$("table", {
            style: MD2Columntable.TableStyle,
        });

        for(const i in obj) {
            const children = [];
            const io = obj[i];
            ref.push(i);

            if(io instanceof Object) {
                const [child, iref] = this.parseInnerJSON(io, ref);
                ref.push(...iref);

                children.push($$("tr", {
                    style: MD2Columntable.TRstyle,
                    children: [
                        $$("td", {text: i + ": "}),
                        child,
                    ]
                }));
            } else {
                const nameEl = this.td(i, MD2Columntable.TDstyle);

                var ref0 = ref;
                if(parentRef) ref0 = parentRef;

                if(typeof io == "string") children.push(tr(
                    nameEl,
                    this.tdInput<T>(io, ref0)
                )); else if(Array.isArray(io)) children.push(tr(
                    nameEl,
                    this.tdInput<T>(`[${io.join(", ")}]`, ref0),
                )); else if(!io) children.push(tr(
                    nameEl,
                    this.tdInput<T>("Undefined", ref0),
                )); else children.push(tr(
                    nameEl,
                    this.tdInput<T>(`${io}`, ref0),
                ));
            }

            el.append(...children);

            ref.pop();
        }

        return [el, ref];
    }

    parseJSON<T extends Object>(obj: T): HTMLTableElement {
        this.currentObj = obj;
        const el = this.parseInnerJSON<T>(obj)[0];
        el.style = "";

        return el;

        //this.el.appendChild(table);
    }
}

export function jsonToEl(style: Record<string, string>, json: Record<string, Record<string, any>>): HTMLTableElement {
    const children: HTMLTableRowElement[] = [
        tr(
            $$("th", {text: "Component Name"}),
            $$("th", {text: "Component Values"}),
        )
    ];

    for(const key in json) {
        const arr: HTMLTableRowElement[] = []

        for(const key2 in json[key]) {
            arr.push(tr(
                $$("td", {
                    style: {
                        padding: "2px",
                    },
                    text: key2 + ": "
                }),
                $$("td", {
                    text: `${json[key][key2]}`,
                    style: {"background-color": "lightgray", padding: "5px"},
                }),
            ));
        }

        children.push(tr(
            $$("td", {
                text: key,
            }),
            $$("td", {
                children: [
                    $$("table", {
                        style,
                        children: arr
                    })
                ]
            }),
        ));
    }

    return $$("table", {
        style,
        children,
    });
}

export class MixedList {
    lastSelectedEl?: HTMLElement;

    onSelect = NOOP<[HTMLElement, PointerEvent]>;
    onUnselect = NOOP<[HTMLElement, PointerEvent]>;

    readonly isRecording: boolean;
    private map?: Map<HTMLElement, (e: PointerEvent) => void>;

    wasBinded = false;

    constructor(record = false) {
        this.isRecording = record;
        if(this.isRecording) this.map = new Map();
    }

    private selectEvent(el: HTMLElement, e: PointerEvent) {
        if(this.lastSelectedEl) this.onUnselect(this.lastSelectedEl, e);
        this.onSelect(el, e);
        this.lastSelectedEl = el;
    }

    static attributeName = "md-util-el-no-bind";

    static needsBind(el: HTMLElement): boolean {
        return el.getAttribute(MixedList.attributeName) != "true";
    }

    static markAsNotNeedingBind(el: HTMLElement) {
        el.setAttribute(MixedList.attributeName, "true");
    }

    bind(arr: HTMLElement[]) {
        if(this.wasBinded) this.clearBinds();

        this.wasBinded = true;
        if(this.isRecording) for(const el of arr) {
            if(!MixedList.needsBind(el)) continue;
            const f = (e: PointerEvent) => this.selectEvent(el, e);
            el.addEventListener("pointerup", f);

            this.map!.set(el, f);
        } else for(const el of arr) {
            if(!MixedList.needsBind(el)) continue;
            el.addEventListener("pointerup", e => this.selectEvent(el, e));
        }

        return this;
    }

    setFunctions(
        select?: (el: HTMLElement, e: PointerEvent) => void,
        unselect?: (el: HTMLElement, e: PointerEvent) => void
    ) {
        if(select) this.onSelect = select;
        if(unselect) this.onUnselect = unselect;
        return this;
    }

    clearBinds() {
        if(!this.isRecording) throw new Error(
            "el.ts: can't clear binds"
        );

        this.map!.forEach((listener, el) => {
            el.removeEventListener("pointerup", listener);
        });

        this.map!.clear();
    }
}